// =====================================================================
//
//   ██████╗  █████╗ ██████╗  █████╗  █████╗ ██████╗     ██████╗  ██████╗ ████████╗
//  ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
//  ██║  ███╗███████║██████╔╝███████║███████║██║  ██║    ██████╔╝██║   ██║   ██║
//  ██║   ██║██╔══██║██╔══██╗██╔══██║██╔══██║██║  ██║    ██╔══██╗██║   ██║   ██║
//  ╚██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║██████╔╝    ██████╔╝╚██████╔╝   ██║
//   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝
//
//  Garaad Bot v2 — Discord Quiz Bot (Af-Soomaali)
//  =====================================================================

require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');

const setupMessageHandler      = require('./src/handlers/messageHandler');
const setupInteractionHandler  = require('./src/handlers/interactionHandler');
const setupReminderScheduler   = require('./src/handlers/reminderScheduler');

// ───── Client ─────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

// ───── Handlers ─────
setupMessageHandler(client);
setupInteractionHandler(client);

// ───── Ready ─────
client.once('ready', () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log(`║  ✅  Garaad Bot v2 — SHAQAYNAYA      ║`);
    console.log(`║  🤖  ${client.user.tag.padEnd(32)}║`);
    console.log(`║  📊  ${String(client.guilds.cache.size + ' server').padEnd(32)}║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('');

    // Bilow scheduler-ka 24h DM xusuusinta
    setupReminderScheduler(client);
});

// ───── Khaladaad aan la filanayn ─────
client.on('error', err  => console.error('[Bot Error]', err));
process.on('unhandledRejection', err => console.error('[Unhandled Rejection]', err));

// ───── Login ─────
if (!process.env.TOKEN) {
    console.error('❌ KHALAD: TOKEN lama helin .env faylka! Eeg README.md');
    process.exit(1);
}

client.login(process.env.TOKEN);
