const Giveaway = require("../structures/Giveaway");
//const MessageEmbed = require("../structures/MessageEmbed");

/**
 * TODO: store them in a database rather than hardcoding
 */
const id = {
    emoji: {
        fail: '💀',
        pop: '🎉'
    }, //'ripoff_tada:838100743620657173'
    sheet: "14t9-54udr_eqaCgq9g1rWhPLHY_E-RxfdhKTXxgCERc",
    guild: {
        wfg: '487093399741267968',
        main: '876109515127398452',
    }, role: {
        giveaway: {
            '876109515127398452': '876118093426991124',
            '487093399741267968': '615739153010655232'
        }//,
        //disqualify: {
            
        //}
    }, log: {
        disqualify: {
            '876109515127398452': '876397963411329054',
            '487093399741267968': '487558555533049856'
        }
    }
};

const regex = {
    /* Tyvm Sleigh for the beautiful regex, they were awful to poke around with. */
    duration: /(\d+\s*(?:mo|[whdms]))/gi,
    number_only: /[^\d]/gi,
    snowflake: /^(\d{17,21})$/gi,
    restrictions: {
        platinum: /(\d+\s*(?:p))/gi,
        role_mentions: /^(?:<@&)?(\d{17,21})>?$/gi
    }
}

//giveaway = [{ prize: '', winners: 0, duration: 0, startDate: 0, status: 0, message: {id: '', channel_id: ''}, contact: {id: ''}, restrictions: {t: 'string', v: 0}}];

