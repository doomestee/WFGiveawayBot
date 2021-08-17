const { user: user_manager, logger } = require("../..");
const { regex, id } = require("../../utilities");
const Giveaway = require("../../structures/Giveaway");

module.exports = {
    load_for: ['user'],
    ignore: false,
    /**
     * @param {import("../../structures/Interaction")} interaction 
     * @param {import("eris").Client} client
     * @param {import("mongodb").MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        if (!interaction.member.roles.includes(id.role.giveaway[interaction.guild.id]) && !interaction.member.permissions.has('manageGuild')) return interaction.sendInitial(client.requestHandler, `Your attempt has been logged.`, {ephemeral: true});

        const [user, binding_user, reason] = ['user', 'binding_user'].map(a => interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : null);//(interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : (interaction.data.resolved) ? Object.keys(interaction.data.resolved['users'])[0] : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        //const user = (interaction.fetchOption('user', true)) ? interaction.fetchOption('user', true).value : '';
        //if (!message && interaction.data.resolved && interaction.data.resolved['users']) user_id = Object.keys(interaction.data.resolved['users'])[0]
        //if (!message) message = interaction.member.user.id;*/

        if (!user || !binding_user) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user (or the binding_user) ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch((err) => logger.error(err));
        let snowflake = user.match(regex.snowflake);

        if (!snowflake || !binding_user.match(regex.snowflake)) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user (or the binding_user) ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch((err) => logger.error(err));//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        let userIfAlreadyExist = user_manager.listOfDisabled.find(loser => loser._id === snowflake[0]);

        if (userIfAlreadyExist) {
            return interaction.sendInitial(client.requestHandler, {
                content: `The user you're trying to bind is already bound to someone else, the user is bound *by love* to <@${userIfAlreadyExist.bind_id}>.\n${(userIfAlreadyExist.reason) ? "Reason for their binding: " + userIfAlreadyExist.reason : 'The reason for their binding was not provided.'}\nNOTE: you can bind the other way.`
            }, {ephemeral: true})
        }

        await interaction.defer(client.requestHandler, true);

        // i cba adding on UserManager to create function and stuff for simplifying

        //if (user_manager.listOfDisabled.some(loser => loser._id === user)) return interaction.sendInitial(client.requestHandler, {content: "The user is already bound to "})

        mongodb.db().collection('binding_user').insertOne({
            _id: snowflake[0],
            bind_id: binding_user,
            reason: reason || null
        }).then((result) => {
            // Impossible if this actually returns true
            if (user_manager.listOfDisabled.some(a => a._id === result.insertedId)) {
                return interaction.edit(client.requestHandler, {content: `Somehow the user was already bound so F, idk how this is possible to reach though.`});
            } else {
                user_manager.listOfDisabled.push({
                    _id: snowflake[0],
                    bind_id: binding_user,
                    reason: reason || null
                });

                return interaction.edit(client.requestHandler, {
                    content: `The user is now successfully bound, this was done with love arranged by you, a nice matchmaker! OwO`
                })
            }
        }, (err) => {
            logger.error(err);
            return interaction.edit(client.requestHandler, {
                content: `Ow, there was an error trying to add the entry to the database. It's most likely that the user has been bound already but the list doesn't have them for some reason.`
            })
        })
    }
}