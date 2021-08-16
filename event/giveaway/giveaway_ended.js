//const chalk = require("chalk");

const { ObjectID } = require("mongodb");
const Giveaway = require("../../structures/Giveaway");
const Infraction = require("../../structures/Infraction");
const { id, embed, randomNumber } = require("../../utilities");
const { verifyRestrictionByUser } = require("../../utilities/mongodb");

/**
 * This will be an object containing the IDs of the giveaways that are being processed, this is to prevent duplicates being processed yk
 * @type {{[id: string]: boolean}}
 */
const gibaway = {};

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {client, logger, mongo, giveaway, user, infraction} = stuff;

    giveaway.on('giveaway_ended', 
    /**
     * @param {import("../../structures/Giveaway")} ga 
     * @param {boolean} force_ended
     */
    (ga, force_ended=false) => {
        //if (ga.status === Giveaway.status.ENDED_WAITS) return;
        let obj = {
            status: Giveaway.status.ENDED_WAITS
        }; if (force_ended) obj.force_ended = true;

        // obv cos there should be only one shard since this bot is intended to be only for WFG
        if (!client.shards.size || client.shards.random().status !== 'ready') return;

        if (gibaway[ga.message.id + '_' + ga.message.channel_id]) return;

        if (!giveaway.initialised || !infraction.initialised) return setTimeout(() => giveaway.emit('giveaway_ended', ga, force_ended), 3000);;

        gibaway[ga.message.id + '_' + ga.message.channel_id] = true;

        giveaway.updateGiveaway(ga._id, {$set: obj}).then(() => {//Giveaway.status.ENDED}).then(() => {
            client.getMessage(ga.message.channel_id, ga.message.id).then(async (msg) => {
                let reaction = {
                    count: (msg.reactions[id.emoji.pop]) ? msg.reactions[id.emoji.pop].count : 0,
                    pages: (msg.reactions[id.emoji.pop]) ? Math.floor(msg.reactions[id.emoji.pop].count/100) : 0
                };

                /**
                 * @type {string[]}
                 */
                let users = [];
                for (let i = 0; i < reaction.pages+1; i++) {
                    let losers = await client.getMessageReaction(ga.message.channel_id, ga.message.id, id.emoji.pop, {limit: 100, after: (i === 0) ? undefined : users[users.length-1]}).catch(logger.error);

                    if (!Array.isArray(losers)) return;

                    losers.forEach(a => (a.bot != null && !a.bot) ? users.push(a.id) : null);
                } // rip API, dont ratelimit me pls.

                // Filters the users that are currently disqualified upon the end of the giveaway
                users = users.filter(user => !infraction.list.some((infr) => infr.user.id === user && !infr.action.resolved && infr.action.type === Infraction.action_type.DIQ));

                // Filters the users if they are a bot or 
                //users = users.filter(user => user != client.user.id && 
                //    !infraction.list.some(a => (a.user) ? a.user.id === user && a.action.resolved && a.action.type === Infraction.action_type.DIQ : false))

                // If nobody other than the bot has reacted
                if (users.filter(a => a != client.user.id).length == 0) {
                    msg.edit({content: "***THE GIVEAWAY HAS BEEN CONCLUDED!***", embed: embed.giveaway.end.nobodyJoin(ga)});

                    msg.channel.createMessage({content: `Nobody reacted so naturally, there isn't a winner. I call dibs on the prize.`, messageReference: {messageID: msg.id, failIfNotExists: false}}).then(() => {
                        ga.update(mongo, {$set: {status: Giveaway.status.ENDED_WINS, participants: null}}).catch(logger.error);
                    });
                    return;
                }
                
                // When there is at least a single person (excluding the bot)
                const indexes = await verifyRestrictionByUser(user, users.filter(a => a != client.user.id), ga.restrictions);

                if (indexes.filter(a => a === 1).length) {
                    let ids = users.filter(a => a != client.user.id)
                        .filter((val, index) => indexes[index]);
                    // This will filter the bot ID, then filter out people who did not qualify (TODO: log their disqualification)

                    if (ids.length <= ga.winners) { // If there is less amount of winners than the giveaway could allow for
                        msg.edit({content: "***THE GIVEAWAY HAS ENDED!***", embed: embed.giveaway.end.won(ga, ids)});
                        msg.channel.createMessage({content: `Congratulations ${ids.map(user => `<@${user}>`).join(', ')} for winning:\n**${ga.prize}**\n${msg.jumpLink}`, messageReference: {messageID: msg.id}}).then(() => {
                            ga.update(mongo, {$set: {status: Giveaway.status.ENDED_WINS, participants: ids.map(a => {return {id: a, won: true}})}}).catch(logger.error);
                            //updateGiveaway(mongo, ga, { $set: { status: 3} }).catch((bpo) => { return; bpo; });
                        });
                    } else {
                        let winners = [];

                        for (let i = 0; i < ga.winners; i++) {
                            let nomb = randomNumber(0, ids.length-1);

                            if (ids.length === 0) break; // cos yes

                            winners.push(ids[nomb]);
                            ids = ids.filter((a, index) => index != nomb);
                        }

                        winners.forEach(a => ids.push(a));
                        
                        msg.edit({content: "***THE GIVEAWAY HAS ENDED!***", embed: embed.giveaway.end.won(ga, winners)});
                        msg.channel.createMessage({content: `Congratulations ${winners.map(user => `<@${user}>`).join(', ')} for winning:\n**${ga.prize}**\n${msg.jumpLink}`, messageReference: {messageID: msg.id}}).then(() => {
                            ga.update(mongo, {$set: {status: Giveaway.status.ENDED_WINS, participants: ids.map(a => {return {id: a, won: winners.includes(a)}})}}).catch(logger.error);
                            //updateGiveaway(mongo, ga, { $set: { status: 3} }).catch((bpo) => { return; bpo; });
                        });
                    }
                } else {
                    msg.edit({content: "***THE GIVEAWAY HAS ENDED!***", embed: embed.giveaway.end.nobodyWon(ga)});
                    msg.channel.createMessage({content: `Not a single qualifying person won.\n${msg.jumpLink}`, messageReference: {messageID: msg.id}}).then(() => {
                        ga.update(mongo, {$set: {status: Giveaway.status.ENDED_WINS, participants: null}}).catch(logger.error);
                        //updateGiveaway(mongo, ga, { $set: { status: 3} }).catch((bpo) => { return; bpo; });
                    });
                }

            }, (err) => {
                gibaway[ga.message.id + '_' + ga.message.channel_id] = false;
                if (err.toString() !== 'DiscordRESTError [10008]: Unknown Message')
                    logger.error(err);
                if (giveaway.list.some(a => a._id === ga._id))
                    giveaway.list.find(pred => pred._id === ga._id).status = Giveaway.status.UNKNOWN;
                giveaway.updateGiveaway(ga._id, {$set: {status: Giveaway.status.UNKNOWN}}).catch((err) => logger.error(err));
            })
        }, (err) => logger.error(err));
    })


}