const { giveaway, logger, infraction } = require("../..");
const { regex, id } = require("../../utilities");
const Giveaway = require("../../structures/Giveaway");
const Infraction = require("../../structures/Infraction");
const ms = require("ms");

module.exports = {
    aliases: ['Disqualify for 1 Week'],
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
        let [duration, reason] = ['duration', 'reason'].map(a => interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : null);

        if (!user) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a user (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);
        /**
         * @type {string[]}
         */
        let snowflake = user.match(regex.snowflake);

        if (!snowflake) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid user ID, please right click on a user (with dev mode on) and copy its ID." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        if (duration && !duration.match(regex.duration)) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid duration, please use a valid duration input." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);
        if (!duration) duration = '7d';

        await interaction.defer(client.requestHandler, true);

        // Duration

        const parsed_duration = (duration) ? duration.match(regex.duration).map(dur => {
            return (!dur.endsWith('mo')) ? ms(dur) : ms('30d') + Number(dur.replace(regex.number_only, ''))
        }).reduce((prev, curr) => prev + curr, 0) : null;

        if (infraction.list.some(a => a.user.id === user && !a.action.resolved && a.action.type === Infraction.action_type.DIQ)) return interaction.edit(client.requestHandler, {content: "The user is already disqualified."});

        infraction.create({
            action: {
                type: Infraction.action_type.DIQ,
                start: Date.now(),
                duration: parsed_duration
            }, guild: {
                id: interaction.guild.id
            }, moderator: {
                id: interaction.member.user.id
            }, user: {
                id: user,
                name: (interaction.data.resolved && interaction.data.resolved['users']) ? interaction.data.resolved['users'][user]['username'] : null
            }, reason: reason || null
        }).then((infr) => {
            //let infr = infraction.list.filter(item => item.user.id === ).sort((infr1, infr2) => infr2.action.duration - infr1.action.duration);

            interaction.edit(client.requestHandler, {content: `The user <@${user}> is now disqualified ${infr.action.duration != null ? `until <t:${Math.floor(new Date(infr.action.duration + infr.action.start).getTime()/1000)}:F>` : 'indefinitely!'}`});
            if (id.log.disqualify[interaction.guild.id]) {
                client.createMessage(id.log.disqualify[interaction.guild.id], {
                    content: `<@${user}> has been disqualified by ${((interaction.member.nick) ? interaction.member.nick : interaction.member.user.username) + '#' + interaction.member.user.discriminator} ${infr.action.duration != null ? `for ${ms(infr.action.duration)}` : 'for a very very long time as the duration was not passed.'}\n${(reason) ? "Reason: `" + reason + "`" : 'No reason was provided.'}`
                }).catch((err) => logger.error(err));
            }

            //interaction.sendInitial(client.requestHandler, {content: "You provided invalid duration, please use a valid duration input." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);  
        })
    }
}