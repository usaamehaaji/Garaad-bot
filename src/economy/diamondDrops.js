// =====================================================================
// Classic Token Diamond Drops
// 3 diamonds every 40 minutes, claimable for 60 seconds.
// =====================================================================

const fs = require('fs');
const path = require('path');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    Routes,
} = require('discord.js');
const { isAdmin } = require('../utils/admin');
const { econData, checkEconUser, saveEcon } = require('./econStore');

const DATA_FILE = path.join(__dirname, '../../data/diamondDrops.json');
const DROP_DIAMONDS = 3;
const DROP_INTERVAL_MS = 40 * 60 * 1000;
const CLAIM_WINDOW_MS = 60 * 1000;
const BTC_REWARD = 3_000;

let config = { guilds: {} };
const activeDrops = new Map(); // guildId -> drop
const timers = new Map(); // guildId -> timeout

function loadConfig() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            config = { guilds: saved.guilds || {} };
        }
    } catch (error) {
        console.error('[DiamondDrops] Config load failed:', error.message);
        config = { guilds: {} };
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('[DiamondDrops] Config save failed:', error.message);
    }
}

function dropKey(guildId) {
    return guildId;
}

function formatCountdown(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.ceil(seconds / 60)} daqiiqo`;
}

function buildDropEmbed(drop, status = 'open') {
    const isOpen = status === 'open';
    const isClaimed = status === 'claimed' || status === 'claimed_rewarded';
    const embed = new EmbedBuilder()
        .setColor(isOpen ? 0x66d9ef : isClaimed ? 0x57f287 : 0x7f8c8d)
        .setTitle(
            isOpen
                ? '💎 Classic Token — Diamond Drop'
                : isClaimed
                    ? '🎉 Diamond Drop waa la qaatay'
                    : '⏰ Diamond Drop wuu dhacay'
        )
        .setDescription(
            isOpen
                ? `Classic Token wuxuu soo diray **${DROP_DIAMONDS} diamonds**!\n\n` +
                  `Qofka ugu horreeya ee qora \`?take\` ayaa heli kara. ` +
                  `Hadiyadda waxaa si toos ah loogu beddelayaa **₿${BTC_REWARD.toLocaleString()} Bitcoin**.`
                : isClaimed
                    ? `Qofka ugu horreeya ee \`?take\` qoray ayaa helay fursadda qaadashada.\n` +
                      `Riix button-ka **Bitcoin** si wallet-kaaga loogu daro abaalmarinta.`
                : 'Hal daqiiqo ayaa dhammaatay, cidina ma qaadan hadiyadda.'
        )
        .addFields(
            { name: '💎 Hadiyad', value: `${DROP_DIAMONDS} diamonds`, inline: true },
            { name: '⏱️ Waqtiga', value: isOpen || isClaimed ? formatCountdown(drop.expiresAt - Date.now()) : 'Dhacday', inline: true },
        )
        .setFooter({ text: 'Classic Token • 40 daqiiqo kasta' })
        .setTimestamp();

    if (drop.claimedBy) {
        embed.addFields({ name: '🎉 Qaatay', value: `<@${drop.claimedBy}>`, inline: false });
    }
    return embed;
}

function buildClaimButtons(drop) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`diamond_btc_${drop.id}_${drop.claimedBy}`)
            .setLabel(`₿ Qaado ${BTC_REWARD.toLocaleString()} BTC`)
            .setStyle(ButtonStyle.Success),
    );
}

function serializePayload(payload) {
    return {
        ...payload,
        embeds: payload.embeds?.map(embed => typeof embed.toJSON === 'function' ? embed.toJSON() : embed),
        components: payload.components?.map(row => typeof row.toJSON === 'function' ? row.toJSON() : row),
    };
}

async function sendToChannel(client, channelId, payload) {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel?.send) return channel.send(payload);

    // Discord voice-channel text chat can be message-capable even when
    // discord.js does not expose .send() on the VoiceChannel object.
    const raw = await client.rest.post(Routes.channelMessages(channelId), {
        body: serializePayload(payload),
    });
    return {
        id: raw.id,
        channelId,
        edit: async editPayload => client.rest.patch(
            Routes.channelMessage(channelId, raw.id),
            { body: serializePayload(editPayload) },
        ),
    };
}

