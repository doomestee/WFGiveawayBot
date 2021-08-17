/*


TODO: improve the entire code since it was taken off from the previous project, only slightly modified
TODO: remove unnecessary functions
TODO: add support for more restrictions



*/

const { platFromRank } = require(".");
//const { user } = require("..");

function arrayAnd(arr) {
    let maxLength = 0;
    arr.forEach(a => {
        if(a.length > maxLength) maxLength = a.length;
    });
  
    let retArr = [];
    for(i = 0; i < maxLength; i++) {
        val = 1;
        arr.forEach(a => {
            val = val & (a[i] || 0);
        });
        retArr.push(val);
    }
    return retArr;
}

module.exports = {
    verifyRestrictionByUser: 
    /**
     * @param {{user: import("../manager/user"), client: import("eris").Client}} essential 
     * @param {string|string[]} user_id 
     * @param {{t: 'RANK'|'ROLE'|'MESSAGE'|'PLATINUM', v: any}[]} restrictions 
     */
    async (essential, user_id, restrictions) => {
        if (!Array.isArray(user_id)) user_id = [user_id];
        if (restrictions && restrictions.length) {
            let result = {};

            for (let i = 0; i < restrictions.length; i++) {
                result[restrictions[i]['t']] = user_id.map(() => 0);
                switch (restrictions[i]['t']) {
                    case "PLATINUM": case "RANK":
                        /* 
                        
                        If the restriction involves platinum, it will check and return an array of 0 and 1, each index will be the same
                        and 0 would obviously mean that the user does not qualify whereas 1 is.

                        */

                        // Holy fudge, this is a big massive F for performance.
                        let users = user_id.map(id => {
                            let loser = user.fetch({_id: id});

                            return (loser && loser.length) ? loser[0] : null;
                        });

                        //let users = user.fetch().filter(loser => user_id.includes(loser._id) || user.listOfDisabled.includes(loser._id));

                        //let users = await mongo.db().collection('User').find({
                        //    "$or": user_id.map(a => { return {_id: a}; }) // lmao rip server.
                        //}).project({_id: 1, plat: 1}).toArray();

                        if (users.length) {
                            for (let a = 0; a < users.length; a++) {
                                if (users[a]['plat'] >= restrictions[i]['v']) // if their plat is greater than, or equal to the required plat.
                                    result[restrictions[i]['t']][user_id.findIndex(user => user == users[a]['_id'])] = 1;
                            }

                        } else {
                            return user_id.map(() => 0); // If none of the document has showed up, nobody qualifies and so therefore nobody can win it.
                        }
                        break;
                }
            }

        }

    }
}

