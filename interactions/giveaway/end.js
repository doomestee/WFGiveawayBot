const { giveaway, logger } = require("../..");
const { regex, id } = require("../../utilities");
const Giveaway = require("../../structures/Giveaway");

module.exports = {
    aliases: ['End Giveaway'],
    load_for: ['giveaway', 'disqualify', 'user'],
    ignore: false,
    /**
     * @param {import("../../structures/Interaction")} interaction 
     * @param {import("eris").Client} client
     * @param {import("mongodb").MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        if (!interaction.member.roles.includes(id.role.giveaway[interaction.guild.id]) && !interaction.member.permissions.has('manageGuild')) return interaction.sendInitial(client.requestHandler, `Your attempt has been logged.`, {ephemeral: true});

        const [message] = ['message'].map(a => (interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : (interaction.data.resolved) ? Object.keys(interaction.data.resolved['messages'])[0] : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        /*
        let message = (interaction.fetchOption('message', true)) ? interaction.fetchOption('user', true).value : '';
        if (!message && interaction.data.resolved && interaction.data.resolved['users']) user_id = Object.keys(interaction.data.resolved['users'])[0]
        //if (!message) message = interaction.member.user.id;*/

        if (!message) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid message ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);
        let snowflake = message.match(regex.snowflake);

        if (!snowflake) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid message ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        await interaction.defer(client.requestHandler, true);

        let ga = await giveaway.getGiveaway({message_id: message});

        if (ga === null || ga.length < 1) return interaction.sendInitial(client.requestHandler, {content: `The message is not recognised in the database.`});
        
        if (ga[0].status < Giveaway.status.ENDED_WAITS && ga[0].status > Giveaway.status.SCHEDULED) {
            giveaway.emit('giveaway_ended', ga[0], true);
            return interaction.edit(client.requestHandler, {content: "The giveaway will now end as quickly as possible! ^.^"});
        } else return interaction.edit(client.requestHandler, {content: "The giveaway couldn't end :("});
    }
}