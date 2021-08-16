const chalk = require("chalk");
const Interaction = require("../../structures/Interaction");

/**
 * @param {import("../../index")} stuff
 */
module.exports = (stuff) => {
    const {client, logger, mongo, giveaway, infraction, user} = stuff;

    client.on('unknown', (raw, id) => { /* Why do i need the id? */
        if (raw.t !== 'INTERACTION_CREATE' || raw.d.type === 1) return;
        const interaction = new Interaction(raw.d);

        if (!interaction.guild) return interaction.sendInitial(client.requestHandler, {content: "no dms pls"}, {ephemeral: true})
            .catch(() => {}); // dabs on any error.

        /**
         * This function is meant to be used on <int>.run();
         * @param {{load_for: ('giveaway'|'infraction'|'user')[]}} ant
         */
        function runIt(ant, first=true) {
            if (!ant.load_for) return ant.run(interaction, client, mongo);
            else { 
                let pass = ant.load_for.filter(load => {
                    switch (load) {
                        case "giveaway": return !giveaway.initialised;
                        case "infraction": return !infraction.initialised;
                        case "user": return !user.initalised;
                        default: return false;
                    }
                });

                if (!pass.length) return ant.run(interaction, client, mongo);
                if (first) interaction.sendInitial(client.requestHandler, {content: `Woop, the bot is currently loading up (${pass.map(a => '`' + a + '`').join(', ')} manager/s), this command will be executed once they're done!`}, {ephemeral: true});

                setTimeout(() => {
                    //console.log(pass);
                    runIt(ant, false); 
                }, 1000);
            }
        }

        //let mongo = undefined;
        switch (interaction.type) {
            case 2:
                //console.log(interaction.spitOptions());

                let int = client.interactions[interaction.data.name];

                // If aliases for the interaction data name exists:
                if (!int && client.interactions.aliases[interaction.data.name]) {
                    let alias = client.interactions.aliases[interaction.data.name];

                    if (alias[2]) return runIt(client.interactions[alias[0]][alias[1]][alias[2]]);//.run(interaction, client, mongo);
                    if (alias[1]) return runIt(client.interactions[alias[0]][alias[1]]);//.run(interaction, client, mongo);
                    else return runIt(client.interactions[alias[0]])//.run(interaction, client, mongo);
                }

                if (!int) // If the command does not exist in the collection.
                    return interaction.sendInitial(client.requestHandler, {content: 'The command is either not supported or does not exist, please yeet my life.'}, {ephemeral: true});
                if (int.run) // If the command does not have a subcommand and so can be run itself.
                    return runIt(int);//.run);(interaction, client, mongo);
                else {
                    let a = interaction.data.options.find(a => a.type === 1); // Type 1 is a subcommand.
                    if (a) { // If there is at least one that is a subcommand, then it has been found!
                        if (int[a.name]) return runIt(int[a.name]);//.run(interaction, client, mongo);
                        else return interaction.sendInitial(client.requestHandler, {content: 'The command is either not supported or does not exist, please yeet my life.'}, {ephemeral: true});
                    } else {
                        // Nope? Sub-command group for sure then!

                        a = interaction.data.options.find(a => a.type === 2);

                        // Poggers the sub command group does exist!
                        if (a) {
                            // Checks if the sub command group exists in the client.interactions, it will then also check if the sub command does exist
                            if (int[a.name] && int[a.name][a.options.find(b => b.type === 1).name]) runIt(int[a.name][a.options.find(b => b.type === 1).name]);//.run(interaction, client, mongo);
                            else return interaction.sendInitial(client.requestHandler, {content: 'The command is either not supported or does not exist, please yeet my life.'}, {ephemeral: true});
                        } else return interaction.sendInitial(client.requestHandler, {content: 'The command is either not supported or does not exist, please yeet my life.'}, {ephemeral: true});
                    }
                    //if (int[])
                }
                return;
            case 3:
                let into = interaction.data.custom_id.split('_'),
                ints = client.components[(into[0])];

                if (!into[1] || !ints || !ints[into[1]]) {
                    return interaction.sendInitial(client.requestHandler, {content: "The component is either not supported or doesn't seem to exist."}, {ephemeral: true});
                } else {
                    return ints[into[1]](interaction, client, mongo);
                }

                return;
            default:
                return interaction.sendInitial(client.requestHandler, {content: "Unsupported interaction type."}, {ephemeral: true}).catch(() => {});
        }

        //console.log(interaction.);

        //interaction

    });
}