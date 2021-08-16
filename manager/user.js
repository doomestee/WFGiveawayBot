const { default: axios } = require("axios");
const { MongoClient } = require("mongodb");
const User = require("../structures/User");
const { id, yieldPropertiesOfObjects, compareObjects } = require("../utilities");

/**
 * @param {string} sql Not a normal kind of SQL, but rather what google would use for their system.
 * @returns 
 */
 function createLink(sql) {
    return `https://doc.google.com/spreadsheets/d/${id.sheet}/gviz/tq?tq=${sql.replace(/ /g, '+')}`;
}

/**
 * The point of this manager is to causally restart the users fetched from the google sheet api stuff idk
 */
module.exports = class UserManager {
    /**
     * @param {MongoClient|null} mongo If null, this will assume that the manager is not ready yet and thus most of the methods will be paused.
     */
    constructor(mongo) {
        this.createdAt = Date.now();
        this.initalised = false;
        /**
         * @protected
         */
        this.initialising = false;
        this.client = mongo;
        this.timers = {1: 0};
        /**
         * @type {User[]}
         */
        this.list = [];
        /**
         * This list will contain entries where each entry will have a person binding to their original ID.
         * The point of this is that it will merge both of the platinum together, common case might be that
         * the person could not use the original account anymore and so has to be using a new account.
         * 
         * @type {{_id: string, bind_id: string, reason: string}[]}
         */
        this.listOfDisabled = [];

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

        this.client.db().collection('binding_user').find().toArray().then((val) => {
            this.listOfDisabled = val;

            //console.log(this.listOfDisabled);
        })

        return axios.get(createLink("select A, B, C"), {timeout: 60000}).then(async (res) => {
            if (res.status === 200) {

                if (!res.data.startsWith("/*O_o*/")) return res;
                
                const table = JSON.parse(res.data.slice('/*O_o*/ google.visualization.Query.setResponse('.length).slice(0, -2))["table"];

                /**
                 * @type {{_id: string, name: string, plat: number}[]}
                 */
                const rows = table.rows.filter(a => !a['c'].includes(null)).map(a => a['c'].map(b => b['v'])).map(a => {return new User({_id: a[0], name: a[1], plat: a[2]})});

                //await this.client.db().createCollection
                if ((await this.client.db().collections()).some(col => col.collectionName === 'User')) await this.client.db().collection('User').drop();
                await this.client.db().collection('User').insertMany(rows);
                
                this.list = rows;
                this.initalised = true;

                this.timers[1] = setInterval(() => this._timer1.call(this), 900000); // 15 minutes (ofc due to beautiful thing about setinterval, it will be much much much longer than 15 minutes)

                return true;

            } else {
                this.initialising = false;
                this.initalised = false;
                return res;
            }

        }, (err) => {
            this.initalised = false;
            this.initialising = false;
            return err;
        })

    }

    /**
     * @protected
     */
    _timer1() {
        return axios.get(createLink("select A, B, C"), {timeout: 60000}).then(async (res) => {
            if (res.status === 200) {

                if (!res.data.startsWith("/*O_o*/")) return res;
                
                const table = JSON.parse(res.data.slice('/*O_o*/ google.visualization.Query.setResponse('.length).slice(0, -2))["table"];

                /**
                 * @type {{_id: string, name: string, plat: number}[]}
                 */
                const rows = table.rows.filter(a => !a['c'].includes(null)).map(a => a['c'].map(b => b['v'])).map(a => {return new User({_id: a[0], name: a[1], plat: a[2]})});

                await this.client.db().collection('User').drop();
                await this.client.db().collection('User').insertMany(rows);

                this.list = rows;

                return true;

            } else {
                //this.initialising = false;
                //this.initalised;
                return res;
            }

        }, (err) => {
            //this.initalised = false;
            //this.initialising = false;
            return err;
        })
    }
}