async function editDropMessage(client, drop, status = 'open') {
    if (!drop.messageId || !drop.channelId) return;
    try {
        const channel = await client.channels.fetch(drop.channelId);
        const message = await Promise.resolve(channel?.messages?.fetch?.(drop.messageId)).catch(() => null);
        const payload = {
            embeds: [buildDropEmbed(drop, status)],
            components: status === 'claimed' ? [buildClaimButtons(drop)] : [],
        };
        if (message?.edit) {
            await message.edit(payload);
        } else {
            await client.rest.patch(
                Routes.channelMessage(drop.channelId, drop.messageId),
                { body: serializePayload(payload) },
            );
        }
    } catch (error) {
        console.error('[DiamondDrops] Message update failed:', error.message);
    }
}

async function expireDrop(client, guildId, dropId) {
    const drop = activeDrops.get(dropKey(guildId));
    if (!drop || drop.id !== dropId || !['open', 'claimed'].includes(drop.status)) return;
    drop.status = 'expired';
    activeDrops.delete(dropKey(guildId));
    await editDropMessage(client, drop, 'expired');
    await sendToChannel(client, drop.channelId, {
        content: '⏰ **Hadiyaddii way dhacday** — cidina ma qaadan 3-da diamonds.',
    }).catch(() => {});
}

async function spawnDrop(client, guildId) {
    const entry = config.guilds[guildId];
    if (!entry?.channelId) return null;

    const oldDrop = activeDrops.get(dropKey(guildId));
    if (oldDrop?.status === 'open') return oldDrop;

    const drop = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        guildId,
        channelId: entry.channelId,
        messageId: null,
        status: 'open',
        claimedBy: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + CLAIM_WINDOW_MS,
    };

    const message = await sendToChannel(client, entry.channelId, {
        embeds: [buildDropEmbed(drop)],
        components: [],
    }).catch(error => {
        console.error('[DiamondDrops] Drop send failed:', error.message);
        return null;
    });
    if (!message) return null;

    drop.messageId = message.id;
    activeDrops.set(dropKey(guildId), drop);
    setTimeout(() => expireDrop(client, guildId, drop.id), CLAIM_WINDOW_MS + 250);
    entry.nextDropAt = Date.now() + DROP_INTERVAL_MS;
    saveConfig();
    return drop;
}

function scheduleGuild(client, guildId, delayMs = DROP_INTERVAL_MS) {
    if (timers.has(guildId)) clearTimeout(timers.get(guildId));
    const delay = Math.max(1_000, delayMs);
    timers.set(guildId, setTimeout(async () => {
        timers.delete(guildId);
        await spawnDrop(client, guildId);
        scheduleGuild(client, guildId, DROP_INTERVAL_MS);
    }, delay));
}

function startDiamondDrops(client) {
    loadConfig();
    for (const [guildId, entry] of Object.entries(config.guilds)) {
        const dueIn = entry.nextDropAt ? entry.nextDropAt - Date.now() : DROP_INTERVAL_MS;
        if (dueIn <= 0) {
            spawnDrop(client, guildId).finally(() => scheduleGuild(client, guildId));
        } else {
            scheduleGuild(client, guildId, dueIn);
        }
    }
}

async function diamondSetupCmd(message, args, client) {
    if (!isAdmin(message.author.id)) return message.reply('🚫 Admin kaliya ayaa dejin kara Diamond Drop.');
    if (!message.guild) return message.reply('⚠️ Server-ka dhexdiisa kaliya.');

    const sub = (args[0] || '').toLowerCase();
    if (sub === 'off' || sub === 'stop') {
        delete config.guilds[message.guild.id];
        if (timers.has(message.guild.id)) clearTimeout(timers.get(message.guild.id));
        timers.delete(message.guild.id);
        activeDrops.delete(dropKey(message.guild.id));
        saveConfig();
        return message.reply('✅ Classic Token Diamond Drop waa la joojiyay server-kan.');
    }

    const requestedChannelId = args[0] && /^\d{15,22}$/.test(args[0]) ? args[0] : message.channel.id;
    const targetChannel = await client.channels.fetch(requestedChannelId).catch(() => null);
    if (!targetChannel) {
        return message.reply('⚠️ Channel-kaas lama helin. Isticmaal channel ID sax ah.');
    }
    if (targetChannel.guildId && targetChannel.guildId !== message.guild.id) {
        return message.reply('⚠️ Channel-kaas server-kan kama tirsana.');
    }

    config.guilds[message.guild.id] = {
        channelId: requestedChannelId,
        nextDropAt: Date.now(),
    };
    saveConfig();
    if (timers.has(message.guild.id)) clearTimeout(timers.get(message.guild.id));
    timers.delete(message.guild.id);

    await message.reply(
        `✅ **Diamond Drop waa la dejiyay!**\n` +
        `📍 Channel: <#${requestedChannelId}>\n` +
        `💎 ${DROP_DIAMONDS} diamonds • ⏱️ 1 daqiiqo claim window\n` +
        `🔁 Drop cusub: 40 daqiiqo kasta`
    );
    await spawnDrop(client, message.guild.id);
    scheduleGuild(client, message.guild.id, DROP_INTERVAL_MS);
}

