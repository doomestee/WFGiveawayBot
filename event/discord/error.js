const chalk = require("chalk");

/**
 * @param {Object} stuff
 * @param {import("eris").Client} stuff.client 
 * @param {import("mongodb").MongoClient} stuff.mongo
 * @param {import("../../manager/logger")} stuff.logger
 * @param {import("../../manager/cooldown")} stuff.cooldowns
 */
module.exports = (stuff) => {
    const {client, logger, mongo} = stuff;

    client.on('error', (error, id) => {

        //if (error.message === 'Connection reset by peer') return logger.info(`Shard ${id} has been reset by Discord - reconnecting automatically.`, chalk.greenBright, false);

        switch (error.code) {
            case 1006:
                return logger.info(`Shard ${id} has been reset by Discord - reconnecting automatically.`, chalk.greenBright, false);
            default:
                return logger.error(error);
        }

        logger.error(error);

        console.log('------------------');
        console.log(error.message);
        console.log('------------------');
        console.log(error.stack);
        console.log('------------------');
        console.log(error.code);
        console.log('------------------');
    });
}