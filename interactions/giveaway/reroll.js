const { giveaway, logger } = require("../..");
const { regex, id } = require("../../utilities");
const Giveaway = require("../../structures/Giveaway");

module.exports = {
    aliases: ['Reroll Giveaway'],
    load_for: ['giveaway'],
    ignore: false,
    /**
     * @param {import("../../structures/Interaction")} interaction 
     * @param {import("eris").Client} client
     * @param {import("mongodb").MongoClient} mongodb
     */
    run: async (interaction, client, mongodb, first=false) => {
        if (!interaction.member.roles.includes(id.role.giveaway[interaction.guild.id]) && !interaction.member.permissions.has('manageGuild')) return interaction.sendInitial(client.requestHandler, `Your attempt has been logged.`, {ephemeral: true});

        const [message] = ['message'].map(a => (interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : (interaction.data.resolved) ? Object.keys(interaction.data.resolved['messages'])[0] : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        if (!message) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid message ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);
        let snowflake = message.match(regex.snowflake);

        if (!snowflake) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid message ID, please right click on a message (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        await interaction.defer(client.requestHandler, true);

        let ga = await giveaway.getGiveaway({message_id: message});

        if (ga === null || ga.length < 1) return interaction.edit(client.requestHandler, `The message is not recognised in the database.`);
        
        client.getMessage(ga[0].message.channel_id, ga[0].message.id).then((msg) => {    
            if (ga[0].status === Giveaway.status.ENDED_WINS && (ga[0].participants) ? ga[0].participants.some(a => !a.won) : false) {
                giveaway.emit('giveaway_reroll', ga[0]);
                return interaction.edit(client.requestHandler, {content: "Rerolling! ^.^"});
            } else return interaction.edit(client.requestHandler, {content: "The giveaway couldn't be rerolled :(" + (ga[0].participants) ? `There are ${ga[0].participants.length} participants, all of which already won the prize.` : ''});      
        }, (err) => {
            // TODO: log error to separate the missing messages from anything else
            return interaction.edit(client.requestHandler, {content: "The message is missing, obstructed or has been ***OBLITERATED INTO PIECES***."});
        })
    }
}