module.exports = {
    verifyRestrictionByUser:
    /**
     * @param {import("../manager/user")} user 
     * @param {string|string[]} user_id
     * @param {{t: 'RANK'|'ROLE'|'MESSAGE'|'PLATINUM', v: any}[]} restrictions 
     * @param {{client: import("eris").Client}} essentials
     * @returns {Promise<number[]>} a list of 0 and 1, basically booleans but cheap.
     */
    async (user, user_id, restrictions, essentials) => {
        if (Array.isArray(user_id)) {
            if (restrictions && restrictions.length) {
                let result = {}; //restrictions.length; //user_id.map(a => 0); // ik ik, idek why do i have this, most of the code on this function is easily optimised but... spaghetti.

                for (let i = 0; i < restrictions.length; i++) {
                    result[restrictions[i]['t']] = user_id.map(() => 0);
                    switch (restrictions[i]['t']) {
                        case "PLATINUM":
                            /* 
                            
                            If the restriction involves platinum, it will check and return an array of 0 and 1, each index will be the same
                            and 0 would obviously mean that the user does not qualify whereas 1 is.

                            */

                            // Holy fudge, this is a big massive F for performance.
                            let users = user_id.map(id => {
                                let loser = user.fetch({_id: id});

                                return (loser && loser.length) ? loser[0] : null;
                            });

                            //let users = user.fetch().filter(loser => user_id.includes(loser._id) || user.listOfDisabled.includes(loser._id));

                            //let users = await mongo.db().collection('User').find({
                            //    "$or": user_id.map(a => { return {_id: a}; }) // lmao rip server.
                            //}).project({_id: 1, plat: 1}).toArray();

                            if (users.length) {
                                for (let a = 0; a < users.length; a++) {
                                    if (users[a]['plat'] >= restrictions[i]['v']) // if their plat is greater than, or equal to the required plat.
                                        result[restrictions[i]['t']][user_id.findIndex(user => user == users[a]['_id'])] = 1;
                                }

                            } else {
                                return user_id.map(() => 0); // If none of the document has showed up, nobody qualifies and so therefore nobody can win it.
                            }

                            //for (let i = 0; i < user_id.length; i++) {
                            //    // I know this is also inefficient because the users array would have to loop every time just until it would find a hit lmao
                            //    if (users.some(user => user.id == ))
                            //}

                            break;
                        case "RANK":
                            // ??? why am i using this instead of platinum?
                            let users1 = await this.fetchPlatinum(user, user_id);

                            if (users1.count) {
                                for (let a = 0; a < users1.count; a++) { // Loops through an array of platinum counts
                                    if (users1.users[a] >= platFromRank(restrictions[i]['v'])) { // Check if the user's plat is higher or same to the plat needed.
                                        result[restrictions[i]['t']][a] = 1; // Declare it a pass if so...
                                    }
                                }

                            } else {
                                return user_id.map(a => 0); // If none of the document has showed up, nobody qualifies and so therefore nobody can win the prize.
                            }
                            break;
                        case "ROLE":
                            if (!essentials || !essentials.client) //{
                                return Promise.reject(new Error("The essentials object was not passed in, with client object."));//Error("")
                            //}

                            let roles = (essentials.client.guilds)


                        default:
                            result[restrictions[i]['t']] = user_id.map(() => 1);
                    }
                }

                /* 

                TODO: Unify all of the restrictions pass stuff into one, so if a person has met 2 requirements then the end result is 1 for their index.
                If a person however have met only one of two requirements then the outcome is 0 for their index. (done)

                */

                return arrayAnd(Object.values(result)); // i love binary, yum yum /s
            } else return user_id.map(() => 1);
        } else {
            let result = [];

            if (!restrictions || !restrictions.length) return [1];

            for (let i = 0; i < restrictions.length; i++) {
                result[i] = 0;

                const type = restrictions[i]['t'];
                let value = restrictions[i]['v'];
                switch (restrictions[i]['t']) {
                    case "PLATINUM": case "RANK":
                        let users = user.fetch({_id: user_id});

                        if (users && users.length && users.some(a => a._id === user_id)) {
                            let plat = users.find(a => a._id === user_id).plat;

                            //let { plat: plat } = await this.fetchPlatinum(mongo, user_id);

                            if (type == 'RANK') value = platFromRank(value);

                            if (plat >= value) result[i] = 1;
                        }
                        break;
                    case "ROLE":
                        // TODO: ADD SUPPORT FOR ROLE.
                    default:
                        result[i] = 1;//result[restrictions[i]['t']] = user_id.map(() => 0);
                }
            }

            return result;
        }
    }, fetchPlatinum:
    /**
     * @deprecated
     * @param {import("../manager/user")} user 
     * @param {string|string[]} user_id
     * 
     * IF a list is given, this will return an array of platinum, each index will be the same as the list.
     * Unless if not a single user has platinum in the list.
     * 
     */
    async(user, user_id) => {
        if (Array.isArray(user_id)) {
            let result = user_id.map(() => 0);
    
            let users = user.fetch().filter(user => user_id.includes(user._id));
            //let users = await mongo.db().collection('User').find({
            //    $or: user_id.map(a => { return {_id: a }})
            //}).project({_id: 1, plat: 1}).toArray(); // The user ID is returned as... if the document doesn't exist then it won't be returned which can screw the length of the result.
    
            if (users.length) {
                for (let a = 0; a < users.length; a++) {
                    result[user_id.findIndex(user => user == users[a]['_id'])] = users[a]['plat'];
    
                    //result.push({ user: })
                    //result[restrictions[i]['t']][user_id.findIndex(user => user == users[a])] = 1;
                }
    
                return {count: users.length, users: result}
    
            } else {
                return {count: 0, users: []}; // If none of the document has showed up, nobody is logged on the spreadsheet.
            }
        } else { // This is assuming that the ID will be passed in as string, so please please...
            let loser = user.fetch({_id: user_id.toString()}); //await mongo.db().collection('User').findOne({_id: user_id.toString()});
    
            if (loser && loser.length) {
                return {_id: user_id, plat: loser[0]['plat']};
            } else {
                return {_id: user_id, plat: 0};
            }
        }
    }
}