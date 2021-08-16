const Interaction = require("../../structures/Interaction");
const {Client} = require("eris");
const { cooldowns } = require("../..");
const { MongoClient } = require("mongodb");

module.exports = {
    ignore: true,
    /**
     * @param {Interaction} interaction 
     * @param {Client} client
     * @param {MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        console.log(interaction.fetchOption('flush'));
        interaction.sendInitial(client.requestHandler, {content: 'sus'}, {ephemeral: true});

        return;
        const cooldown = cooldowns.checkCooldown(interaction.member.user.id, "I_PLATCOUNT");
        if (!cooldown[0]) {
            return interaction.sendInitial(client.requestHandler, {content: `Woah woah woah w0ah w0ah w0ah w0ah, youre using the command too fast, absurdly fast, ridiculously fast.\nanyways you gotta wait for ${Math.floor(cooldown[1] / 1000)}s`}, {ephemeral: true});
        }
        await interaction.defer(client.requestHandler, true);
        cooldowns.updateCooldown(interaction.member.user.id, "I_PLATCOUNT", 3000, Date.now(), true);

        let result = await fetchPlatinum(mongodb, (interaction.fetchOption('user', true)) ? interaction.fetchOption('user', true).value : interaction.member.user.id);

        await interaction.edit(client.requestHandler, {
            content: `This person has ${result.plat} platinum, which would qualify them as ${(interaction.guild.id == id.guild.wfg) ? convertRankToPing(donatorRankFromPlat(result.plat)) : donatorRankFromPlat(result.plat, true)}.`
        });
    }
}