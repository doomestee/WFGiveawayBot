//const chalk = require("chalk");

const { id } = require("../../utilities");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {logger, infraction} = stuff;

    infraction.on('disqualify_add', 
    /**
     * @param {import("../../structures/Infraction")} infr
     */
    (infr, skipCheck=false) => {
        // obv cos there should be only one shard since this bot is intended to be only for WFG
        //if (!client.shards.size || client.shards.random().status !== 'ready') return;

        if (infr.action.resolved && !skipCheck) return;
        return;

        //infr.action.resolved = true;

        infraction.update(infr._id, {$set: {'action.resolved': true}}).catch(logger.error);

        /*client.getRESTGuildMember(infraction.guild.id, infraction.user.id).then((member) => {
            let roles = member.roles;

            if (roles.some(role => role === ))

        })*/
        //client.editGuildMember(infraction.guild.id, infraction.user.id, {roles: })
        //client.guilds.get(infraction.guild.id).editMember()

    })
}