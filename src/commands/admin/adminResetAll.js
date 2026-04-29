// =====================================================================
// SUB-AMARKA: ?admin resetall  (dadka oo dhan eber)
// • Tallaabo 1: ?admin resetall          → muuji digniin
// • Tallaabo 2: ?admin resetall confirm  → si dhab ah u tirtir
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const { userData, saveData } = require('../../store');
const { PREFIX } = require('../../config');

module.exports = async function adminResetAll(message, args) {
    const totalUsers = Object.keys(userData).length;
    const flag = (args[0] || '').toLowerCase();

    // ───── Tallaabo 1: digniin ─────
    if (flag !== 'confirm') {
        const warn = new EmbedBuilder()
            .setTitle('⚠️ DIGNIIN — Reset All Users')
            .setDescription(
                `Tallaabadan waxay **eber u sameynaysaa** dhammaan user-yada:\n` +
                `• IQ → 0\n` +
                `• XP → 0\n` +
                `• Stats (solo, duel, bet, quiz, rush) → 0\n` +
                `• Shields, titles, double XP → la tirtirayaa\n` +
                `• Su'aalaha la arkay (seen) → la tirtirayaa\n\n` +
                `**Tirada user-yada hadda:** \`${totalUsers}\`\n\n` +
                `Tallaabadan waa **mid aan dib loo soo celin karin**!\n\n` +
                `Si aad u xaqiijiso, qor:\n\`${PREFIX}admin resetall confirm\``
            )
            .setColor('#e67e22');
        return message.reply({ embeds: [warn] });
    }

    // ───── Tallaabo 2: dhabta tirtir ─────
    const before = totalUsers;
    for (const uid of Object.keys(userData)) {
        delete userData[uid];
    }
    saveData();

    console.log(`[ResetAll] Admin ${message.author.tag} (${message.author.id}) tirtiray ${before} user.`);

    const done = new EmbedBuilder()
        .setTitle('✅ Reset Dhammaystiran')
        .setDescription(
            `Dhammaan **${before}** user-yada xogtoodii waa la tirtiray.\n` +
            `Liiska \`${PREFIX}top\` hadda waa madhan.\n\n` +
            `Markii kale ee user-yadu ay ciyaaraan, xog cusub ayaa loo bilaabi doonaa eber.`
        )
        .setColor('#2ecc71')
        .setFooter({ text: `Admin: ${message.author.tag}` });

    return message.reply({ embeds: [done] });
};
