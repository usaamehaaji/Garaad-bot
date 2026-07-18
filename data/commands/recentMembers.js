// =====================================================================
// AMARKA: ?rm - Show last players used Garaad
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const { userData } = require('../../src/store');

async function fetchName(uid, client) {
    try {
        const user = await client.users.fetch(uid);
        return user.username;
    } catch {
        return 'Unknown User';
    }
}

module.exports = async function recentMembersCmd(message) {
    const guildId = message.guild.id;
    
    // Get all guild members with activity
    const members = [];
    
    for (const [userId, data] of Object.entries(userData)) {
        if (!data || !data.lastActive) continue;
        members.push({
            id: userId,
            username: data.username || 'Unknown',
            lastActive: new Date(data.lastActive).getTime(),
        });
    }
    
    if (members.length === 0) {
        return message.reply('📭 **Cidna ma jiro.** Hadii players isticmaalaan bot, halka way muuqanayaan.');
    }
    
    // Sort by last active (most recent first)
    members.sort((a, b) => b.lastActive - a.lastActive);
    
    // Take top 20
    const top20 = members.slice(0, 20);
    
    // Build embed
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('👥 Recent Members — Last Players Used Garaad')
        .setDescription(
            top20.map((m, i) => {
                const date = new Date(m.lastActive);
                const timeAgo = getTimeAgo(date);
                return `${i + 1}. **${m.username}** — ${timeAgo}`;
            }).join('\n')
        )
        .setFooter({ text: `Garaad Bot • Total users: ${members.length}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
};

function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return '🟢 Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
}
