const Interaction = require("../../structures/Interaction");
const {Client} = require("eris");
const { cooldowns, logger } = require("../..");
const { MongoClient } = require("mongodb");
const asciiTable = require("ascii-table");
const { getAvatarURL } = require("../../utilities");

module.exports = {
    ignore: false,
    /**
     * @param {Interaction} interaction 
     * @param {Client} client
     * @param {MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        const cooldown = cooldowns.checkCooldown(interaction.member.user.id, "I_PLAT_LB");
        if (!cooldown[0]) {
            return interaction.sendInitial(client.requestHandler, {content: `Woah woah woah w0ah w0ah w0ah w0ah, youre using the command too fast, absurdly fast, ridiculously fast.\nanyways you gotta wait for ${Math.floor(cooldown[1] / 1000)}s`}, {ephemeral: true});
        }
        await interaction.defer(client.requestHandler, true);
        cooldowns.updateCooldown(interaction.member.user.id, "I_PLAT_LB", 5000, Date.now(), true);

        let offset = (interaction.fetchOption('offset', true)) ? interaction.fetchOption('offset', true).value : 0;

        mongodb.db().collection('User').find().skip(offset*10).limit(10).toArray().then(
            /**
             * @param {Object[]} res
             * @param {import("mongodb").ObjectID} res._id
             * @param {string} res.name
             * @param {number} res.plat
             */
            (res) => {
                
                let table = new asciiTable()
                .setHeading("Pos", "Username", "Platinum").setAlign(0).setBorder("║", "═", "╦", "╩");
            
                for (let i = 0; i < 10; i++) {
                    if (res[i] !== undefined) {
                        let name = res[i]['name'];

                        if (Number.isInteger(parseInt(name.split('#').pop()))) {
                            if (name.split('#').pop().length === 4) name = name.slice(0, -5)
                        }

                        table.addRow(`${i+1+(offset*10)}`, name, res[i]['plat']);
                    }
                }

                interaction.edit(client.requestHandler, {
                    embeds: [{
                        title: `Leaderboard`,
                        description: `\`\`\`\n${table.toString()}\`\`\``,
                        footer: {
                            text: `This took ${Date.now() - interaction.createdAt}ms from the time the interaction is received to sending this response.`
                        }, author: {
                            name: (interaction.member.nick) ? interaction.member.nick : interaction.member.user,
                            icon_url: getAvatarURL([interaction.member.avatar, interaction.member.user.avatar], interaction.member.user.discriminator, interaction.member.user.id)
                        }
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            style: 2,
                            label: "<----",
                            custom_id: "back_page_a"  + ((offset == 0) ? '' : `_${offset-1}`),
                            disabled: true//(offset == 0)
                        }, {
                            type: 2,
                            style: 2,
                            label: "---->",
                            custom_id: "front_page_a"  + ((offset == 0) ? '_1' : `_${offset+1}`),
                            disabled: true//(offset != 0) ? (offset >= Math.floor((returnUsersCount() / 10))) : false
                        }]
                    }]
                })
        }, (err) => {
            interaction.edit(client.requestHandler, {content: "oOpsie, there has been an error!"});
            logger.error(err);
        })
    }
}