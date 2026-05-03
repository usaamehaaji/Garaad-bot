// =====================================================================
// Guddi caawinaad admin + tartan + tusaale farriin dadka (embed + badhan)
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PREFIX } = require('../../config');

function buildAdminHelpEmbed() {
    const copyPaste =
        `Tartan — fadlan raac:\n` +
        `1) Qor ${PREFIX}isdiiwaangeli si DM uu kuugu soo dirayo CODE gaar ah.\n` +
        `2) Marka admin-ku furo tartanka channel-ka, qor: ${PREFIX}gal CODE (code-ka DM).\n` +
        `3) Ha la wadaajin code-ka — hal qof hal code.\n` +
        `4) Hubi in DM-kaaga uu furan yahay si aad code uga hesho.\n\n` +
        `(Admin: ${PREFIX}tartan_bilow → dadku galaan → ${PREFIX}admin_next wareegyo.)`;

    return new EmbedBuilder()
        .setTitle('👑 Garaad — Admin & Tartan')
        .setDescription(
            `**Sub-commands (admin)**\n` +
            `\`${PREFIX}admin broadcast [farriin]\` — DM dadka oo dhan\n` +
            `\`${PREFIX}admin dm @user [farriin]\` — DM user gaar ah\n` +
            `\`${PREFIX}admin add @user\` / \`remove\` / \`list\`\n` +
            `\`${PREFIX}admin bugs\` — Ciladaha\n` +
            `\`${PREFIX}admin reset @user\`\n` +
            `\`${PREFIX}admin reward @user [tiro]\` — IQ\n` +
            `\`${PREFIX}admin reward @user xp [tiro]\` — XP\n\n` +
            `**Tartan (admin + dadka)**\n` +
            `\`${PREFIX}isdiiwaangeli\` — qofka: DM code (ha muujin dadweyne)\n` +
            `\`${PREFIX}gal CODE\` — channel tartanka kaliya\n` +
            `\`${PREFIX}tartan_bilow\` — admin: fur channel\n` +
            `\`${PREFIX}admin_next\` — admin: bilow wareeg / xiga`
        )
        .addFields({
            name: '📣 Farriin dadka u dir (#announcements / broadcast)',
            value: `\`\`\`\n${copyPaste.slice(0, 900)}\n\`\`\``,
        })
        .setColor('#e67e22')
        .setFooter({ text: 'Kaliya admin — Iska xir marka aad dhammayso' });
}

module.exports = async function adminHelpPanel(message) {
    const uid = message.author.id;
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`close_admin_help_${uid}`)
            .setLabel('Iska xir')
            .setStyle(ButtonStyle.Danger),
    );
    return message.reply({ embeds: [buildAdminHelpEmbed()], components: [row] });
};
