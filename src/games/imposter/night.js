// =====================================================================
// Imposter — night phase
// =====================================================================

const { NIGHT_SECONDS } = require('./constants');
const { isImposter } = require('./roles');
const {
    fetchName,
    alivePlayers,
    aliveCitizens,
    targetRows,
    tallyVotes,
} = require('./utils');
const {
    nightPhaseEmbed,
    nightPickEmbed,
    morningEmbed,
} = require('./embeds');

async function beginNight(game, client) {
    game.phase = 'night';
    game.nightActions = { imposterVotes: new Map() };
    game.busyUsers = new Set();

    await game.textChannel.send({ embeds: [nightPhaseEmbed(game.round)] });

    const alive = alivePlayers(game);
    const targets = aliveCitizens(game);

    for (const [uid, player] of alive) {
        if (!isImposter(player.role) || !targets.length) continue;

        try {
            const user = await client.users.fetch(uid);
            const { rows, page, pages } = await targetRows(
                targets,
                client,
                `imp_night_kill_${game.guildId}`,
                `imp_page_night_${game.guildId}`,
                0
            );
            await user.send({
                embeds: [nightPickEmbed(page, pages)],
                components: rows,
            }).catch(() => {});
        } catch { /* DM closed */ }
    }

    clearTimeout(game.nightTimer);
    game.nightTimer = setTimeout(() => resolveNight(game, client), NIGHT_SECONDS * 1000);
}

async function resolveNight(game, client) {
    const { beginDay } = require('./day');

    clearTimeout(game.nightTimer);
    if (game.phase !== 'night') return;
    game.phase = 'resolving';

    const votes = game.nightActions?.imposterVotes || new Map();
    let killed = null;
    let mysterious = false;

    if (votes.size) {
        const sorted = tallyVotes(votes);
        if (sorted.length) killed = sorted[0][0];
    } else {
        const victims = aliveCitizens(game);
        if (victims.length) {
            killed = victims[Math.floor(Math.random() * victims.length)][0];
            mysterious = true;
        }
    }

    let desc = '🛡️ Caawa qofna lama dilin.';

    if (killed && game.players.get(killed)?.alive) {
        game.players.get(killed).alive = false;
        const name = await fetchName(killed, client);

        if (mysterious) {
            desc = `👻 Caawa Imposter-ku qof ma dooran.\n\n☠️ **${name}** oo Shacab ah ayaa si qarsoodi ah u lumay.`;
        } else {
            desc = `☠️ **${name}** ayaa habeenkii la dilay.\nWuxuu ahaa **👤 Shacab**.`;
        }

        try {
            const user = await client.users.fetch(killed);
            await user.send('☠️ Habeenkii ayaa lagaa saaray. Ciyaarta waad ka baxday.').catch(() => {});
        } catch { /* ignore */ }
    }

    await game.textChannel.send({ embeds: [morningEmbed(desc)] });
    return beginDay(game, client);
}

module.exports = {
    beginNight,
    resolveNight,
};
