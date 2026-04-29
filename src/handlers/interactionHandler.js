// =====================================================================
// GARAAD BOT - Maareynta Isdhexgalka (Interaction Handler)
// =====================================================================

const { MessageFlags }              = require('discord.js');
const { handleSoloAnswer }          = require('../games/solo');
const { startDuelGame }             = require('../games/duel');
const { startFourrowGame, handleDrop: handleFourrowDrop, MIN_XP_TO_PLAY: FOURROW_MIN_XP } = require('../games/fourrow');
const { sendRushQuestion }          = require('../games/rush');
const { beginQuizGame, refreshLobby } = require('../games/quiz');
const { userData, saveData, activeBets, activeRush, activeQuiz, isUserBusy } = require('../store');
const { checkUser, getLevel, addXp } = require('../utils/helpers');
const { QUIZ_MIN_PLAYERS, QUIZ_MAX_PLAYERS } = require('../config');
const { EmbedBuilder }              = require('discord.js');

module.exports = function setupInteractionHandler(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        const id = interaction.customId;

        // ── Xidhitaanka Caawin ────────────────────────────────────────
        if (id.startsWith('close_help_')) {
            const ownerId = id.split('_')[2];
            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: 'Adiga ma lihid.', flags: MessageFlags.Ephemeral });
            }
            return interaction.message.delete().catch(() => {});
        }

        // ── Duel: Aqbal ───────────────────────────────────────────────
        if (id.startsWith('accept_duel_')) {
            const parts    = id.split('_');
            const authorId = parts[2];
            const targetId = parts[3];
            const count    = parseInt(parts[4] || '0'); // 0 = bot wuxuu weydiinayaa
            if (interaction.user.id !== targetId) {
                return interaction.reply({ content: 'Adiga laguma casuumin.', flags: MessageFlags.Ephemeral });
            }
            // Hubi labadoodaba inaan ciyaar kale ku jirin
            const aBusy = isUserBusy(authorId);
            if (aBusy) {
                return interaction.reply({ content: `Casuumaha mar hore wuxuu ku jiraa ciyaar **${aBusy}**.`, flags: MessageFlags.Ephemeral });
            }
            const tBusy = isUserBusy(targetId);
            if (tBusy) {
                return interaction.reply({ content: `Adigu mar hore waxaad ku jirtaa ciyaar **${tBusy}**.`, flags: MessageFlags.Ephemeral });
            }
            await interaction.update({
                content:    `⚔️ <@${targetId}> wuu aqbalay! Dagaalku wuu bilaabmayaa...`,
                embeds:     [],
                components: [],
            });
            return startDuelGame(interaction.channel, authorId, targetId, count);
        }

        // ── Duel: Diid ────────────────────────────────────────────────
        if (id.startsWith('decline_duel_')) {
            const targetId = id.split('_')[3];
            if (interaction.user.id !== targetId) {
                return interaction.reply({ content: 'Adiga laguma casuumin.', flags: MessageFlags.Ephemeral });
            }
            return interaction.update({ content: '❌ Duel waa la diiday.', embeds: [], components: [] });
        }

        // ── Solo: Jawaab ──────────────────────────────────────────────
        if (id.startsWith('q_')) {
            return handleSoloAnswer(interaction);
        }

        // ── 4-Row: Aqbal ──────────────────────────────────────────────
        if (id.startsWith('accept_4row_')) {
            const parts    = id.split('_');
            const authorId = parts[2];
            const targetId = parts[3];
            if (interaction.user.id !== targetId) {
                return interaction.reply({ content: 'Adiga laguma casuumin.', flags: MessageFlags.Ephemeral });
            }
            const aBusy = isUserBusy(authorId);
            if (aBusy) {
                return interaction.reply({ content: `Casuumaha mar hore wuxuu ku jiraa ciyaar **${aBusy}**.`, flags: MessageFlags.Ephemeral });
            }
            const tBusy = isUserBusy(targetId);
            if (tBusy) {
                return interaction.reply({ content: `Adigu mar hore waxaad ku jirtaa ciyaar **${tBusy}**.`, flags: MessageFlags.Ephemeral });
            }
            // ⭐ Hubi mar kale XP-ga (waxaa laga yaabaa inuu xaalku is bedelay codsiga ka dib)
            checkUser(authorId); checkUser(targetId);
            if (userData[authorId].xp < FOURROW_MIN_XP) {
                return interaction.reply({ content: `Casuumaha ma haysto XP ku filan (${FOURROW_MIN_XP} XP loo baahan yahay).`, flags: MessageFlags.Ephemeral });
            }
            if (userData[targetId].xp < FOURROW_MIN_XP) {
                return interaction.reply({ content: `Adigu ma haysid XP ku filan! Waxaad u baahan tahay **${FOURROW_MIN_XP} XP**, hadda waxaad haysataa **${userData[targetId].xp} XP**.`, flags: MessageFlags.Ephemeral });
            }
            await interaction.update({
                content:    `🎯 <@${targetId}> wuu aqbalay! Ciyaartu wey bilaabmaysaa...`,
                embeds:     [],
                components: [],
            });
            return startFourrowGame(interaction.channel, authorId, targetId);
        }

        // ── 4-Row: Diid ───────────────────────────────────────────────
        if (id.startsWith('decline_4row_')) {
            const targetId = id.split('_')[3];
            if (interaction.user.id !== targetId) {
                return interaction.reply({ content: 'Adiga laguma casuumin.', flags: MessageFlags.Ephemeral });
            }
            return interaction.update({ content: '❌ 4-Row codsi waa la diiday.', embeds: [], components: [] });
        }

        // ── 4-Row: Riix column ────────────────────────────────────────
        if (id.startsWith('4row_drop_')) {
            return handleFourrowDrop(interaction);
        }

        // ── Bet: Jawaab ───────────────────────────────────────────────
        if (id.startsWith('bet_')) {
            const parts   = id.split('_');
            const ownerId = parts[2];
            const result  = parts[3]; // 't' ama 'f'
            const amount  = parseInt(parts[4]);

            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: 'Khamaartaada qoro!', flags: MessageFlags.Ephemeral });
            }

            await interaction.deferUpdate();
            const bet = activeBets.get(ownerId);
            if (!bet) return;

            checkUser(ownerId);
            let resultMsg;
            if (result === 't') {
                userData[ownerId].iq += 20;
                addXp(ownerId, 10);
                userData[ownerId].stats.betsWon++;
                resultMsg = `✅ SAX! +20 IQ / +10 XP\nIQ-gaaga hadda: **${userData[ownerId].iq}** (Level ${getLevel(userData[ownerId].iq)})`;
            } else {
                userData[ownerId].iq = Math.max(0, userData[ownerId].iq - amount);
                userData[ownerId].stats.betsLost++;
                resultMsg = `❌ QALAD! −${amount} IQ\nJawaabta saxda: **${bet.correct}**\nIQ-gaaga hadda: **${userData[ownerId].iq}** (Level ${getLevel(userData[ownerId].iq)})`;
            }

            activeBets.delete(ownerId);
            saveData();

            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setFields({ name: 'Natiijo', value: resultMsg });

            return interaction.editReply({ embeds: [updatedEmbed], components: [] });
        }

        // ── Rush: Jawaab ──────────────────────────────────────────────
        if (id.startsWith('rush_')) {
            const parts   = id.split('_');
            const ownerId = parts[2];
            const result  = parts[3]; // 't' ama 'f'

            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: 'Ciyaartaada qoro!', flags: MessageFlags.Ephemeral });
            }

            // Rush collector-ku wuxuu maareeyaa — interaction-ku waa la isha mariyaa
            return;
        }

        // ── Quiz Koox: Ku biir ────────────────────────────────────────
        if (id.startsWith('quiz_join_')) {
            const channelId = id.replace('quiz_join_', '');
            const state     = activeQuiz.get(channelId);

            if (!state || state.started) {
                return interaction.reply({ content: 'Lobby ma jiro ama wuu bilaabmay.', flags: MessageFlags.Ephemeral });
            }
            if (state.players.has(interaction.user.id)) {
                return interaction.reply({ content: 'Mar hore ayaad ku jirtaa lobby-ga.', flags: MessageFlags.Ephemeral });
            }
            // ⭐ Cap sare oo qarsoon (ma xadidna oo dhab ah)
            if (state.players.size >= QUIZ_MAX_PLAYERS) {
                return interaction.reply({ content: 'Lobby-gu wuu buuxsamay.', flags: MessageFlags.Ephemeral });
            }
            const busy = isUserBusy(interaction.user.id);
            if (busy) {
                return interaction.reply({ content: `Waxaad mar hore ku jirtaa ciyaar **${busy}**! Sug ilaa ay dhammaato.`, flags: MessageFlags.Ephemeral });
            }

            state.players.add(interaction.user.id);
            state.scores[interaction.user.id] = 0;
            await interaction.deferUpdate().catch(() => {});
            // ⭐ Hadda hostka kaliya ayaa bilaabaya — ma jiro auto-start
            return refreshLobby(state);
        }

        // ── Quiz Koox: Ka bax ─────────────────────────────────────────
        // ⭐ Hadda hostka waa ka bixi karaa — host cusub waa qofka xiga
        if (id.startsWith('quiz_leave_')) {
            const channelId = id.replace('quiz_leave_', '');
            const state     = activeQuiz.get(channelId);

            if (!state || state.started) {
                return interaction.reply({ content: 'Lobby ma jiro ama wuu bilaabmay.', flags: MessageFlags.Ephemeral });
            }
            if (!state.players.has(interaction.user.id)) {
                return interaction.reply({ content: 'Lobby kuma jirtid.', flags: MessageFlags.Ephemeral });
            }

            const wasHost = interaction.user.id === state.hostId;
            state.players.delete(interaction.user.id);
            delete state.scores[interaction.user.id];

            // Lobby waa la xidhayaa haddii cidina hadhin
            if (state.players.size === 0) {
                if (state.lobbyTimer) clearTimeout(state.lobbyTimer);
                activeQuiz.delete(channelId);
                await interaction.deferUpdate().catch(() => {});
                if (state.message) {
                    await state.message.edit({
                        embeds: [new EmbedBuilder()
                            .setTitle('🚪 Lobby waa la xidhay')
                            .setDescription('Cidina kuma harin lobby-ga.')
                            .setColor('#7f8c8d')],
                        components: [],
                    }).catch(() => {});
                }
                return;
            }

            // ⭐ Wareeji hostnimada haddii hostkii ka baxay
            let hostTransferMsg = null;
            if (wasHost) {
                state.hostId = [...state.players][0];
                hostTransferMsg = `👑 Hostkii hore wuu ka baxay — host cusub waa <@${state.hostId}>.`;
            }

            await interaction.deferUpdate().catch(() => {});
            await refreshLobby(state);

            if (hostTransferMsg && state.message?.channel) {
                await state.message.channel.send(hostTransferMsg).catch(() => {});
            }
            return;
        }

        // ── Quiz Koox: Bilaw ──────────────────────────────────────────
        if (id.startsWith('quiz_start_')) {
            const channelId = id.replace('quiz_start_', '');
            const state     = activeQuiz.get(channelId);

            if (!state || state.started) {
                return interaction.reply({ content: 'Lobby ma jiro ama wuu bilaabmay.', flags: MessageFlags.Ephemeral });
            }
            if (interaction.user.id !== state.hostId) {
                return interaction.reply({ content: 'Kaliya hostku ayaa bilaabi kara.', flags: MessageFlags.Ephemeral });
            }
            if (state.players.size < QUIZ_MIN_PLAYERS) {
                return interaction.reply({ content: `Ugu yaraan ${QUIZ_MIN_PLAYERS} qof ayaa loo baahan yahay. Hadda: ${state.players.size}`, flags: MessageFlags.Ephemeral });
            }

            await interaction.deferUpdate().catch(() => {});
            if (state.message) {
                await state.message.edit({
                    embeds: [new EmbedBuilder()
                        .setTitle('✅ Lobby waa la xidhay')
                        .setDescription(`Quiz wuxuu ku bilaabmayaa **${state.players.size}** qof.`)
                        .setColor('#2ecc71')],
                    components: [],
                }).catch(() => {});
            }
            return beginQuizGame(state);
        }

        // ── Quiz Koox: Butonka su'aasha ───────────────────────────────
        // (quiz_a_ prefix — collector-ku wuxuu maareeyaa)
    });
};
