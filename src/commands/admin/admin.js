// =====================================================================
// AMARKA: ?admin (router)
// =====================================================================

const { isAdmin }  = require('../../utils/admin');
const { PREFIX }   = require('../../config');

const broadcast = require('./adminBroadcast');
const addAdmin  = require('./adminAddAdmin');
const removeAdm = require('./adminRemoveAdmin');
const listAdm   = require('./adminList');
const bugs      = require('./adminBugs');
const reset     = require('./adminReset');
const resetAll  = require('./adminResetAll');
const dm        = require('./adminDm');

module.exports = async function adminCommand(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply('⛔ **Adigu admin maaha.** Si aad u noqotid admin, weydiiso admin kale ku darro liiska.');
    }

    const sub = (args.shift() || 'help').toLowerCase();

    switch (sub) {
        case 'broadcast':
        case 'bc':
        case 'announce':
            return broadcast(message, args);

        case 'add':
            return addAdmin(message, args);

        case 'remove':
        case 'rm':
        case 'del':
            return removeAdm(message, args);

        case 'list':
        case 'ls':
            return listAdm(message, args);

        case 'bugs':
        case 'cilada':
            return bugs(message, args);

        case 'reset':
            return reset(message, args);

        case 'resetall':
        case 'resetdhammaan':
        case 'eberka':
            return resetAll(message, args);

        case 'dm':
        case 'message':
            return dm(message, args);

        case 'help':
        default:
            return message.reply(
                '📋 **Garaad Admin — Sub-commands:**\n\n' +
                `\`${PREFIX}admin broadcast [fariin]\` — Fariin u dir user kasta DM\n` +
                `\`${PREFIX}admin dm @user [fariin]\` — Fariin si toos ah ugu dir user gaar ah\n` +
                `\`${PREFIX}admin add @user\` — Admin cusub ku dar\n` +
                `\`${PREFIX}admin remove @user\` — Admin ka saar liiska\n` +
                `\`${PREFIX}admin list\` — Liiska admin-yada\n` +
                `\`${PREFIX}admin bugs\` — Eeg cilada-yaha la soo sheegay\n` +
                `\`${PREFIX}admin reset @user\` — Xog user ka tirtir\n` +
                `\`${PREFIX}admin resetall\` — Eber u samee dhammaan user-yada (digniin + confirm)`
            );
    }
};
