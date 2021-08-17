//const chalk = require("chalk");

const { id } = require("../../utilities");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {client, logger, mongo, giveaway: ga_manager, user: user_manager, infraction} = stuff;

    client.on('ready', () => {
        logger.info("Bot is up and ready to go" + ((mongo.isConnected()) ? '!' : ', mongo instance is being powered up at the moment...'));

        if (!mongo.isConnected()) {
            mongo.connect(async (err, cli) => {
                if (err) return logger.error(err);
                logger.info("Mongo instance is connected!");

                await user_manager.initialise(cli).then((a) => {
                    logger.info("User manager initialised!");
                    //console.log(a);
                }, logger.error);

                ga_manager.initialise(cli).then(() => {
                    logger.info("Giveaway manager initialised!");

                    //ga_manager.getGiveaway({_id: new ObjectID('6117d6e65442974a6887cc08')}).then((ga) => {
                    //    console.log(ga[0].participants);
                    //});
                    //logger.info(ga_manager.list.filter(a => a.status === 4)[0].participants, undefined, false, true);
                    //if (!ga_manager.list.length) return;

                    // Apparently using raw for loop is very decent compared to using <array>.forEach or for of loop. 
                    //for (let i = 0; i < ga_manager.list.length; i++) {
                    //    let giveaway = ga_manager.list[i];
                    //}
                    
                }, logger.error);

                infraction.initialise(cli).then(() => {
                    logger.info("Infraction manager initialised!");
                }, logger.error);
                
                /*mongo.db().createCollection('binding_user').then((res) => {
                    console.log("Made!");
                    res.insertOne({_id: '339050872736579589', bind_id: '287709987860381696', reason: "Lost his account due to something he wish he'd have known."})
                    .then(() => console.log("Written!"));
                }).catch(console.log);*/
            })
        }

        // You must return if the server (id.guild.main (although you can feel free to change it))
        // is already set up with the code below:
        return;

        //client.createMessage('847209977201557525', "This bot will stop after the next scrape unless manually configured to continue.")

        /*

        This will add text-based command/s:
        - Disqualify add
            - One of two ways to disqualify
            => Disqualifies a user, unlike the other way, this one will offer the staff

        - Disqualify end

        - Bind add

        - Bind remove

        */

        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "disqualify",
            description: "Stuff...",
            options: [{
                    name: 'add',
                    description: 'Disqualifies a user with such enthusiasm!',
                    type: 1, // Sub-commies
                    options: [{
                        name: 'user',
                        description: "The user to check.",
                        type: 6,
                        required: true
                    }, {
                        name: 'duration',
                        description: "(DEFAULT: 1 week) How long should the disqualification last for?",
                        type: 3 
                    }, {
                        name: 'reason',
                        description: "Reason for the disqualification?",
                        type: 3
                    }]
                },
                {
                    name: 'end',
                    description: 'Allows a user to join giveaways.',
                    options: [{
                        name: 'user',
                        description: "Who is the unlucky fellow?",
                        type: 6,
                        required: true
                    }],
                    type: 1 // Sub-commies
                }
            ], type: 1 // Slash command
        });

        
        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "bind",
            description: "Stuff...",
            options: [{
                    name: 'add',
                    description: 'Binds a user to another user!',
                    type: 1, // Sub-commies
                    options: [{
                        name: 'user',
                        description: "The primary user to bind (TO).",
                        type: 6,
                        required: true
                    }, {
                        name: 'binding_user',
                        description: "The secondary user to bind (FROM), note that an ID can be passed instead of @",
                        type: 6,
                        required: true
                    }, {
                        name: 'reason',
                        description: "Reason for the binding?",
                        type: 3
                    }]
                },
                {
                    name: 'remove',
                    description: 'Unbinds a user.',
                    options: [{
                        name: 'user',
                        description: "The primary user to unbind.",
                        type: 6,
                        required: true
                    }],
                    type: 1 // Sub-commies
                }
            ], type: 1 // Slash command
        });

        /*

        This will add user command/s:
        - Donated Plat Count
            => basically the same as platinum fetch
        - Disqualify
            => disqualifies a user for 1 week
        - Requalify
            => requalifies a user (it will resolve ALL of the disqualifications on that user);

        */

        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "Fetch Donated Plat Count",
            type: 2
        });
        
        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "Disqualify for 1 Week",
            type: 2
        });

        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "Requalify",
            type: 2
        });

        /*
        
        This will add message command/s:
        - End Giveaway
            => Ends giveaway with one tap
        - Reroll Giveaway
            => Rerolls giveaway with one tap

        */
       

        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "End Giveaway",
            type: 3
        });
        
        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "Reroll Giveaway",
            type: 3
        });

        //return;

        /*

        This will add text-based command/s:
        - Giveaway create
            - Two ways to create
            => fast (you use one parameter to dump all of the args in it)
            => safe (you can see what parameters are there and make use of them)
        - Giveaway end
            - One of two ways to end a giveaway
            => you will have to put the ID of the message the giveaway is on, to end it.

        */
        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "giveaway",
            description: "Stuff...",
            options: [
                {
                    name: 'create',
                    description: 'Creates a new giveaway!',
                    type: 2, // Sub-commies group
                    options: [{
                        name: 'fast',
                        description: "Use if you cba tabbing to the next parameter!",
                        options: [{
                            name: "arg",
                            description: "use flags pls (smth like: --title=amogus --duration=10s) for eg",
                            choices: [],
                            required: true,
                            type: 3
                        }],
                        type: 1 // Sub-commies
                    }, {
                        name: 'safe',
                        description: "Use if you want to make use of parameters...?",
                        options: [{
                            name: "prize",
                            description: "The prize of the giveaway", required: true,
                            choices: [],
                            type: 3
                        }, {
                            name: "duration",
                            description: "How long should this giveaway last for? (for eg: 72h, 3d, 10s, 69m)",
                            type: 3,
                            choices: [],
                            required: true
                        }, {
                            name: "winners",
                            description: "(Default: 1) How many winners (number from 1 to 50) (anything else provided will be 1)",
                            type: 4,
                            choices: [],
                            required: false
                        }, {
                            name: "contact",
                            description: "(Default: YOU!) Who should the winner/s contact after winning?",
                            type: 6,
                            choices: [],
                            required: false
                        }, {
                            name: "restrictions",
                            description: "Use '---' to separate each restriction! (for eg: Unowned---200 Platinum)",
                            type: 3,
                            choices: [],
                            required: false
                        }],
                        type: 1 // Sub-commies
                    }]
                },
                {
                    name: 'end',
                    description: 'Ends a giveaway!',
                    options: [{
                        name: "message",
                        description: "The ID of the message",
                        required: true,
                        choices: [],
                        type: 3
                    }],
                    type: 1 // Sub-commies
                },
                {
                    name: 'reroll',
                    description: 'Rerolls a giveaway!',
                    options: [{
                        name: "message",
                        description: "The ID of the message",
                        required: true,
                        choices: [],
                        type: 3
                    }],
                    type: 1 // Sub-commies
                }
            ]
            //}], type: 1 // Slash command
        });

        //return;

        /*

        This will add text-based command/s:
        - Platinum count
            - Shows how many platinum the individual has donated
        - Platinum leaderboard
            - Lists x amount of donators.
            => TODO: add parameter for index, only when indexes are supported.
        - Platinum cache
            - Can flushes the cache
            => Replacing with new information from the spreadsheet.
        */

        client.requestHandler.request('POST', `/applications/${client.user.id}/guilds/${id.guild.main}/commands`, true, {
            name: "platinum",
            description: "Stuff...",
            options: [{
                    name: 'count',
                    description: 'Checks how many platinum you have/the person has donated!',
                    type: 1, // Sub-commies
                    options: [{
                        name: 'user',
                        description: "The user to check.",
                        type: 6
                    }]
                },
                {
                    name: 'leaderboard',
                    description: 'Lists top 10 players that have donated! (TODO: indexes)',
                    options: [{
                        name: 'index',
                        description: "At which position (multipled by ten) would you want to start at?",
                        type: 4,
                    }],
                    type: 1 // Sub-commies
                },
                {
                    name: 'cache',
                    description: 'Platinum cache stuff boop boop',
                    type: 2, // Sub-commies group
                    options: [{
                        name: 'flush',
                        description: "Updates the cache from the spreadsheet.",
                        choices: [],
                        type: 1 // Sub-commies
                    }
                ]
            }], type: 1 // Slash command
        });
    });
}