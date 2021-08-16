const { MongoClient, ObjectID } = require("mongodb");
const Giveaway = require("../structures/Giveaway");
const { compareObjects, yieldPropertiesOfObjects } = require("../utilities");
const EventEmitter = require("events");

//const fastq = require("fastq");

//async function queueWorker() {
    
//}

module.exports = class GiveawayManager extends EventEmitter {
    /**
     * 
     * @param {MongoClient} mongo 
     * @param {import("./logger")} logger Binds a logger to report in case of any error.
     * @param {boolean} initialise Whether to start using mongodb right now to collect stuff for initialise, if false then it will have to be called manually before using anything else here.
     * @returns 
     */
    constructor(initialise=true, logger, mongo) {
        super();
        this.createdAt = Date.now();
        this.client = mongo || null;
        this.logger = logger;

        /**
         * For the sake of memory consumption stuff, this will only store giveaways with status indicating they are about to start, currently running or going to end.
         * @type {Giveaway[]}
         */
        this.list = [];
        //this.queue = fastq.promise()

        if (initialise) return initialise();
        
        /**
         * If the manager has been initialised (use `initialise` function if this is false)
         * @readonly
         */
        this.initialised = false;
        this.initialising = false;
        /**
         * @type {{1: number, 2: number}}
         */
        this.timers = {1: null, 2: null};
    }

    async initialise(mongo) {
        if (this.initialised || this.initialising) return Promise.reject("It is already initialised.");
        this.initialising = true;

        if (mongo && mongo instanceof MongoClient) this.client = mongo;
        else if (!this.client) {
            this.initialising = false;
            return Promise.reject("No mongoclient was passed in.");
        }

        const cursor = this.client.db().collection('Giveaways').find({"$or": [{status: 0}, {status: 1}, {status: 2}, {status: 3}]})

        /**
         * @type {Giveaway}
         */
        let giveaway = null;
        while (null !== (giveaway = (await cursor.next()))) {
            //if (giveaway.message && giveaway.message.id)

            this.list.push(new Giveaway(giveaway));
        }

        this.initialised = true;

        this.list.filter(pred => pred.status === Giveaway.status.ENDED_WAITS).forEach(ga => this.emit('giveaway_ended', ga));

        // Ongoing
        // TODO: make this a setinterval when there might be too many giveaways for the bot to process... idk why
        // TODO: make this a separate function that can be called manually which will also refresh the settimeout timer

        this._timer1();
        this._timer2();

        this.timers[1] = setInterval(() => this._timer1.call(this), 20000); // 20s
        this.timers[2] = setInterval(() => this._timer2.call(this), 3000); // 3s

        return true;
    }

    /**
     * A timer that will loop through all giveaways on the list with status at ONGOING
     */
    _timer1() {
        let list = this.list.filter(pred => pred.status === Giveaway.status.ONGOING);
        for (let i = 0; i < list.length; i++) {
            let item = list[i];

            // Returns if the giveaway is more than 15s
            if (!item.hasEnded(15000)[0]) continue;//return;
            // If the giveaway is less than 5s BUT is not meant to end yet
            if (item.hasEnded(5000)[0] && !item.hasEnded()[0]) {
                this.updateGiveaway(item._id, {$set: {status: Giveaway.status.ENDING}}).catch(this.logger.error);
            }

            // If the giveaway is already meant to be done
            if (item.hasEnded()[0]) {
                this.emit("giveaway_ended", item);
                continue;
                //return;
            }
            //}

            //this.updateGiveaway(item._id, {$set: {status: Giveaway.status.ENDING}}).catch(this.logger.error);
        }
    }

    /**
     * A timer that will loop through all giveaways on the list with status at ENDING
     */
    _timer2() {
        //console.log(this);
        let list = this.list.filter(pred => pred.status === Giveaway.status.ENDING);

        for (let i = 0; i < list.length; i++) {
            let item = list[i];

            if (item.hasEnded()[0]) {
                this.emit("giveaway_ended", item);
                continue;
                //return;
            }
        }
    }

    /**
     * This will first check from the cache, otherwise it will check the collection via mongo connection. If neither returns then it will return null.
     * @param {Object} criteria
     * @param {string|ObjectID} criteria._id If given, this will be automatically parsed as ObjectID and yield one result in array. (HIGH priority)
     * @param {string} criteria.message_id If given (along with `criteria.message_channel_id`) this will yield one result in array. (MEDIUM priority)
     * @param {string} criteria.message_channel_id If given (along with `criteria.message_id`) this will yield one result in array. (MEDIUM PRIORITY)
     * @param {string} criteria.prize If given (along with `criteria.duration` and `criteria.startDate`) this will yield one result in array. (LOW PRIORITY)
     * @param {string} criteria.duration If given (along with `criteria.prize` and `criteria.startDate`) this will yield one result in array. (LOW PRIORITY)
     * @param {string} criteria.startDate If given (along with `criteria.prize` and `criteria.duration`) this will yield one result in array. (LOW PRIORITY)
     * @param {string} criteria.participant If given solely, this will yields all of the giveaways the ID of the participant has been qualified for.
     * @param {boolean} ignoreMongo If true, this will skip checking mongodb so this will rely purely on cache.
     * @param {boolean} ignoreUpdateCache If true, this will skip updating the cache with documents from the cache. This is redundant if mongo is ignored.
     */
    async getGiveaway(criteria, ignoreMongo=false, ignoreUpdateCache=false) {
        if (!this.initialised) return Promise.reject("Not initialised yet.");

        let a;

        // Checks cache for the one resulter

        if (criteria._id) a = this.list.find(b => b._id === new ObjectID(criteria._id));
        //else if (Object.keys(criteria).length-1 === 0) return null;
        if (!a && criteria.message_id && criteria.message_channel_id) a = this.list.find(b => (b.message) ? (b.message.id === criteria.message_id && b.message.channel_id === criteria.message_channel_id) : false);
        if (!a && criteria.prize && criteria.duration && criteria.startDate) a = this.list.find(b => b.duration === criteria.duration && b.startDate === criteria.startDate && b.prize === criteria.prize);
        if (a) return [a];

        // Checks cache for the properties

        const critter = criteria;

        //if (critter.message_id || critter.message_channel_id) critter.message = {};
        if (critter.message_id) { critter['message.id'] = critter.message_id; delete critter.message_id; }
        if (critter.message_channel_id) { critter['message.channel_id'] = critter.message_channel_id; delete critter.message_channel_id; }

        if (typeof(critter._id) === 'string') critter._id = new ObjectID(critter._id);

        a = this.list.filter(b => compareObjects(b, critter));
        if (a.length) return a;
        else if (ignoreMongo) return null;

        // Checks mongodb if there are any (which will update cache).
        
        let list = (await this.client.db().collection('Giveaways').find(critter).toArray()).map(ga => new Giveaway(ga));

        if (!list.length) return null;

        if (!ignoreUpdateCache)
            list.forEach((ga) => {
                let bop = this.list.findIndex(pred => pred._id === ga._id);

                if (bop !== -1) {
                    // skip checking the difference anyways

                    this.list[bop] = ga;
                }
            });

        return list;

    }

    
    /**
     * @param {ObjectID} id The giveaway's ID in the database, it will be parsed as object ID if passed in as string.
     * @param {Object} info Note this is a passthrough, I cba updating but you can use $set: {} blah
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
     * @returns Note that the result is mutable.
     */
    async updateGiveaway(id, info) {
        if (!id) return Promise.reject("ID not provided");

        return this.client.db().collection('Giveaways').findOneAndUpdate({_id: new ObjectID(id)}, info, {returnDocument: 'after'}).then((result) => {
            if (!result.ok) return Promise.reject("Nothing was changed");

            let thing = this.list.findIndex(item => item._id == new ObjectID(id));
            //let thing = this.list.find(pred => pred._id === id);

            if (thing === -1) {
                this.list.push(new Giveaway(result.value));

                return this.list.find(pred => pred === new Giveaway(result.value));
            } else {
                //this.list.find(pred => pred === thing) = new Giveaway(yieldPropertiesOfObjects(thing, result.value, true));
                //this.list[thing] = new Giveaway(yieldPropertiesOfObjects(this.list[thing], result.value, true));
                
                //yieldPropertiesOfObjects(this.list[thing], info.$set, null, true);

                //let prop = Object.keys(this.list[thing]), keys = Object.keys(info.$set).filter(key => prop.some(konk => konk === key));

                //if (!keys.length) return this.list[thing];

                //keys.forEach(key => this.list[thing][key] = obj2[key]);

                yieldPropertiesOfObjects(this.list[thing], info.$set, null, true);

                return this.list[thing];

                //this.list.findIndex(pred => pred._id === id)]
                //thing = new Giveaway(yieldPropertiesOfObjects(thing, result.value, true));
                //return this.list[thing];//this.list.find(pred => pred === item);
            }
        });
    }

    /**
     * @param {Object} info Any property with (E) at the start on their jsdoc will throw an error if nothing is provided.
     * @param {string} [info.prize] (E) The prize of the giveaway
     * @param {number} [info.winners] The amount of people that can win the giveaways
     * @param {number} [info.duration] (E) In milliseconds, how long will the giveaway last for.
     * @param {number} [info.status] If left out, it will assume that the giveaway has not yet started, prohibiting the usage of `info.message`.
     * @param {Object} [info.message]
     * @param {string} [info.message.id]
     * @param {string} [info.message.channel_id]
     * @param {string} [info.contact_id] If left out, it will be null. ~If left out, `info.starter_id` will be used.~
     * @param {string} [info.starter_id] (E) The user who started the giveaway.
     * @param {Object[]} [info.restrictions] An array of restrictions.
     * @param {'PLATINUM'|'ROLE'} info.restrictions.t The type of the restriction
     * @param {number} info.restrictions.v The value of the restriction
     * @param {number} [info.startDate] If left out, it will use the current timestamp. (Use Date.now())
     * @param {Object[]} [info.participants] (if status is < 2, it will be null) List of people that qualifies upon end of the giveaway.
     * @param {string} [info.participants.id] The participant's ID
     * @param {boolean} [info.participants.won] Has this participant won at least once from this giveaway? (regardless if they were rerolled)
     * 
     */
    async createGiveaway(info) {
        if (!['prize', 'duration', 'starter_id'].some(a => info[a] !== undefined)) return Promise.reject(new Error("All of the required properties aren't filled in."));
        //if (info.duration > 5184000000) return Promise.reject(new Error("The duration is too long lol"));

        let giveaway = new Giveaway({
            prize: info.prize,
            winners: info.winners || 1,
            duration: info.duration,
            status: info.status || Giveaway.status.SCHEDULED,
            message: (info.status === Giveaway.status.SCHEDULED) ? null : {
                id: (info.message) ? info.message.id : null,
                channel_id: (info.message) ? info.message.channel_id : null
            },
            starter_id: info.starter_id,
            contact: (info.contact_id != null) ? {
                id: info.contact_id || null
            } : null,
            restrictions: info.restrictions || [],
            startDate: info.startDate || Date.now(),
            participants: (info.status <= Giveaway.status.ENDING) ? info.participants : null
        });

        return this.client.db().collection('Giveaways').insertOne(giveaway).then((res) => {
            giveaway._id = res.insertedId;

            // If the status is anywhere from 0 to 3, it will be appended to the list!
            if (Giveaway.status.SCHEDULED <= giveaway.status && giveaway.status <= Giveaway.status.ENDED_WAITS)
                this.list.push(giveaway);

            return giveaway;
        }).catch(this.logger.error);

    }
}