async function diamondStatusCmd(message) {
    if (!isAdmin(message.author.id)) return message.reply('🚫 Admin kaliya.');
    const entry = config.guilds[message.guild?.id];
    const drop = activeDrops.get(dropKey(message.guild?.id));
    if (!entry) return message.reply('ℹ️ Diamond Drop lama dejin. Isticmaal `?diamondsetup` channel-ka aad rabto.');
    return message.reply(
        `💎 **Diamond Drop Status**\n` +
        `📍 <#${entry.channelId}>\n` +
        `${drop?.status === 'open' ? `✅ Hadda waa furan tahay — ${formatCountdown(drop.expiresAt - Date.now())} ayaa haray.` : `⏱️ Drop-ka xiga qiyaastii ${formatCountdown((entry.nextDropAt || Date.now()) - Date.now())}.`}`
    );
}

async function diamondTakeCmd(message) {
    if (!message.guild) return message.reply('⚠️ Server-ka dhexdiisa kaliya.');
    const drop = activeDrops.get(dropKey(message.guild.id));
    if (!drop || drop.channelId !== message.channel.id || drop.status !== 'open' || Date.now() >= drop.expiresAt) {
        return message.reply('⏰ Hadda **diamond drop** furan ma jiro.');
    }

    // messageCreate is processed serially, so the first accepted command wins.
    drop.status = 'claimed';
    drop.claimedBy = message.author.id;
    await editDropMessage(message.client, drop, 'claimed');
    return message.reply({
        embeds: [buildDropEmbed(drop, 'claimed')],
        components: [buildClaimButtons(drop)],
    });
}

async function handleDiamondInteraction(interaction) {
    const parts = interaction.customId.split('_');
    const choice = parts[1];
    const dropId = parts[2];
    const claimedBy = parts[3];
    const drop = [...activeDrops.values()].find(item => item.id === dropId);

    if (!drop || drop.status !== 'claimed' || drop.id !== dropId) {
        return interaction.reply({ content: '⏰ Diamond drop-kan wuu dhacay.', flags: MessageFlags.Ephemeral });
    }
    if (interaction.user.id !== claimedBy || drop.claimedBy !== interaction.user.id) {
        return interaction.reply({ content: '⚠️ Qofkii ugu horreeyay ee `?take` qoray ayaa dooran kara hadiyadda.', flags: MessageFlags.Ephemeral });
    }
    if (Date.now() >= drop.expiresAt) {
        drop.status = 'expired';
        activeDrops.delete(dropKey(drop.guildId));
        return interaction.reply({ content: '⏰ Waqtigii doorashada wuu dhammaaday.', flags: MessageFlags.Ephemeral });
    }

    checkEconUser(interaction.user.id);
    if (choice === 'btc') {
        econData[interaction.user.id].btc = (econData[interaction.user.id].btc || 0) + BTC_REWARD;
        saveEcon();
        drop.status = 'claimed_rewarded';
        activeDrops.delete(dropKey(drop.guildId));
        await interaction.update({
            embeds: [buildDropEmbed(drop, 'claimed')],
            components: [],
        });
        return interaction.followUp({
            content: `✅ <@${interaction.user.id}> waxaad qaadatay **${DROP_DIAMONDS} diamonds → +₿${BTC_REWARD.toLocaleString()} Bitcoin**.`,
            flags: MessageFlags.Ephemeral,
        });
    }
    return interaction.reply({ content: '⚠️ Doorashada lama fahmin.', flags: MessageFlags.Ephemeral });
}

module.exports = {
    startDiamondDrops,
    diamondSetupCmd,
    diamondStatusCmd,
    diamondTakeCmd,
    handleDiamondInteraction,
    DROP_DIAMONDS,
    DROP_INTERVAL_MS,
    CLAIM_WINDOW_MS,
};