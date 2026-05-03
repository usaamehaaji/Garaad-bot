// =====================================================================
// AMARKA: ?caawin / ?help
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PREFIX } = require('../config');
const { isAdmin } = require('../utils/admin');

module.exports = async function helpCommand(message) {
    const userId = message.author.id;

    let description =
        `Ku soo dhawoow **Garaad Quiz Bot v3**. Hoos waxaa ku qoran amarrada oo qaybo loo kala saaray:\n\n` +

        `🎲 **Ciyaaraha** _(dhammaantood waxaa la dooran karaa tirada su'aalaha)_\n` +
        `**\`${PREFIX}solo\`** - Ciyaar shakhsi ah _(3-25 su'aalood)_\n` +
        `**\`${PREFIX}duel @user\`** - Dagaal labo qof _(3-15 su'aalood)_\n` +
        `**\`${PREFIX}row @user\`** - 4-in-a-row style; qofkii 4 isku xiga galo ayaa guuleysta\n` +
        `**\`${PREFIX}quiz\`** - Quiz kooxeed _(ugu yaraan 3 qof, 3-25 su'aalood)_\n\n` +

        `💰 **Khamaar & Dukaanka**\n` +
        `\`${PREFIX}bet [amount]\` - Khamaar IQ\n` +
        `\`${PREFIX}shop\` - Fur dukaanka\n` +
        `\`${PREFIX}buy [item]\` - Iibso item\n\n` +

        `👤 **Profile & Stats**\n` +
        `\`${PREFIX}profile\` - Arag profile\n` +
        `\`${PREFIX}statistics\` - Tirakoob faahfaahsan\n` +
        `\`${PREFIX}top\` - Top 10\n` +
        `\`${PREFIX}today\` - Daily reward\n\n` +

        `🛠️ **System**\n` +
        `\`${PREFIX}cilada [farriin]\` - Report cilad`;

    if (isAdmin(userId)) {
        description +=
            `\n\n👑 **Admin** — tilmaamaha tartanka & farriinta dadka: \`${PREFIX}admin help\``;
    }

    const embed = new EmbedBuilder()
        .setTitle('📖 Garaad Quiz - Liiska Amarrada')
        .setDescription(description)
        .setColor('#3498db')
        .setFooter({ text: 'Garaad Quiz Bot v3' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`close_help_${userId}`)
            .setLabel('Iska xir')
            .setStyle(ButtonStyle.Danger),
    );

    return message.reply({ embeds: [embed], components: [row] });
};
