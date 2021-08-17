const { user, giveaway, logger } = require("../..");
const { convertRankToPing, donatorRankFromPlat, id, regex, embed } = require("../../utilities");
const ms = require("ms");
const Giveaway = require("../../structures/Giveaway");

module.exports = {
    ignore: false,
    load_for: ["giveaway", "user", "infraction"],
    /**
     * @param {import("../../structures/Interaction")} interaction 
     * @param {import("eris").Client} client
     * @param {import("mongodb").MongoClient} mongodb
     */
    run: async (interaction, client, mongodb) => {
        if (!interaction.member.roles.includes(id.role.giveaway[interaction.guild.id]) && !interaction.member.permissions.has('manageGuild')) return interaction.sendInitial(client.requestHandler, {content: `Your attempt has been logged.`}, {ephemeral: true});

        // Indeed, there will be no cooldown for creating a giveaway.

        //const cooldown = cooldowns.checkCooldown(interaction.member.user.id, "I_GSTART");
        //if (!cooldown[0]) {
        //    return interaction.sendInitial(client.requestHandler, {content: `Woah woah woah w0ah w0ah w0ah w0ah, youre using the command too fast, absurdly fast, ridiculously fast.\nanyways you gotta wait for ${Math.floor(cooldown[1] / 1000)}s`}, {ephemeral: true});
        //}
        //cooldowns.updateCooldown(interaction.member.user.id, "I_PLATCOUNT", 3000, Date.now(), true);

        const [prize, duration, winners, contact, restrictions] = ['prize', 'duration', 'winners', 'contact', 'restrictions'].map(a => (interaction.fetchOption(a, true) ? interaction.fetchOption(a, true).value : null));//[interaction.fetchOption('prize', true), interaction.fetchOption]

        if (!duration.match(regex.duration)) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid duration, please use a valid duration input." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        // Duration

        const parsed_duration = duration.match(regex.duration).map(dur => {
            return (!dur.endsWith('mo')) ? ms(dur) : ms('30d') + Number(dur.replace(regex.number_only, ''))
        }).reduce((prev, curr) => prev + curr, 0);

        if (parsed_duration <= 0) return interaction.sendInitial(client.requestHandler, {content: "You provided invalid duration, please use a valid duration input." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);
        if (parsed_duration < 10000) return interaction.sendInitial(client.requestHandler, {content: "The duration is too short, please use more than 10s (itself counts)." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);
        if (parsed_duration > ms('60d')) return interaction.sendInitial(client.requestHandler, {content: "The duration is too long, please use less than 60 days (itself counts)." + "\n\n```" + interaction.spitOptions() + "```"}, {ephemeral: true}).catch(logger.error);//+ "\n\n```/giveaway create safe " + interaction.fetchOption('safe', true).options.map(a => `${a.name}:${a.value}`).join(' ') +"```"}, {ephemeral: true}).catch(logger.error);

        // Restrictions (TODO: debate on what to use to split the restrictions for it in slash command usage)
        /**
         * @type {{t: string, v: number|string}[]} An array of restrictions, if there is none then it would still be an array.
         */
        const parsed_restrictions = (restrictions) ? restrictions.split('---') : [];
        
        // Important to have a separate variable for length here so the potential infinite looping of for loop is mitigated.
        const length = parsed_restrictions.length;

        for (let i = 0; i < length; i++) {

            // NOTE THIS IS IMMUTABLE, to edit the result in the array, it will have to be referenced directly.
            const res = parsed_restrictions[i];

            // If it is platinum
            let val = res.match(regex.restrictions.platinum);

            if (val) { parsed_restrictions[i] = {
                t: 'PLATINUM',
                v: Number(val[0].replace(regex.number_only, ''))
            };  continue; }

            // If it is unowned
            if (res.toLowerCase().includes('unowned')) { parsed_restrictions[i] = {
                t: 'UNOWNED',
                v: res
            }; continue; }
            
            // If it is role/s
            val = res.match(regex.restrictions.role_mentions);

            if (val) {
                val = val.map(id => id.replace(regex.number_only, ''));

                let guild = client.guilds.find(interaction.guild.id);
                /**
                 * If this role/s does exist in the guild.
                */
                let roles = (guild) ? val.filter(id => guild.roles.has(id)) : (await client.getRESTGuildRoles(interaction.guild.id)).filter(role => val.includes(role.id));//.map(a => !!a)//guild.roles.filter(role => val.includes(role.id)) : (await client.getRESTGuildRoles(interaction.guild.id)).filter(role => val.includes(role.id));

                // As if the roles were fetched via REST, it's sometimes obvious we won't get the same length of the roles to the roles sent in.

                for (let y = 0; y < roles.length; y++) {
                    if (y === 0) {
                        parsed_restrictions[i] = {
                            t: 'ROLE',
                            v: roles[y]
                        };
                        continue;
                    }

                    parsed_restrictions.push({
                        t: 'ROLE',
                        v: roles[y]
                    });
                }
            }

            parsed_restrictions[i] = {
                t: 'UNKNOWN',
                v: res
            }
            continue;
        }

        await interaction.defer(client.requestHandler, true);

        client.createMessage(interaction.channel.id, {
            content: `${id.emoji.pop} **GIVEAWAY!** ${id.emoji.pop}`,
            embed: embed.giveaway.start({
                prize, duration: parsed_duration/1000, startDate: Math.floor(Date.now()/1000), restrictions: parsed_restrictions, contact: {id: contact}, starter_id: interaction.member.user.id, winners: winners || 1
            })
        }).then((msg) => {
            // Poggers, creating the message was successful so we now push it to the database then we can start processing it as if it was.
            msg.addReaction(id.emoji.pop);

            giveaway.createGiveaway({
                prize,
                duration: parsed_duration,
                startDate: msg.createdAt,
                status: ((parsed_duration + msg.createdAt) - 20000 - Date.now() >= 0) ? Giveaway.status.ONGOING : Giveaway.status.ENDING, //(parsed_duration/1000 <= 100) ? Giveaway.status.ONGOING,
                winners: winners || 1,
                restrictions: parsed_restrictions,
                guild_id: interaction.guild.id,
                starter_id: interaction.member.user.id,
                contact_id: contact || undefined,
                message: {
                    id: msg.id,
                    channel_id: msg.channel.id
                }
            }).then(() => {
                return interaction.edit(client.requestHandler, {
                    content: `The giveaway has been successfully created!`
                });
            }, (err) => {
                logger.error(err);
                
                interaction.edit(client.requestHandler, {
                    content: `ACK! There has been an error trying to push the giveaway into database, this meant that the giveaway could not be saved :c\nPlease contact the bot developer as it has been logged.\n\nCommand usage: \`\`\`` + interaction.spitOptions() + "```"
                })

                return msg.edit({
                    embed: embed.giveaway.error.database({
                        prize, restrictions: parsed_restrictions, contact: {id: contact}, starter_id: interaction.member.user.id, winners: winners || 1
                    }), content: `${id.emoji.fail} **GIVEAWAY STARTED? MORE LIKE GIVEAWAY HAS BEEN CRAPPED ON** ${id.emoji.fail}`
                })

            });
        }, (error) => {
            return interaction.edit(client.requestHandler, {
                content: "ACK! There has been an error trying to simply create a message for some reason, perhaps I forgot to add a check to see if I can send the messages?\nBasically, I am probably lacking access to send a message so please? *nuzzles*"
            })
        })

        //giveaway.createGiveaway({
        //    prize, duration, startDate: 
        //})

    }
}