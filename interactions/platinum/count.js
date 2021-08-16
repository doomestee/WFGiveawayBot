const Interaction = require("../../structures/Interaction");
const {Client} = require("eris");
const { cooldowns, user } = require("../..");
const { MongoClient } = require("mongodb");
const { fetchPlatinum } = require("../../utilities/mongodb");
const { convertRankToPing, donatorRankFromPlat, id } = require("../../utilities");

module.exports = {
    aliases: ['Fetch Donated Plat Count'],
    load_for: ['user'],
    ignore: false,
    /**
     * @param {Interaction} interaction 
     * @param {Client} client
     * @param {MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        const cooldown = cooldowns.checkCooldown(interaction.member.user.id, "I_PLATCOUNT");
        if (!cooldown[0]) {
            return interaction.sendInitial(client.requestHandler, {content: `Woah woah woah w0ah w0ah w0ah w0ah, youre using the command too fast, absurdly fast, ridiculously fast.\nanyways you gotta wait for ${Math.floor(cooldown[1] / 1000)}s`}, {ephemeral: true});
        }
        await interaction.defer(client.requestHandler, true);

        let user_id = (interaction.fetchOption('user', true)) ? interaction.fetchOption('user', true).value : '';
        if (!user_id && interaction.data.resolved && interaction.data.resolved['users']) user_id = Object.keys(interaction.data.resolved['users'])[0]
        if (!user_id) user_id = interaction.member.user.id;

        cooldowns.updateCooldown(interaction.member.user.id, "I_PLATCOUNT", 3000, Date.now(), true);

        const result = user.fetch({
            _id: user_id//interaction.fetchOption('user', true) ?  //(interaction.fetchOption('user', true)) || (interaction.data.resolved) ? Object.keys(interaction.data.resolved['users'])[0] : interaction.member.user.id
        });//await fetchPlatinum(mongodb, (interaction.fetchOption('user', true)) ? interaction.fetchOption('user', true).value : interaction.member.user.id);
        //console.log(result);
        const loser = (result !== null && result.length) ? result[0] : {plat: 0} 

        await interaction.edit(client.requestHandler, {
            content: `This person has ${loser.plat} platinum, which would qualify them as ${(interaction.guild.id == id.guild.wfg) ? convertRankToPing(donatorRankFromPlat(loser.plat)) : donatorRankFromPlat(loser.plat, true)}.`
        });
    }
}