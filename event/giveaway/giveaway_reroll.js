//const chalk = require("chalk");

const Giveaway = require("../../structures/Giveaway");
const { id, randomNumber } = require("../../utilities");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {client, logger, giveaway} = stuff;

    /**
     * This will update the giveaway in the database, create a message in the same channel.
     * It is expected that before emitting this, you should check if the message still exist,
     * if the giveaway didn't end (without winners declared) or if there are no more winners to pick from
     */
    giveaway.on('giveaway_reroll', 
    /**
     * @param {Giveaway} ga 
     */
    (ga) => {
        // If the giveaway didn't end yet (with the winners already declared)
        if (ga.status !== Giveaway.status.ENDED_WINS) return;

        // If there were no winners or if the array is missing
        if (!ga.participants || !ga.participants.length) return;

        // Filters those who already won.
        let remaining = ga.participants.filter(loser => !loser.won);

        // Returns if there were no more remaining people to pick from.
        if (!remaining.length) return;

        // obv cos there should be only one shard since this bot is intended to be only for WFG
        if (!client.shards.size || client.shards.random().status !== 'ready') return;

        /**
         * @type {{id: string, won: boolean}[]}
         */
        let winners = [];

        // TODO: support multiple reroll in one command usage. (for eg if there are 5 winners or maybe reroll for 20 times for one winner)
        //for (let i = 0; i < ga.winners; i++) {
            let nomb = randomNumber(0, remaining.length-1);

            //if (remaining.length === 0) break; // cos yes

            winners.push(remaining[nomb]);
        //}

        for (let i = 0; i < winners.length; i++) {
            ga.participants.find(a => a.id === winners[i].id).won = true;
        }

        giveaway.updateGiveaway(ga._id, {$set: {participants: ga.participants}}).then(() => {
            client.createMessage(ga.message.channel_id, {
                content: `(REROLLED - ${remaining.length-winners.length} people left)\nCongratulations ${winners.map(user => `<@${user.id}>`).join(', ')} for winning:\n**${ga.prize}**\n${msg.jumpLink}`, messageReference: {messageID: msg.id}
            })

            //client.editMessage(ga.message.channel_id, ga.message.id, {
            //    content
            //})

            //client.getMessage(ga.message.channel_id, ga.message.id).then((msg) => {

            //}, () => {/* Prob those pesky people deleted a message just before it could reroll */})

        //ga.update(mongo, {$set: {participants: ga.participants}}).then((success) => {

        },logger.error);
    });
}