module.exports = {
    id, regex,
    /**
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    },
    /**
     * Compares any properties of the first object to the second, only properties that exists on both objects will be compared.
     * The result will be the values from the second object
     * @param {{}} obj1 
     * @param {{}} obj2 
     * @param {boolean} retain If true, this will keep some of the properties from the second object that doesn't exist in the first object
     * @param {boolean} modifyObjOne If true, the result is that assuming obj1 is mutable, will be modified directly.
     */
    yieldPropertiesOfObjects(obj1, obj2, retain=false, modifyObjOne=false) {
        if (!modifyObjOne) {
            let prop = Object.keys(obj1);

            // The keys below will be a list of properties that exists on both objects.
            let keys = Object.keys(obj2).filter(key => prop.some(konk => konk === key));

            if (!keys.length) return {};

            let result = (retain) ? obj2 : {};

            keys.forEach(key => result[key] = obj2[key]);

            return result;
        } else {
            let prop = Object.keys(obj1), keys = Object.keys(obj2).filter(key => prop.some(konk => konk === key));

            if (!keys.length) return obj1;

            keys.forEach(key => obj1[key] = obj2[key]);

            return obj1;
        }
    },
    compareObjects(obj1, obj2) {
        let prop = Object.keys(obj1);

        // The keys below will be a list of properties that exists on both objects.
        let keys = Object.keys(obj2).filter(key => prop.some(konk => konk === key));

        if (!keys.length) return false;

        let result = true;

        keys.forEach(key => {
            if (result && obj1[key] !== obj2[key]) result = false;
        });

        return result;
    },
    /**
     * @param {[string, string]} hashes 
     * @param {number} discriminator IF ONLY GIVEN, this will give you an avatar url based on this. If nothing is given then a random number is given.
     * @param {string} user_id If this and hashes are absent, they will give you a discriminator-based avatar url
     */
    getAvatarURL(hashes, discriminator, user_id) {
        if (!discriminator) discriminator = this.random.number(0, 7);

        if (!(Array.isArray(hashes) && user_id)) {
            return `https://cdn.discordapp.com/embed/avatars/${discriminator % 6}.png`;
        }

        if (hashes.every(a => a == null)) {
            return `https://cdn.discordapp.com/embed/avatars/${discriminator % 6}.png`;
        }
        if (hashes[0] != null) {
            return `https://cdn.discordapp.com/avatars/${user_id}/${(hashes[0].startsWith('a_')) ? hashes[0] + '.gif' : hashes[0] + '.png'}`;
        }
        if (hashes[1] != null) {
            return `https://cdn.discordapp.com/avatars/${user_id}/${(hashes[1].startsWith('a_')) ? hashes[1] + '.gif' : hashes[1] + '.png'}`;
        }
        
        return `https://cdn.discordapp.com/embed/avatars/${discriminator % 6}.png`;
    },
    embed: {
        giveaway: {
            end: {
                /**
                 * @param {Giveaway} giveaway 
                 * @returns {import("eris").Embed}
                 */
                nobodyJoin(giveaway) { return {
                    //content: "***THE GIVEAWAY HAS BEEN CONCLUDED!***",
                    //embed: {
                        title: giveaway.prize,
                        description: `Winner/s: **Nobody participated.**`,
                        fields: [{
                            name: `Restrictions:`,
                            value: /*(giveaway.restrictions.length) ?*/ formatRestrictions(giveaway.restrictions) /* : "__***None!***__"*/,
                            inline: true
                        }, {
                            name: "Contact:",
                            value: `Contact ${(giveaway.contact && giveaway.contact.id) ? `<@${giveaway.contact.id}>` : `<@${giveaway.starter_id}> (who has started the giveaway)`} for pick up!`,
                            inline: true
                        }, {
                            name: "Extra info:",
                            value: `This giveaway can only accept ${giveaway.winners} winner/s.\nYour reaction will not count if you do not qualify.`
                        }]
                    //}
                }},
                /**
                 * @param {Giveaway} giveaway 
                 * @returns {import("eris").Embed}
                 */
                nobodyWon(giveaway) { return {
                    //content: "***THE GIVEAWAY HAS ENDED!***",
                    //embed: {
                        title: giveaway.prize,
                        description: `Winner/s: **Nobody won!**`,
                        fields: [{
                            name: `Restrictions:`,
                            value: /*(giveaway.restrictions.length) ?*/ formatRestrictions(giveaway.restrictions) /* : "__***None!***__"*/,
                            inline: true
                        }, {
                            name: "Contact:",
                            value: `Contact ${(giveaway.contact && giveaway.contact.id) ? `<@${giveaway.contact.id}>` : `<@${giveaway.starter_id}> (who has started the giveaway)`} for pick up!`,
                            inline: true
                        }, {
                            name: "Extra info:",
                            value: `This giveaway can only accept ${giveaway.winners} winner/s.\nYour reaction will not count if you do not qualify.`
                        }]
                    //}
                }},
                /**
                 * @param {{prize: string, winners: number, duration: number, startDate: number, status: number, message: {id: string, channel_id: string}, contact: {id: string}, restrictions: {t: string, v: any}[]}} giveaway
                 * @param {string[]} winners an array of the user IDs.
                 * @returns {import("eris").Embed}
                 */
                won(giveaway, winners) { return {
                    //content: "***THE GIVEAWAY HAS ENDED!***",
                    //embed: {
                        title: giveaway.prize,
                        description: `Winner/s: ${winners.map(user => `<@${user}>`).join(', ')}.`,
                        fields: [{
                            name: `Restrictions:`,
                            value: /*(giveaway.restrictions.length) ?*/ formatRestrictions(giveaway.restrictions) /* : "__***None!***__"*/,
                            inline: true
                        }, {
                            name: "Contact:",
                            value: `Contact ${(giveaway.contact && giveaway.contact.id) ? `<@${giveaway.contact.id}>` : `<@${giveaway.starter_id}> (who has started the giveaway)`} for pick up!`,
                            inline: true
                        }, {
                            name: "Extra info:",
                            value: `This giveaway can only accept ${giveaway.winners} winner/s.\nYour reaction will not count if you do not qualify.`
                        }]
                    //}
                }}
            },
            /**
             * prize, duration, startDate, restrictions, contact.id, starter_id, winners are all needed.
             * @param {Giveaway} giveaway
             * @returns {import("eris").Embed}
             */
            start: (giveaway) => { return {
                //content: `${id.emoji} **GIVEAWAY HAS STARTED!** ${id.emoji}`,
                //embed: {
                    title: giveaway.prize,
                    description: `End date: <t:${Math.floor(giveaway.duration/1000)+Math.floor(giveaway.startDate/1000)}:f>\nEnding in <t:${Math.floor(giveaway.duration/1000)+Math.floor(giveaway.startDate/1000)}:R>`,//${formatDuration(giveaway.startDate, giveaway.duration)}`,
                    fields: [{
                        name: `Restrictions:`,
                        value: /*(giveaway.restrictions.length) ?*/ formatRestrictions(giveaway.restrictions) /* : "__***None!***__"*/,
                        inline: true
                    }, {
                        name: "Contact:",
                        value: `Contact ${(giveaway.contact && giveaway.contact.id) ? `<@${giveaway.contact.id}>` : `<@${giveaway.starter_id}> (who has started the giveaway)`} for pick up!`,
                        inline: true
                    }, {
                        name: "Extra info:",
                        value: `This giveaway can only accept ${giveaway.winners} winner/s.\nYour reaction will not count if you do not qualify.`
                    }], color: 0x00dd00, timestamp: new Date(giveaway.duration+giveaway.startDate)
                //}
            }},
            error: {
                /**
                 * @param {Giveaway} giveaway prize, restrictions, contact.id, starter_id, winners are all needed.
                 * @returns {import("eris").Embed}
                 */
                database: (giveaway) => { return {
                    //content: `${id.emoji} **GIVEAWAY HAS STARTED!** ${id.emoji}`,
                    //embed: {
                        title: giveaway.prize,
                        description: `There's been an error with database, this giveaway is affected and thus won't continue as normal.`,//${formatDuration(giveaway.startDate, giveaway.duration)}`,
                        fields: [{
                            name: `Restrictions:`,
                            value: /*(giveaway.restrictions.length) ?*/ formatRestrictions(giveaway.restrictions) /* : "__***None!***__"*/,
                            inline: true
                        }, {
                            name: "Contact:",
                            value: `Contact ${(giveaway.contact) ? `<@${giveaway.contact.id}>` : `<@${giveaway.starter_id}> (who has started the giveaway)`} for pick up!`,
                            inline: true
                        }, {
                            name: "Extra info:",
                            value: `~~This giveaway can only accept ${giveaway.winners} winner/s.\nYour reaction will not count if you do not qualify.~~`
                        }], color: 0x000000
                    //}
                }}, 
            }
        },
        dm: {
            doesntCount: 
            /**
             * @param {{t: string, v: any}[]} restrictions
             * @param {number[]} qualification
             * @returns {import("eris").Embed}
             */
            (restrictions, qualification) => {
                return {
                    //embed: {
                        footer: {
                            text: `This is a one-way message via the bot.`
                        }, 
                        title: "Vote rejected.", 
                        description: `Your reaction has been removed (and your reaction won't count).\nThis is because you do not meet one of the requirements:${formatRestrictions(restrictions, qualification, true)}`
                    //}
                }
            }
        }
    },
    convertRankToPing,
    donatorRankFromPlat,
    platFromRank
}

