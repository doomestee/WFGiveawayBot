/**
 * This file is not related to any of Eris or Discord libraries, just
 * a separate User class for stuff in mongodb.
 */

const { ObjectID } = require("mongodb");
const { yieldPropertiesOfObjects } = require("../utilities");

module.exports = class Giveaway {
    /**
     * @param {Object} data
     * @param {ObjectID} [data._id] Giveaway's ID in the database
     * @param {string} [data.prize] The title of the prize
     * @param {number} [data.winners] How many winners for the giveaway.
     * @param {Object[]} [data.participants] List of people that qualifies upon end of the giveaway.
     * @param {string} [data.participants.id] The participant's ID
     * @param {boolean} [data.participants.won] Has this participant won at least once from this giveaway? (regardless if they were rerolled)
     * @param {number} [data.duration] How long will this giveaway last for (this will has to be added to `this.startDate`)
     * @param {number} [data.startDate] When the giveaway is set to start.
     * @param {number} [data.status] Status of the giveaway
     * @param {Object} [data.message] The message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [data.message.id] The ID of the message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [data.message.channel_id] The channel for the message if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [data.starter_id] The ID of the user who started the giveaway?
     * @param {Object} [data.contact] If applicable, is there a person to claim the prize? (If this isnt provided, the user will have to contact the `starter_id`)
     * @param {string} [data.contact.id] The ID of the user to contact when winning.
     * @param {Object[]} [data.restrictions] An array of restrictions, if there is none then it would still be an array.
     * @param {'PLATINUM'|'ROLE'} data.restrictions.t The type of the restriction
     * @param {number} data.restrictions.v The value of the restriction
     */
    constructor(data) {
        if (data.participants) {
            /**
             * List of people that qualifies upon end of the giveaway.
             */
            this.participants = data.participants;
        } else this.participants = null;
        /**
         * Giveaway's ID in the database
         * If the ID is not supplied, it will be supplied with one after being created in the database.
         */
        if (data._id)
            this._id = data._id;
        /**
         * The title of the prize
         */
        this.prize = data.prize;
        /**
         * How many winners for the giveaway.
         */
        this.winners = data.winners || 1;
        /**
         * How long will this giveaway last for (this will has to be added to `this.startDate`)
         */
        this.duration = data.duration;
        /**
         * When the giveaway is set to start.
         */
        this.startDate = data.startDate || Date.now();
        /**
         * Status of the giveaway
         * 0 for giveaways that hasnt started yet (scheduled), 1 for giveaways that are ongoing in a long period, 2 for giveaways that are about to end, 3 for giveaways that ended.
         * -1 for giveaways that has been cancelled. 
         */
        this.status = data.status || 0;
        if (data.message) {
            /**
             * The message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
             */
            this.message = {
                /**
                 * The ID of the message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
                 */
                id: data.message.id,
                /**
                 * The channel for the message if created, (if the message doesnt exist before it ended then it should be cancelled)
                 */
                channel_id: data.message.channel_id
            }
        } else this.message = null;
        /**
         * The ID of the user who started the giveaway?
         */
        this.starter_id = data.starter_id
        if (data.contact) {
            /**
             * If applicable, is there a person to claim the prize? (If this isnt provided, the user will have to contact the `starter_id`)
             */
            this.contact = {
                /**
                 * The ID of the user to contact when winning.
                 */
                id: data.contact.id
            }
        } else this.contact = null;
        /**
         * An array of restrictions, if there is none then it would still be an array.
         */
        this.restrictions = (data.restrictions != null) ? (Array.isArray(data.restrictions) && data.restrictions.length) ? data.restrictions : [] : [];
    }

    /**
     * @param {number} time epoch milliseconds in number
     * @param {number} margin (in milliseconds) the number used to offset in the function.
     * @returns {[boolean, number]} If number is -1, the duration isn't a number, otherwise it's the remaining duration.
     */
    hasEnded(margin=0, time=Date.now()) {
        if (typeof(this.duration) !== 'number' || typeof(this.startDate) !== 'number') return [false, -1];

        return ((this.duration + this.startDate) - margin - time >= 0) ? [false, ((this.duration + this.startDate) - margin - time)] : [true, 0]
    }

    /**
     * NOTE that this will not update the cache due to the lack of relationship between a giveaway and the manager
     * @param {import("mongodb").MongoClient} mongo
     * @param {Object} info 
     * @param {string} [info.prize] The title of the prize
     * @param {number} [info.winners] How many winners for the giveaway.
     * @param {Object[]} [info.participants] List of people that qualifies upon end of the giveaway.
     * @param {string} [info.participants.id] The participant's ID
     * @param {boolean} [info.participants.won] Has this participant won at least once from this giveaway? (regardless if they were rerolled)
     * @param {number} [info.duration] How long will this giveaway last for (this will has to be added to `this.startDate`)
     * @param {number} [info.startDate] When the giveaway is set to start.
     * @param {number} [info.status] Status of the giveaway
     * @param {Object} [info.message] The message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [info.message.id] The ID of the message for the giveaway if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [info.message.channel_id] The channel for the message if created, (if the message doesnt exist before it ended then it should be cancelled)
     * @param {string} [info.starter_id] The ID of the user who started the giveaway?
     * @param {Object} [info.contact] If applicable, is there a person to claim the prize? (If this isnt provided, the user will have to contact the `starter_id`)
     * @param {string} [info.contact.id] The ID of the user to contact when winning.
     * @param {Object[]} [info.restrictions] An array of restrictions, if there is none then it would still be an array.
     * @param {'PLATINUM'|'ROLE'} info.restrictions.t The type of the restriction
     * @param {number} info.restrictions.v The value of the restriction
     */
    async update(mongo, info) {
        if (info === undefined || info === {} || typeof(info) !== 'object') return Promise.reject("Empty information to update or the value given for info isn't an object.");

        return mongo.db().collection('Giveaways').findOneAndUpdate({_id: this._id}, info).then((result) => {
            if (!result.ok) return Promise.reject("Nothing was changed");

            // Is yielded a word btw?
            let yielded = yieldPropertiesOfObjects(this, result.value, true);
            let keys = Object.keys(yielded);

            for (let i = 0; i < keys.length; i++) { this[keys[i]] = yielded[keys[i]]; }

            //return ;

            //let thing = this.list.find(pred => pred._id === id);

            //if (!thing) {
            //    this.list.push(new Giveaway(result.value));

            //    return this.list.find(pred => pred === new Giveaway(result.value));
            //} else {
                //thing = new Giveaway(result.value);//yieldPropertiesOfObjects(info, result.value, true));
                //return thing;
            //}

            return this;
        });
    }

    /**
     * Status of the giveaway
     * 0 for giveaways that hasnt started yet (scheduled), 1 for giveaways that are ongoing in a long period, 2 for giveaways that are about to end, 3 for giveaways that ended.
     * -1 for giveaways that has been cancelled. 
     */
    static status = {
        /**
         * 0- Giveaway that hasn't started yet, most likely due to it being scheduled.
         */
        SCHEDULED: 0,
        /**
         * 1 - Giveaway that is currently still running
         */
        ONGOING: 1,
        /**
         * 2 - Giveaway that is about to end ~~(TODO: idk separate status for giveaways that are done but havent been processed yet)~~
         */
        ENDING: 2,
        /**
         * 3 - Giveaway that has ended and the winner has yet to be decided.
         */
        ENDED_WAITS: 3,
        /**
         * 4 - Giveaway that has ended and the winner has been decided.
         */
        ENDED_WINS: 4,
        /**
         * -1 - Giveaway that has been cancelled due to missing message
         */
        CANCELLED: -1,
        /**
         * -2 - since im lazy at the time of specifying this, its pretty much the same as `status.CANCELLED` except CANCELLED isn't used.
         */
        UNKNOWN: -2
    }
}