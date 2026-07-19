// =====================================================================
// Imposter — Discord embeds
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const {
    MIN_PLAYERS,
    MAX_PLAYERS,
    LOBBY_SECONDS,
    NIGHT_SECONDS,
    DAY_SECONDS,
    VOTE_SECONDS,
    COLORS,
} = require('./constants');
const { ROLES, imposterCount, roleLabel } = require('./roles');
const { fetchName, alivePlayers } = require('./utils');

function countdown(seconds) {
    return `<t:${Math.floor(Date.now() / 1000) + seconds}:R>`;
}

async function lobbyEmbed(game, client) {
    const hostName = await fetchName(game.hostId, client);
    const shown = [...game.players.keys()].slice(0, 30);
    const names = await Promise.all(shown.map(async uid => `• ${await fetchName(uid, client)}`));
    const more = game.players.size > shown.length
        ? `\n...iyo ${game.players.size - shown.length} kale`
        : '';

    const expected = game.players.size >= MIN_PLAYERS
        ? imposterCount(game.players.size)
        : '—';

    return new EmbedBuilder()
        .setColor(COLORS.lobby)
        .setTitle('🎭 Qolka Ciyaarta')
        .setDescription(
            `**👑 Martigeliyaha:** ${hostName}\n` +
            `**👥 Ciyaartoyda (${game.players.size}/${MAX_PLAYERS}):**\n` +
            `${names.join('\n') || '_Weli ciyaartoy ma jiraan_'}${more}\n\n` +
            `Ugu yaraan: **${MIN_PLAYERS} ciyaartoy**\n` +
            `⌛ Qolka wuxuu xirmayaa ${countdown(LOBBY_SECONDS)} (martigeliyuhu wuu bilaabi karaa wakhti kasta)\n` +
            `🗡️ Imposters marka la bilaabo: **${expected}**\n\n` +
            `_Miisaan: 3-5->1 · 6-10->2 · 11-15->3 · 16-20->4_`
        )
        .setFooter({ text: 'Garaad Bot • Imposter' });
}

function startingEmbed() {
    return new EmbedBuilder()
        .setColor(COLORS.starting)
        .setTitle('🎭 Ciyaartu Way Bilaabanaysaa...')
        .setDescription('Doorkaaga waxaa lagugu soo dirayaa DM. Diyaar garow!');
}

function lobbyClosedEmbed() {
    return new EmbedBuilder()
        .setColor(COLORS.neutral)
        .setTitle('🎭 Qolka Ciyaarta Wuu Xirmay')
        .setDescription(`Waxaa loo baahan yahay ugu yaraan **${MIN_PLAYERS} ciyaartoy** si ciyaartu u bilaabato.`);
}

async function gameStartEmbed(game, client, imposterIds) {
    const playerIds = [...game.players.keys()];
    const playerList = await Promise.all(
        playerIds.slice(0, 40).map(async uid => `• ${await fetchName(uid, client)}`)
    );
    const extra = playerIds.length > playerList.length
        ? `\n...iyo ${playerIds.length - playerList.length} kale`
        : '';

    return new EmbedBuilder()
        .setColor(COLORS.lobby)
        .setTitle('🎭 Ciyaartu Way Bilaabatay!')
        .setDescription(
            `**${playerIds.length}** ciyaartoy ayaa galay.\n\n` +
            `${playerList.join('\n')}${extra}\n\n` +
            `🗡️ Imposters: **${imposterIds.length}**\n` +
            `👤 Shacab: **${playerIds.length - imposterIds.length}**\n\n` +
            `DM-kaaga ka eeg doorkaaga.`
        );
}

function roleDmEmbed(role, teammateMentions = '') {
    const info = ROLES[role];
    return new EmbedBuilder()
        .setColor(info.color)
        .setTitle(`${info.emoji} Doorkaaga: ${info.name}`)
        .setDescription(
            `Waxaad tahay **${info.name}**.\n\n` +
            `${info.dm}${teammateMentions}\n\n` +
            `Doorkaaga sir ka dhig.`
        );
}

