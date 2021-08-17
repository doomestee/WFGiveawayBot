/*


TODO: improve the entire code since it was taken off from the previous project, only slightly modified
TODO: remove unnecessary functions
TODO: add support for more restrictions



*/

const { platFromRank } = require(".");
//const { user } = require("..");

/**
 * Shout out to Seb135 for the function :)
 * @param {(0|1)[][]} arr 
 * @returns {(0|1)[]}
 */
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
     * @param {{user: import("../manager/user"), client: import("eris").Client, guild_id: string}} essential "PLATINUM"/"RANK" will need user manager, "ROLE" will need (discord) client and guild_id
     * @param {string|string[]} user_id 
     * @param {{t: 'RANK'|'ROLE'|'MESSAGE'|'PLATINUM', v: any}[]} restrictions 
     */
    async (essential, user_id, restrictions) => {
        if (!Array.isArray(user_id)) user_id = [user_id];
        if (restrictions && restrictions.length) {
            let result = {};

            for (let i = 0; i < restrictions.length; i++) {
                const type = restrictions[i]['t'];

                //result[restrictions[i]['t']] = user_id.map(() => 0);
                //if (type !== 'UNKNOWN')
                result[type] = user_id.map(() => 0);
                switch (type) {
                    case "PLATINUM": case "RANK":
                        if (!essential && !essential.user) return Promise.reject(new Error("The user was not provided as an object for the first argument"));

                        const { user } = essential;

                        /* 
                        
                        If the restriction involves platinum, it will check and return an array of 0 and 1, each index will be the same
                        and 0 would obviously mean that the user does not qualify whereas 1 is.

                        */

                        // Holy fudge, this is a big massive F for performance.
                        // TODO: basically optimise this case code further by having everything in one for loop for faster performance compared to .map
                        let users = user_id.map(id => {
                            let loser = user.fetch({_id: id});

                            return (loser && loser.length) ? loser[0] : null;
                        });

                        //let users = user.fetch().filter(loser => user_id.includes(loser._id) || user.listOfDisabled.includes(loser._id));

                        //let users = await mongo.db().collection('User').find({
                        //    "$or": user_id.map(a => { return {_id: a}; }) // lmao rip server.
                        //}).project({_id: 1, plat: 1}).toArray();

                        let value = (type === 'RANK') ? platFromRank(restrictions[i]['v']) : restrictions[i]['v'];
                        if (users.length) {
                            for (let a = 0; a < users.length; a++) {
                                if (users[a] !== null && users[a]['plat'] >= value) // if their plat is greater than, or equal to the required plat.
                                    result[type][user_id.findIndex(user => user == users[a]['_id'])] = 1;
                            }

                        } else {
                            return user_id.map(() => 0); // If none of the document has showed up, nobody qualifies and so therefore nobody can win it.
                        }
                        break;
                    case "ROLE":
                        if (!essential && !(essential.client || essential.guild_id)) return Promise.reject(new Error("The client and or guild_id were not provided as an object for the first argument"));

                        const { client } = essential;

                        let guild = client.guilds.get(essential.guild_id);

                        /**
                         * This list will comprise of people that weren't cached for some reason.
                         * Also a F because this is going to be problematic when there for eg there might 
                         * be too many people that left before the giveaway could end.
                         */
                        let fail_list = [], oneGotcha = false;

                        // I cba resolving cache and stuff in case the guild doesn't exist, which should be impossible.
                        if (!guild) return user_id.map(() => 0);

                        for (let j = 0; j < user_id.length; j++) {
                            let member = guild.members.get(user_id[j]);

                            if (!member) member = fail_list.push(user_id[j]);

                            result[type][user_id[j]] = member.roles.some(role => role === restrictions[i]['v']);
                            if (!oneGotcha && result[type][user_id[j]]) oneGotcha = true;
                        }

                        if (!oneGotcha) return user_id.map(() => 0);
                        break;
                    default:
                        result[type] = user_id.map(() => 1);
                }
            }

            return arrayAnd(Object.values(result)); // i love binary, yum yum /s
        } else return user_id.map(() => 1);
    }, /*fetchPlatinum:
    /**
     * @deprecated
     * @param {import("../manager/user")} user 
     * @param {string|string[]} user_id
     * 
     * IF a list is given, this will return an array of platinum, each index will be the same as the list.
     * Unless if not a single user has platinum in the list.
     * 
     *
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
    }*/
}