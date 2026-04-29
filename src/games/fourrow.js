// =====================================================================
// CIYAARTA 4-IN-A-ROW (Connect 4) — Garaad Bot
// • 2 ciyaartoy
// • 6 saf x 7 column board
// • Qofkii ugu horreeya 4 isugu xigxiga (jiif/taag/xagal) → wuu guulaystay
// • Su'aalo ma jiraan — XP kaliya guulaystaha ayaa qaadanaya
// • Board waxaa loo render-gareeyaa sawir PNG ah (canvas) — qurux dhab ah
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas }                     = require('@napi-rs/canvas');
const { userData, saveData, activeFourrow } = require('../store');
const { checkUser, addXp }                 = require('../utils/helpers');
const { markUserPlayed }                   = require('../utils/reminders');

// ───── Habayn ciyaarta ─────
const ROWS           = 6;
const COLS           = 7;
const TURN_TIME_MS   = 30 * 1000;          // 30 ilbiriqsi turn kasta
const WINNER_XP      = 25;                 // XP guulaystaha
const LOSER_XP       = 10;                 // XP laga jarayo lumiyaha
const MIN_XP_TO_PLAY = LOSER_XP;           // Ugu yaraan loo baahanyahay si la u ciyaaro
const PIECE_TXT      = { p1: '🔴', p2: '🟡' }; // Calaamadaha qoraal — title/turn

// ───── Habayn sawirka (canvas) ─────
const CELL          = 80;       // Cabbirka unugga
const GAP           = 10;       // Booska u dhexeeya unugyada
const PAD           = 24;       // Booska bidix/midig/sare/hoose
const HEADER_H      = 56;       // Boos column labels
const W             = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
const H             = PAD * 2 + HEADER_H + ROWS * CELL + (ROWS - 1) * GAP;
const COLOR = {
    bgOuter: '#1a1726',
    bgPanel: '#2D2A3E',
    hole:    '#15131F',
    holeRim: '#3a3650',
    p1:      '#E74C3C',
    p1Dark:  '#a82c1f',
    p2:      '#F1C40F',
    p2Dark:  '#b3900a',
    text:    '#FFFFFF',
    ringHi:  '#FFFFFF',
};

// ───── Sameey board cusub ─────
function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// ───── Riix shey column gaar ah — soo celi rowIndex la galiyay ama -1 ─────
function dropPiece(board, col, who) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!board[r][col]) {
            board[r][col] = who;
            return r;
        }
    }
    return -1; // column buuxa
}

// ───── Hubi haddii uu jiro 4 isugu xigxiga ee uu galiyay ─────
function checkWin(board, row, col, who) {
    const directions = [
        [0, 1],   // jiifa →
        [1, 0],   // taagan ↓
        [1, 1],   // xagal ↘
        [1, -1],  // xagal ↙
    ];
    for (const [dr, dc] of directions) {
        let count = 1;
        for (let i = 1; i < 4; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
            if (board[r][c] === who) count++; else break;
        }
        for (let i = 1; i < 4; i++) {
            const r = row - dr * i, c = col - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
            if (board[r][c] === who) count++; else break;
        }
        if (count >= 4) return true;
    }
    return false;
}

function isBoardFull(board) {
    return board[0].every(cell => cell !== null);
}

// ───── Sawir helper: roundedRect ─────
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
}

