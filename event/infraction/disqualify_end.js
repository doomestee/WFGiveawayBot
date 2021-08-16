//const chalk = require("chalk");

const Infraction = require("../../structures/Infraction");
const { id } = require("../../utilities");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {logger, infraction} = stuff;

    /**
     * 
     * TODO: add support for bulk disqualification, queuing and same for disqualify_add.js which is hardly used.
     * 
     */
    infraction.on('disqualify_end', 
    /**
     * @param {import("../../structures/Infraction")} infr
     */
    (infr, skipCheck=false) => {
        // obv cos there should be only one shard since this bot is intended to be only for WFG
        //if (!client.shards.size || client.shards.random().status !== 'ready') return;

        if (infr.action.resolved && !skipCheck) return;
        if (infr.action.type !== Infraction.action_type.DIQ && !skipCheck) return;

        infr.action.resolved = true;

        infraction.update(infr._id, {$set: {'action.resolved': true}}).then((infro) => {
            //infraction._timer1(true);
        }).catch(logger.error);

        /*client.getRESTGuildMember(infraction.guild.id, infraction.user.id).then((member) => {
            let roles = member.roles;

            if (roles.some(role => role === ))

        })*/
        //client.editGuildMember(infraction.guild.id, infraction.user.id, {roles: })
        //client.guilds.get(infraction.guild.id).editMember()

    })
}