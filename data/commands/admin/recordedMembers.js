// =====================================================================
// AMARKA: ?rm (Admin Command - Shows recent members who used bot)
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAdmin } = require('../../src/utils/admin');
const { userData } = require('../../src/store');

module.exports = async function recordedMembersCmd(message, args) {
    const userId = message.author.id;
    
    if (!isAdmin(userId)) {
        return message.reply('⛔ **Admin kaliya ayaa awooda.** Qof admin ah xiriir.');
    }

    // Get all users who have used the bot
    const users = Object.entries(userData)
        .map(([uid, data]) => ({
            id: uid,
            username: data.username || 'Unknown',
            lastActive: data.lastActive || 0,
            totalCommands: data.totalCommands || 0,
            iq: data.iq || 0,
            btc: data.btc || 0,
        }))
        .sort((a, b) => b.lastActive - a.lastActive) // Most recent first
        .slice(0, 20); // Top 20

    if (users.length === 0) {
        return message.reply('📋 **Cidna ma jiraan ciyaaryahan.**');
    }

    const now = Date.now();
    const userList = users
        .map((user, idx) => {
            const lastActiveMs = now - user.lastActive;
            const lastActiveStr = formatTime(lastActiveMs);
            return `\`${String(idx + 1).padStart(2, ' ')}\` <@${user.id}> | **${user.username}** | ${lastActiveStr} | Commands: ${user.totalCommands} | IQ: ${user.iq} | BTC: ${user.btc}`;
        })
        .join('\n');

    const embed = new EmbedBuilder()
        .setTitle('📋 Ciyaaryahano - Ugu Danbeeysa Hadda')
        .setColor('#3498db')
        .setDescription(
            `**Ciyaaryahan ${users.length} ayaa muuqda**\n\n` +
            userList
        )
        .setFooter({ text: 'Garaad Bot • Recorded Members' });

    return message.reply({ embeds: [embed] });
};

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}
