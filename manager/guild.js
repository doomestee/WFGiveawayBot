//const { default: axios } = require("axios");
const { MongoClient, ObjectID } = require("mongodb");
const Guild = require("../structures/Guild");
const { id, yieldPropertiesOfObjects, compareObjects } = require("../utilities");

/**
 * The point of this manager is to causally restart the users fetched from the google sheet api stuff idk
 */
module.exports = class GuildManager {
    /**
     * @param {MongoClient|null} mongo If null, this will assume that the manager is not ready yet and thus most of the methods will be paused.
     * @param {import("./logger")} logger A logger manager to bind any error into it
     */
    constructor(mongo, logger) {
        this.createdAt = Date.now();
        this.initialised = false;
        /**
         * @protected
         */
        this.initialising = false;
        this.client = mongo;
        this.timers = {1: 0};
        this.logger = logger;
        /**
         * @type {Guild[]}
         */
        this.list = [];

        if (mongo === null) return;
        if (typeof(mongo) !== 'object' || !(mongo instanceof MongoClient)) throw Error("The argument passed is neither mongoclient or null.");

        this.initialise();
    }

    /**
     * @param {Object} criteria Note the result will be an array. (IF NOTHING IS PASSED, you will get an array but the binding won't happen)
     * @param {string} [criteria._id] If given, the other criteria are ignored.
     * @param {string} [criteria.name]
     * @param {number} [criteria.plat]
     * @returns {User[]} TODO: support for fetching by name and plat only!
     */
    fetch(criteria) {
        /**
         * @param {Object} criteria Note the result will be an array. (IF NOTHING IS PASSED, you will get an array but the binding won't happen)
         * @param {string} [criteria._id] If given, the other criteria are ignored.
         * @param {string} [criteria.name]
         * @param {number} [criteria.plat]
         */
        const get = (criteria, ignoreBind=false) => {
            if (!criteria) return this.list;

            if (!['_id', 'name', 'plat'].some(a => criteria[a])) return null;

            if (criteria._id) { // This will return an array
                let list = this.list.filter(user => user._id === criteria._id);

                if (!list.length && !this.listOfDisabled.some(loser => loser._id === criteria._id)) return null;

                if (!list.length) list = [{_id: criteria._id, name: criteria.name || null, plat: 0}];
                /*if (!list.length) {
                    let wack = this.listOfDisabled.filter(loser => loser._id === user._id || loser.bind_id === user._id && !ignoreBind);
                    wack.forEach(loser => {
                        if (loser._id === criteria._id) return loser.opposite = true;
                    });

                    return {

                    }
                }*/

                return list.map((user) => {
                    let wack = this.listOfDisabled.filter(disabled => disabled._id === user._id || disabled.bind_id === user._id && !ignoreBind);
                    wack.forEach(loser => {
                        if (loser._id === user._id) return loser.opposite = true;
                    })

                    return {
                        _id: user._id,
                        name: user.name,
                        plat: user.plat + ((!ignoreBind && wack) ? wack.reduce((prev, curr) => {
                            let gotcha = get({_id: (curr.opposite) ? curr.bind_id : curr._id}, true);
                            
                            // Rip readability.
                            return prev + (gotcha) ? gotcha.reduce((prev1, curr1) => prev1 + curr1.plat, 0) : 0;
                        }, 0)/*wack.map((loser) => {
                            return get({_id: (loser.opposite) ? loser._id : loser.bind_id}, true). //if (loser.opposite) return get({_id: loser._id})
                        }).reduce((prev, curr) => prev + curr, 0)*/ : 0),
                        binded: (!ignoreBind && !!wack)
                    }
                })
            }

            //return this.list.filter(user => compareObjects(criteria, user)) || null//yieldPropertiesOfObjects({plat: 0, name: ''})
        }

        //get({_id: (loser.opposite) ? loser._id : loser.bind_id}, true)[0].plat

        return get(criteria, false);

        if (!criteria) return this.list;

        //if (!criteria) return this.list.map((user) => {
            // RIP PERFORMANCE
        //    if (this.listOfDisabled.some(a => a.bind_id === user._id))
        //});

        if (!['_id', 'name', 'plat'].some(a => criteria[a])) return null; // Like, idk if possible but you gave absolutely nothing useful.


        if (criteria._id) {
            let list = this.list.filter(user => user._id === criteria._id);

            if (!list.length) return null;

            return list.map((user) => {
                let wack = this.listOfDisabled.filter(disabled => disabled._id === user._id || disabled.bind_id === user._id && !ignoreBind);

                return {
                    _id: user._id,
                    name: user.name,
                    plat: user.plat + (wack && !ignoreBind) ? this.fetch: 0,
                    binded: true
                }

            })


        }

        return this.list.filter(user => compareObjects(criteria, user)) || null//yieldPropertiesOfObjects({plat: 0, name: ''})
    }

    /**
     * @param {MongoClient} mongo
     */
    async initialise(mongo) {
        if (this.initialised || this.initialising) return Promise.reject("It is already initialised.");
        this.initialising = true;

        if (mongo && mongo instanceof MongoClient) this.client = mongo;
        else if (!this.client) {
            this.initialising = false;
            return Promise.reject("No mongoclient was passed in.");
        }

        if (!(await this.client.db().collections()).some(col => col.collectionName === 'Infraction')) await this.client.db().createCollection('Infraction');

        const cursor = this.client.db().collection('Infraction').find({$or: [{'action.resolved': false}]});//({"$or": [{status: 0}, {status: 1}, {status: 2}, {status: 3}]})

        /**
         * @type {Infraction}
         */
        let infraction = null;
        while (null !== (infraction = (await cursor.next()))) {
            infraction = new Infraction(infraction);

            // If the infraction isn't greater than current time during the execution of the function
            // In another word, the time is already out
            if (infraction.action.resolved) return;
            if (!infraction.action.duration || (infraction.action.start+((infraction.action.duration || 0)) > Date.now())) this.list.push(infraction);
            //if ((infraction.action.start+infraction.action.duration) > Date.now()) this.list.push(infraction);
            else {
                switch (infraction.action.type) {
                    case 1: super.emit('disqualify_end', infraction);
                    break;
                    case 2: null;
                    break;
                }
            }
        }
        this.initialised = true;
        this.initialised = true;
        this.initialising = false;

        this._timer1();
        //this._timer2();

        //this.timers[1] = setTimeout()//setInterval(() => this._timer1.call(this), 10000); // 10s
        //this.timers[2] = setInterval(() => this._timer2.call(this), 3000); // 3s

        return true;
    }

    /**
     * 10s interval (settimeout) unless prohibit variable is set to true, prohibiting the usage of timeout.
     * Timer for checking disqualified user's time to see if it has run out by now.
     * Also to filter any infractions that are already resolved.
     * @protected
     */
    _timer1(prohibit=false) {
        //console.log(this.list.length);
        this.list = this.list.filter(infr => !infr.action.resolved);

        let list = this.list.filter(infr => (infr.action) ? infr.action.type === 1 && !infr.action.resolved && infr.action.duration != null : false);

        for (let i = 0; i < list.length; i++) {
            const item = list[i];

            // If the infraction isn't greater than current time during the execution of the function
            // In another word, the time is already out
            //if (item.action.resolved) continue;
            if (!item.action.duration || (item.action.start+((item.action.duration || 0)) > Date.now())) continue;//this.list.push(item);
            //if ((infraction.action.start+infraction.action.duration) > Date.now()) this.list.push(infraction);
            else {
                switch (item.action.type) {
                    case 1: super.emit('disqualify_end', item);
                    break;
                    case 2: null;
                    break;
                }
            }
        }

        //if (prohibit) clearInterval(this.timers[1]);
        if (!prohibit)
            this.timers[1] = setTimeout(() => this._timer1.call(this), 10000);
    }
    
    /**
     * FRIENDLY REMINDER: make sure to edit the infraction object yourself if the update is successful because for some reason
     * it doesn't seem to work directly here and when it does, the list quadruples.
     * @param {ObjectID} id
     * @param {Object} info
     * @param {Object} info.$set
     * @param {Object} info.$set.guild Guild's information
     * @param {string} info.$set.guild.id Guild's ID
     * @param {Object} info.$set.moderator Moderator's information
     * @param {string} info.$set.moderator.id Moderator's ID
     * @param {Object} info.$set.user User's information
     * @param {string} info.$set.user.id User's ID
     * @param {string} info.$set.user.name User's name
     * @param {Object} info.$set.action Action taken
     * @param {number} info.$set.action.type Type of action
     * @param {number} info.$set.action.start When the action is due to take effect
     * @param {number} info.$set.action.duration When the action is due to end (null for indefinite)
     * @param {boolean} info.$set.action.resolved If true, the action is meant to be cleared and the action taken is null.
     * @param {boolean} info.$set.reason Reason for the infraction.
     * @returns Note that the result is mutable. (or not idk)
     */
    async update(id, info) {
        if (!id) return Promise.reject("ID not provided");

        let result = await this.client.db().collection('Infraction').findOneAndUpdate({_id: new ObjectID(id)}, info, {returnDocument: 'after'});

        if (!result.ok) return Promise.reject("Nothing has changed.");

        let thing = this.list.findIndex(item => item._id === new ObjectID(id));

        if (thing === -1) {
            this.list.push(new Infraction(result.value));

            return this.list.find(item => item === new Infraction(result.value));
        } else {
            //console.log("wow");
            //console.log(this.list[thing]);
            //console.log("wow");
            
            //let prop = Object.keys(this.list[thing]), keys = Object.keys(info.$set).filter(key => prop.some(konk => konk === key));

            //if (!keys.length) return this.list[thing];

            //keys.forEach(key => this.list[thing][key] = obj2[key]);

            //console.log(keys);

            yieldPropertiesOfObjects(this.list[thing], info.$set, null, true);

            return this.list[thing];//this.list[thing] = new Infraction(yieldPropertiesOfObjects(this.list[thing], result.value, true));
        }


        return this.client.db().collection('Infraction').findOneAndUpdate({_id: new ObjectID(id)}, info).then((result) => {
            if (!result.ok) return Promise.reject("Nothing has changed.");

            let thing = this.list.findIndex(item => item._id == new ObjectID(id));
            //let thing = this.list.find(pred => pred._id === id);

            if (!thing || thing === -1) {
                this.list.push(new Infraction(result.value));

                return this.list.find(item => item === new Infraction(result.value));
            } else {
                //this.list.find(pred => pred === thing) = new Infraction(yieldPropertiesOfObjects(thing, result.value, true));
                this.list[thing] = new Infraction(yieldPropertiesOfObjects(this.list[thing], result.value, true));

                //return this.list[thing];

                
                //let item = new Infraction(yieldPropertiesOfObjects(thing, result.value, true));

                //this.list.findIndex(pred => pred._id === id)]
                //thing = new Giveaway(yieldPropertiesOfObjects(thing, result.value, true));
                return this.list.find(pred => pred._id === new ObjectID(id));
            }

        })
    }

    /**
     * @param {Object} info Any property with (E) at the start on their jsdoc will throw an error if an object for is not provided
     * @param {Object} info.user (E) User's information
     * @param {string} info.user.id (E) User's ID
     * @param {string} [info.user.name] User's name
     * @param {Object} info.action (E) The action taken
     * @param {number} info.action.type (E) Type of action
     * @param {number} info.action.start When the action's taking effect, in milliseconds
     * @param {number} [info.action.duration] When the action's due to end, in milliseconds. (null for permanent)
     * @param {boolean} [info.action.resolved] If the action has been cleared (re-qualify or unban) when the action has expired.
     * @param {Object} info.moderator (E) Moderator's information
     * @param {string} info.moderator.id (E) Moderator's ID
     * @param {Object} info.guild (E) Guild's information
     * @param {string} info.guild.id (E) Guild's ID
     * @param {string} [info.reason] Reason for the infraction
     */
    async create(info) {
        if (!this.initialised) return Promise.reject(new Error("The manager has not yet initialised."));

        if (!info) return Promise.reject(new Error("The information was not passed in"));
        if (!['user', 'guild', 'moderator', 'action'].some(a => info[a] !== undefined || typeof(info[a]) !== 'object')) return Promise.reject(new Error("All of the required properties aren't filled in."));
        if (!info.user      || !info.user.id) return Promise.reject(new Error("The user's ID is not provided."));
        if (!info.action    || info.action.type == undefined) return Promise.reject(new Error("The action type is not provided."));
        if (!info.moderator || !info.moderator.id) return Promise.reject(new Error("The moderator's ID is not provided."));
        if (!info.guild     || !info.guild.id) return Promise.reject(new Error("The guild's ID is not provided."));

        let infraction = new Infraction({
            user: {
                id: info.user.id,
                name: info.user.name || null,
            },
            action: {
                start: info.action.start || Date.now(),
                duration: info.action.duration || null,
                resolved: info.action.resolved || false,
                type: info.action.type
            },
            moderator: {
                id: info.moderator.id
            },
            guild: {
                id: info
            }, reason: (info.reason) ? info.reason : 'No reason provided.'
        })

        return this.client.db().collection('Infraction').insertOne(infraction).then((res) => {
            infraction._id = res.insertedId;
 
            // Annoyingly, I think it happened a few time that there is already an infraction with the same ID, idk how, idk why but just kms.
            if (!infraction.action.resolved && !this.list.some(a => a._id === res.insertedId)) this.list.push(infraction);

            return infraction;
        }, this.logger.error);
    }
}