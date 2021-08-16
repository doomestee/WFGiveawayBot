//const chalk = require("chalk");

const Infraction = require("../../structures/Infraction");
const { id, embed } = require("../../utilities");
const { verifyRestrictionByUser } = require("../../utilities/mongodb");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {client, logger, mongo, giveaway: ga_manager, user: user_manager, infraction} = stuff;

    client.on('messageReactionAdd', (msg, emoji, reactor) => {
        if (emoji.name !== id.emoji.pop) return;
        if (!ga_manager.initialised) return;
        if (reactor.id === client.user.id) return;
        if (reactor.bot) return;

        // NOTE: any reaction from here is not meant to be saved as this bot is only meant to remove the reactions that do not count.

        // Skip if the message id is not part of the giveaways.

        if (!ga_manager.list.some(a => (a.message) ? a.message.id === msg.id: false)) return;//msg.id)

        if (infraction.list.some((infr) => infr.user.id === reactor.id && !infr.action.resolved && infr.action.type === Infraction.action_type.DIQ))
            return client.removeMessageReaction(msg.channel.id, msg.id, id.emoji.pop, reactor.id).catch(logger.error);


        //if (messages[msg.id] == undefined && emoji.id != id.emoji) return;

        // This will also skip if the restriction is empty since anybody can join.
        // It is also placed down here since the bot will ree in chaos if it tries to compare undefined to something... defined.
        let giveaway = ga_manager.list.find(ga => (ga.message) ? ga.message.id === msg.id : false);

        if (!giveaway.restrictions || !Array.isArray(giveaway.restrictions) || !giveaway.restrictions.length) return;
        
        //if (messages[msg.id] == {}) return;

        verifyRestrictionByUser(user_manager, reactor.id, giveaway.restrictions).then((result) => {
            if (result.every(a => a === 1)) return; // This will ignore since the user qualifies.
            else {
                // TODO: increment counter. disqualify if repeated?
                client.removeMessageReaction(msg.channel.id, msg.id, id.emoji.pop, reactor.id).catch(logger.error);
                client.getDMChannel(reactor.id).then((chnl) => {
                    chnl.createMessage({
                        content: 'hALT!',
                        embed: embed.dm.doesntCount(giveaway.restrictions, result)
                    }).catch(() => {});
                }, () => {})// If it no worky, the user prob has disabled their DMs so this function will not be caught.
            }

        })
    })

}