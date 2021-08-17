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

        const [user] = ['user'].map(a => (interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : (interaction.data.resolved && interaction.data.resolved['users']) ? Object.keys(interaction.data.resolved['users'])[0] : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        /*
        let message = (interaction.fetchOption('message', true)) ? interaction.fetchOption('user', true).value : '';
        if (!message && interaction.data.resolved && interaction.data.resolved['users']) user_id = Object.keys(interaction.data.resolved['users'])[0]
        //if (!message) message = interaction.member.user.id;*/

        if (!user) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);
        let snowflake = user.match(regex.snowflake);

        if (!snowflake) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        let userIfAlreadyExist = user_manager.listOfDisabled.findIndex(loser => loser._id === snowflake[0]);
        let userBindingFrom = user_manager.listOfDisabled.filter(loser => loser.bind_id === snowflake[0]);

        if (userIfAlreadyExist === -1) return interaction.sendInitial(client.requestHandler, {
            content: "The user isn't binding with anyone." + ((userBindingFrom.length) ? `\nLooks like the user are bound to ${userBindingFrom.map(loser => '<@' + loser._id + '>').join(', ')}.` : '')//user_manager.listOfDisabled.some(loser => loser.bind_id === snowflake[0]) ? `\nLooks like the user are bound to ${user_manager.listOfDisabled.filter(loser => loser.bind_id === snowflake[0]).map(loser => '<@' + loser._id + '>').join(', ')}.` : ''
        }, {ephemeral: true});

        await interaction.defer(client.requestHandler, true);

        mongodb.db().collection('binding_user').deleteOne({_id: snowflake[0]}).then((result) => {
            user_manager.listOfDisabled.splice(userIfAlreadyExist, 1);

            return interaction.edit(client.requestHandler, {
                content: "Bopp bipp, the user is no longer binding" + ((userBindingFrom.length) ? `.\nHowever, it looks like the user are bound to ${userBindingFrom.map(loser => '<@' + loser._id + '>').join(', ')}.` : ', although they might feel lonely :c')
            });
        }, (err) => {
            logger.error(err);

            return interaction.edit(client.requestHandler, {
                content: "There has been an error trying to remove the user from the database, disentitling them was not successful"
            })
        })


    }
}