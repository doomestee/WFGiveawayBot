const { giveaway, logger, infraction } = require("../..");
const { regex, id } = require("../../utilities");
const Giveaway = require("../../structures/Giveaway");
const Infraction = require("../../structures/Infraction");
const ms = require("ms");

module.exports = {
    aliases: ['Requalify'],
    load_for: ['infraction'],
    ignore: false,
    /**
     * @param {import("../../structures/Interaction")} interaction 
     * @param {import("eris").Client} client
     * @param {import("mongodb").MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        if (!interaction.member.roles.includes(id.role.giveaway[interaction.guild.id]) && !interaction.member.permissions.has('manageMessages')) return interaction.sendInitial(client.requestHandler, `Your attempt has been logged.`, {ephemeral: true});

        //const [user, duration, reason] = ['user', 'duration', 'reason'].map(a => (interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : (interaction.data.resolved) ? Object.keys(Object.keys(interaction.data.resolved)[0])[0] : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        const user = interaction.fetchOption('user', true) ? interaction.fetchOption('user', true).value : (interaction.data.resolved) ? Object.keys(interaction.data.resolved['users'])[0] : null;
        //const [duration, reason] = ['duration', 'reason'].map(a => interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : null);

        if (!user) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a user (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);
        /**
         * @type {string[]}
         */
        let snowflake = user.match(regex.snowflake);

        if (!snowflake) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a user (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        //if (duration && !duration.match(regex.duration)) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid duration, please use a valid duration input." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);
        //if (!duration) duration = '7d';

        // Duration

        //const parsed_duration = (duration) ? duration.match(regex.duration).map(dur => {
        //    return (!dur.endsWith('mo')) ? ms(dur) : ms('30d') + Number(dur.replace(regex.number_only, ''))
        //}).reduce((prev, curr) => prev + curr, 0) : null;

        let list = infraction.list.filter(infr => infr.user.id === user && !infr.action.resolved && infr.action.type === Infraction.action_type.DIQ);

        if (list.length) {//infraction.list.some(a => a.user.id === user && !a.action.resolved && a.action.type === Infraction.action_type.DIQ)) {//return interaction.edit(client.requestHandler, {content: "The user is already disqualified."});
            
            await interaction.defer(client.requestHandler, true);

            for (let i = 0; i < list.length; i++) {
                infraction.emit('disqualify_end', list[i]);
            }

            return interaction.edit(client.requestHandler, {
                content: (list.length === 1) ? "The user is requalified, they can enter the giveaways as they wish." : `The user has ${list.length} records of active disqualification, they are all resolved (should be).`
            })

        } else {
            return interaction.sendInitial(client.requestHandler, {
                content: "The user is not disqualified"
            }, {ephemeral: true});
        }
    }
}