// ───── Sawir helper: piece star (gudaha goobada) ─────
function drawStar(ctx, cx, cy, r, color) {
    const points = 5;
    const outer  = r;
    const inner  = r * 0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle  = (Math.PI / points) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

// ───── RENDER: board sawir PNG ah ─────
function renderBoardImage(state) {
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // Background dibedda
    ctx.fillStyle = COLOR.bgOuter;
    ctx.fillRect(0, 0, W, H);

    // Header — labels column-ka (1-7)
    ctx.fillStyle    = COLOR.text;
    ctx.font         = 'bold 32px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < COLS; c++) {
        const cx = PAD + c * (CELL + GAP) + CELL / 2;
        ctx.fillText(`${c + 1}`, cx, PAD + HEADER_H / 2);
    }

    // Panel-ka board-ka (rounded rect)
    const panelX = PAD - 8;
    const panelY = PAD + HEADER_H - 8;
    const panelW = COLS * CELL + (COLS - 1) * GAP + 16;
    const panelH = ROWS * CELL + (ROWS - 1) * GAP + 16;
    ctx.fillStyle = COLOR.bgPanel;
    roundRect(ctx, panelX, panelY, panelW, panelH, 18);
    ctx.fill();

    // Unugyada
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cx = PAD + c * (CELL + GAP) + CELL / 2;
            const cy = PAD + HEADER_H + r * (CELL + GAP) + CELL / 2;
            const radius = CELL / 2 - 4;

            // God madow (rim taas oo qoto u eg)
            ctx.fillStyle = COLOR.holeRim;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = COLOR.hole;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            // Shey (haddii uu jiro)
            const cell = state.board[r][c];
            if (cell) {
                const main = cell === 'p1' ? COLOR.p1     : COLOR.p2;
                const dark = cell === 'p1' ? COLOR.p1Dark : COLOR.p2Dark;

                // outer ring (mugdi)
                ctx.fillStyle = dark;
                ctx.beginPath();
                ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
                ctx.fill();

                // inner fill
                ctx.fillStyle = main;
                ctx.beginPath();
                ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
                ctx.fill();

                // star calaamada gudaha
                drawStar(ctx, cx, cy, radius - 18, dark);

                // White ring marka uu yahay shaygii ugu dambeeyay (kii la dhigay)
                if (state.lastDrop && state.lastDrop.row === r && state.lastDrop.col === c) {
                    ctx.strokeStyle = COLOR.ringHi;
                    ctx.lineWidth   = 5;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }

    return canvas.toBuffer('image/png');
}

// ───── Sameey button rows column kasta ─────
function buildButtons(state) {
    // 7 columns → 2 rows (4 + 3) — Discord max 5 button per row
    const r1 = new ActionRowBuilder();
    const r2 = new ActionRowBuilder();
    for (let c = 0; c < COLS; c++) {
        const colFull = state.board[0][c] !== null;
        const btn = new ButtonBuilder()
            .setCustomId(`4row_drop_${state.channelId}_${c}`)
            .setLabel(`${c + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(colFull || state.finished);
        if (c < 4) r1.addComponents(btn); else r2.addComponents(btn);
    }
    return [r1, r2];
}

// ───── Sameey embed + attachment ─────
function buildBoardPayload(state, statusLine) {
    const turnPiece = state.current === state.p1 ? PIECE_TXT.p1 : PIECE_TXT.p2;

    const desc =
        `${PIECE_TXT.p1} <@${state.p1}>  vs  ${PIECE_TXT.p2} <@${state.p2}>\n\n` +
        (state.finished
            ? statusLine
            : `${statusLine}\n\n👉 Turn-ka: ${turnPiece} <@${state.current}> _(${TURN_TIME_MS / 1000}s)_`);

    const buf        = renderBoardImage(state);
    const attachment = new AttachmentBuilder(buf, { name: 'board.png' });

    const embed = new EmbedBuilder()
        .setTitle('🎯 4 Isku-xig — Garaad Bot')
        .setDescription(desc)
        .setImage('attachment://board.png')
        .setColor(state.finished ? '#95a5a6' : (state.current === state.p1 ? '#e74c3c' : '#f1c40f'));

    return { embeds: [embed], files: [attachment], components: buildButtons(state) };
}

// ───── Bilow game cusub ─────
async function startFourrowGame(channel, p1Id, p2Id) {
    if (activeFourrow.has(channel.id)) return;

    checkUser(p1Id);
    checkUser(p2Id);
    markUserPlayed(p1Id);
    markUserPlayed(p2Id);

    const state = {
        channelId: channel.id,
        p1: p1Id, p2: p2Id,
        board: emptyBoard(),
        current: p1Id,
        message: null,
        finished: false,
        turnTimer: null,
        lastDrop: null,
    };
    activeFourrow.set(channel.id, state);

    const payload = buildBoardPayload(state, `🎮 Ciyaarta waa la bilaabay! ${PIECE_TXT.p1} <@${p1Id}> bilaabay.`);
    const msg = await channel.send(payload).catch(e => { console.error('[4row] send error:', e?.message); return null; });
    if (!msg) {
        activeFourrow.delete(channel.id);
        return;
    }
    state.message = msg;
    armTurnTimer(channel, state);
}

// ───── Maaree turn timer ─────
function armTurnTimer(channel, state) {
    if (state.turnTimer) clearTimeout(state.turnTimer);
    state.turnTimer = setTimeout(() => handleTimeout(channel, state), TURN_TIME_MS);
}

async function handleTimeout(channel, state) {
    if (state.finished) return;
    const winner = state.current === state.p1 ? state.p2 : state.p1;
    const loser  = state.current;
    state.finished = true;
    activeFourrow.delete(channel.id);

    const lostXp = awardWinner(winner, loser);

    const payload = buildBoardPayload(state,
        `⏰ <@${loser}> wakhti dhamaaday — wuu lumiyay!\n\n` +
        `🏆 Guulaystay: <@${winner}> (+${WINNER_XP} XP)\n` +
        `💀 Lumiyay: <@${loser}> (−${lostXp} XP)`
    );
    if (state.message) {
        await state.message.edit(payload).catch(e => console.error('[4row] edit timeout:', e?.message));
    }
}

// ───── Maaree button drop ─────
async function handleDrop(interaction) {
    const parts     = interaction.customId.split('_');         // ['4row','drop',channelId,col]
    const channelId = parts[2];
    const col       = parseInt(parts[3]);

    const state = activeFourrow.get(channelId);
    if (!state || state.finished) {
        return interaction.reply({ content: 'Ciyaartan way dhamaatay.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (interaction.user.id !== state.p1 && interaction.user.id !== state.p2) {
        return interaction.reply({ content: 'Adigu kuma jirtid ciyaartan.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (interaction.user.id !== state.current) {
        return interaction.reply({ content: '⏳ Sug — turn-kaagu maaha.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (col < 0 || col >= COLS) {
        return interaction.reply({ content: 'Column khalad.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }

    const who = state.current === state.p1 ? 'p1' : 'p2';
    const droppedRow = dropPiece(state.board, col, who);
    if (droppedRow === -1) {
        return interaction.reply({ content: 'Column-kani wuu buuxsamay.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }

    state.lastDrop = { row: droppedRow, col };
    if (state.turnTimer) clearTimeout(state.turnTimer);

    // Hubi guul
    if (checkWin(state.board, droppedRow, col, who)) {
        const winner = state.current;
        const loser  = winner === state.p1 ? state.p2 : state.p1;
        state.finished = true;
        activeFourrow.delete(state.channelId);

        const lostXp = awardWinner(winner, loser);

        const payload = buildBoardPayload(state,
            `🏆 <@${winner}> wuu guulaystay!\n` +
            `💎 +${WINNER_XP} XP — Mahadsanid ciyaarta!\n` +
            `💀 <@${loser}> −${lostXp} XP`
        );
        return interaction.update(payload).catch(e => console.error('[4row] update win:', e?.message));
    }

    // Hubi draw
    if (isBoardFull(state.board)) {
        state.finished = true;
        activeFourrow.delete(state.channelId);

        checkUser(state.p1); checkUser(state.p2);
        userData[state.p1].stats.fourRowDraws = (userData[state.p1].stats.fourRowDraws || 0) + 1;
        userData[state.p2].stats.fourRowDraws = (userData[state.p2].stats.fourRowDraws || 0) + 1;
        saveData();

        const payload = buildBoardPayload(state, `🤝 Board-ku wuu buuxsamay — ciyaartu waa equality!`);
        return interaction.update(payload).catch(e => console.error('[4row] update draw:', e?.message));
    }

    // Wareeji turn-ka
    state.current = state.current === state.p1 ? state.p2 : state.p1;
    armTurnTimer(interaction.channel, state);

    const movedPiece = who === 'p1' ? PIECE_TXT.p1 : PIECE_TXT.p2;
    const payload = buildBoardPayload(state,
        `${movedPiece} <@${interaction.user.id}> wuxuu galiyay column **${col + 1}**.`
    );
    return interaction.update(payload).catch(e => console.error('[4row] update move:', e?.message));
}

// ───── Abaalmari guulaystaha + ciqaab lumiyaha ─────
function awardWinner(winnerId, loserId) {
    checkUser(winnerId);
    checkUser(loserId);
    addXp(winnerId, WINNER_XP);

    const lostXp = Math.min(LOSER_XP, userData[loserId].xp);
    userData[loserId].xp = Math.max(0, userData[loserId].xp - LOSER_XP);

    userData[winnerId].stats.fourRowWins  = (userData[winnerId].stats.fourRowWins  || 0) + 1;
    userData[loserId].stats.fourRowLosses = (userData[loserId].stats.fourRowLosses || 0) + 1;
    saveData();
    return lostXp;
}

module.exports = { startFourrowGame, handleDrop, MIN_XP_TO_PLAY };
