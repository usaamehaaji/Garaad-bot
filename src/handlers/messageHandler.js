// =====================================================================
// GARAAD BOT - Maareynta Farriimaha (Message Handler)
// =====================================================================

const { PREFIX }      = require('../config');
const { checkUser }   = require('../utils/helpers');

// Amarrada
const helpCmd       = require('../commands/help');
const profileCmd    = require('../commands/profile');
const statisticsCmd = require('../commands/statistics');
const topCmd        = require('../commands/top');
const todayCmd      = require('../commands/today');
const shopCmd       = require('../commands/shop');
const buyCmd        = require('../commands/buy');
const soloCmd       = require('../commands/solo');
const duelCmd       = require('../commands/duel');
const betCmd        = require('../commands/bet');
// ⭐ ?rush waa la joojiyay — laguma baahan tahay (user request)
// const rushCmd    = require('../commands/rush');
const quizCmd       = require('../commands/quiz');
const fourrowCmd    = require('../commands/fourrow');
const ciladaCmd     = require('../commands/cilada');
const adminCmd      = require('../commands/admin/admin');

module.exports = function setupMessageHandler(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot)                  return;
        if (!message.content.startsWith(PREFIX)) return;

        const args    = message.content.slice(PREFIX.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        const userId  = message.author.id;

        checkUser(userId);

        switch (command) {
            case 'caawin':
            case 'help':
                return helpCmd(message);

            case 'profile':
                return profileCmd(message);

            case 'statistics':
            case 'stats':
                return statisticsCmd(message);

            case 'top':
                return topCmd(message);

            case 'today':
                return todayCmd(message);

            case 'shop':
                return shopCmd(message);

            case 'buy':
                return buyCmd(message, args);

            case 'solo':
                return soloCmd(message, args);

            case 'duel':
                return duelCmd(message, args);

            case 'bet':
                return betCmd(message, args);

            // ⭐ ?rush waa la joojiyay — user wuu damacsanaa in la saaro
            // case 'rush':
            //     return rushCmd(message);

            case 'quiz':
            case 'friends':
            case 'team':
                return quizCmd(message, args);

            case '4row':
            case '4':
            case 'fourrow':
            case 'afar':
            case 'connect4':
                return fourrowCmd(message, args);

            case 'cilada':
            case 'cilad':
            case 'bug':
                return ciladaCmd(message, args);

            case 'admin':
                return adminCmd(message, args);

            // Amaro aan la garanaynin waa la iska daayaa (silent)
        }
    });
};
