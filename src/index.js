// =====================================================================
// GARAAD BOT - Entry Point (src/index.js)
// =====================================================================

require('dotenv').config();

const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');

const setupMessageHandler     = require('./handlers/messageHandler');
const setupInteractionHandler = require('./handlers/interactionHandler');
const setupReminderScheduler  = require('./handlers/reminderScheduler');

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error('❌ TOKEN environment variable lama helin. Geli .env (ama Railway Variables).');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

client.once('clientReady', () => {
    console.log(`✅ Garaad Bot waa online: ${client.user.tag}`);
    client.user.setActivity('?help — Garaad Bot', { type: ActivityType.Playing });
});

setupMessageHandler(client);
setupInteractionHandler(client);
setupReminderScheduler(client);

client.on('error',          (err) => console.error('[Discord error]', err));
client.on('shardError',     (err) => console.error('[Shard error]',   err));
process.on('unhandledRejection', (err) => console.error('[Unhandled rejection]', err));
process.on('uncaughtException',  (err) => console.error('[Uncaught exception]',  err));

client.login(TOKEN).catch((err) => {
    console.error('❌ Login fashil:', err.message);
    process.exit(1);
});