function nightPhaseEmbed(round) {
    return new EmbedBuilder()
        .setColor(COLORS.night)
        .setTitle(`🌙 Habeen — Wareegga ${round}`)
        .setDescription(
            `Magaaladu way aamustay...\n\n` +
            `🗡️ Imposters waxay DM ku dooranayaan dhibbanaha.\n` +
            `⏳ Waxaa harsan ${countdown(NIGHT_SECONDS)}`
        );
}

function nightPickEmbed(page, pages) {
    return new EmbedBuilder()
        .setColor(COLORS.night)
        .setTitle('🗡️ Dooro Dhibbane')
        .setDescription(`Si qarsoodi ah ugu codee hal Shacab oo la saaro.\nBogga **${page + 1}/${pages}**`);
}

function morningEmbed(description) {
    return new EmbedBuilder()
        .setColor(COLORS.elimination)
        .setTitle('📢 Warbixinta Subaxda')
        .setDescription(description);
}

async function dayPhaseEmbed(game, client) {
    const alive = alivePlayers(game);
    const shown = alive.slice(0, 40);
    const names = await Promise.all(shown.map(async ([uid]) => `• ${await fetchName(uid, client)}`));
    const extra = alive.length > shown.length
        ? `\n...iyo ${alive.length - shown.length} kale`
        : '';

    return new EmbedBuilder()
        .setColor(COLORS.day)
        .setTitle(`☀️ Subax — Wareegga ${game.round}`)
        .setDescription(
            `💬 Ka dooda qofka Imposter noqon kara.\n\n` +
            `**Ciyaartoyda nool (${alive.length}):**\n${names.join('\n')}${extra}\n\n` +
            `🗳️ Codbixintu waxay bilaabanaysaa ${countdown(DAY_SECONDS)}.`
        );
}

function votingPhaseEmbed(round, page, pages) {
    return new EmbedBuilder()
        .setColor(COLORS.voting)
        .setTitle(`🗳️ Codbixin — Wareegga ${round}`)
        .setDescription(
            `U codee ciyaartoy la saarayo.\n\n` +
            `Bogga **${page + 1}/${pages}**\n` +
            `⏳ Waxaa harsan ${countdown(VOTE_SECONDS)}`
        );
}

function voteResultEmbed(description) {
    return new EmbedBuilder()
        .setColor(COLORS.elimination)
        .setTitle('🗳️ Natiijada Codbixinta')
        .setDescription(description);
}

async function gameOverEmbed(game, client, winner) {
    const citizensWon = winner === 'citizens';
    const roleReveal = await Promise.all([...game.players.entries()].map(async ([uid, player]) => {
        const name = await fetchName(uid, client);
        return `${player.alive ? '✅' : '☠️'} **${name}** — ${roleLabel(player.role)}`;
    }));
    const revealText = roleReveal.join('\n');
    const safeReveal = revealText.length > 3000
        ? `${revealText.slice(0, 3000)}\n...and more`
        : revealText;

    return new EmbedBuilder()
        .setColor(citizensWon ? COLORS.citizensWin : COLORS.impostersWin)
        .setTitle(citizensWon ? '🏆 Guuleystayaasha Shacabka' : '🏆 Guuleystayaasha Imposters')
        .setDescription(
            (citizensWon
                ? 'Dhammaan Imposters-ka waa la saaray.'
                : 'Imposters-ku way la egyihiin ama way ka badan yihiin Shacabka.') +
            `\n\n**Doorarka:**\n${safeReveal}`
        )
        .setFooter({ text: 'Garaad Bot • Imposter' });
}

module.exports = {
    lobbyEmbed,
    startingEmbed,
    lobbyClosedEmbed,
    gameStartEmbed,
    roleDmEmbed,
    nightPhaseEmbed,
    nightPickEmbed,
    morningEmbed,
    dayPhaseEmbed,
    votingPhaseEmbed,
    voteResultEmbed,
    gameOverEmbed,
};