function duration(ns) {
    const sec = Math.floor((ns % (1000 * 60)) / 1000);
    const min = Math.floor((ns % (1000 * 60 * 60)) / (1000 * 60))
    const hrs = Math.floor((ns % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const day = Math.floor(ns / (1000 * 60 * 60 * 24))

    return [
        sec, min, hrs, day
    ]
}

/**
 * @param {number} startDate Date.now() of when it started.
 * @param {number} durations Has to be in milliseconds...
 * @param {number} currentDate I think it is obvious.
 */
function formatDuration(startDate, durations, currentDate=Date.now()) {
    //let date = ((startDate+durations) - Date.now()); // Basically if it started 5 days ago, its meant to last for 7 days. The - would mean to... idk.

    let time = duration((startDate+durations) - currentDate).map(numb => numb.toString());

    return `${time[3].padStart(1, '0')}d, ${time[2].padStart(2, '0')}h, ${time[1].padStart(2, '0')}m, ${time[0].padStart(2, '0')}s`
}

/**
 * @param {{t: 'RANK'|'ROLE'|'MESSAGE'|'PLATINUM'|'UNOWNED', v: any}[]} restrictions MUST BE AN ARRAY BEING PASSED IN.
 * @param {number[]} tick If used, this will add tick or cross for 0 and 1s assuming theyve met the restrictions.
 * @param {boolean} ignoreStart Concatenate `You must have:` to the returns result.
 */
function formatRestrictions(restrictions, tick=false, ignoreStart=false) {
    if (!Array.isArray(restrictions) || !restrictions.length) return "__***None!***__";
    //if (!restrictions.length) return "__***None!***__"; // coulda put it in one if up there, but nah, the code would bleed since there is a possibility that it would check the length of an non-array...

    let result = (ignoreStart) ? '' : 'You must have:';

    for (let i = 0; i < restrictions.length; i++) {
        let restriction = restrictions[i];

        if (restriction['t'] == 'PLATINUM')      result += `\n${(tick !== false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''} - donated ${restriction['v']} platinum.`;
        else if (restriction['t'] == 'RANK')     result += `\n${(tick !== false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''} - ${restriction['v']} rank.`;//${(tick != false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''}.`;
        else if (restriction['t'] == 'ROLE')     result += `\n${(tick !== false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''} - owns <@&${restriction['v']}>.`;// ${(tick != false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''}.`;
        else if (restriction['t'] == 'MESSAGE')  result += `\n${(tick !== false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''} - ${restriction['v']} messages in this server.`;//${(tick != false) ? ((tick[i]) ? ' ✅' : ' ❌') : ''}.`;
        else if (restriction['t'] == 'UNOWNED')  result += `\n${(tick !== false) ? '❔' : ''} - must not own the listed item/s!`;//${(tick != false) ? ' ❔' : ''}`;//? ((tick[i]) ? ' ✅' : ' ❌') : ''}`;
        else if (restriction['t'] == 'UNKNOWN')  result += `\n- unknown restriction: ${restriction['v']}`;
        else                                     result += `\n- unknown restriction: ${restriction['t']} ${restriction['v']}`;
        //else                                     result += `\n- ${restriction['t']}`


    }

    return result;
}

/**
 * @param {number} plat 
 * @param {boolean} friendlyText
 */
 function donatorRankFromPlat(plat, friendlyText=false) {
    if (plat < 250)    return (friendlyText) ? "having no rank"        : "NO_RANK";
    if (plat < 1000)   return (friendlyText) ? "Donator"               : "DONATOR";
    if (plat < 2500)   return (friendlyText) ? "Honoured Donator"      : "HONOURED";
    if (plat < 5000)   return (friendlyText) ? "Distinguished Donator" : "DISTINGUISHED";
    if (plat < 10000)  return (friendlyText) ? "Exalted Donator"       : "EXALTED";
    if (plat >= 10000) return (friendlyText) ? "Illustrious Donator"   : "ILLUSTRIOUS";
}

/**
 * @param {'NO_RANK'|'DONATOR'|'HONOURED'|'DISTINGUISHED'|'EXALTED'|'ILLUSTRIOUS'} status 
 */
function platFromRank(status) {
    if (status == 'NO_RANK')       return 0;
    if (status == 'DONATOR')       return 250;
    if (status == 'HONOURED')      return 1000;
    if (status == 'DISTINGUISHED') return 2500;
    if (status == 'EXALTED')       return 5000;
    if (status == 'ILLUSTRIOUS')   return 10000; // idk
    else                           return 0;
}

/**
 * 
 * @param {'NO_RANK'|'DONATOR'|'HONOURED'|'DISTINGUISHED'|'EXALTED'|'ILLUSTRIOUS'} rank 
 */
function convertRankToPing(rank) {
    if (rank == 'NO_RANK')       return 'having no rank'
    if (rank == 'DONATOR')       return '<@&487781487538601985>'
    if (rank == 'HONOURED')      return '<@&487781457377624075>'
    if (rank == 'DISTINGUISHED') return '<@&487781416407662593>'
    if (rank == 'EXALTED')       return '<@&487781296861478932>'
    if (rank == 'ILLUSTRIOUS')   return '<@&614941848926158865>'
}