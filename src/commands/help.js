// =====================================================================
// AMARKA: ?caawin / ?help
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PREFIX } = require('../config');

module.exports = async function helpCommand(message) {
    const userId = message.author.id;

    const description =
        `Ku soo dhawoow **Garaad Quiz Bot v3**. Hoos waxaa ku qoran amarrada oo qaybo loo kala saaray:\n\n` +

        `🎲 **Ciyaaraha** _(dhammaantood waxaa la dooran karaa tirada su'aalaha)_\n` +
        `\`${PREFIX}solo\` - Ciyaar shakhsi ah _(3-25 su'aalood)_\n` +
        `\`${PREFIX}duel @user\` - Dagaal labo qof _(3-15 su'aalood)_\n` +
        `\`${PREFIX}quiz\` - Quiz kooxeed _(ugu yaraan 3 qof, 3-25 su'aalood)_\n` +
        `\`${PREFIX}4row @user\` - 4 Isku-xig (Connect 4) — XP guulaystaha\n\n` +

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
        `\`${PREFIX}cilada [farriin]\` - Report cilad\n` +
        `\`${PREFIX}admin help\` - Admin commands`;

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
