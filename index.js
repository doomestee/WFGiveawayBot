require("dotenv").config();

const { Client } = require("eris");
const { MongoClient } = require("mongodb");
//const Giveaway = require("./structures/Giveaway");
//const { id, embed, randomNumber } = require("./utilities");
//const { verifyRestrictionByUser } = require("./utilities/mongodb");
const {readdirSync, statSync} = require("fs");
const chalk = require("chalk");
//const Interaction = require("./structures/Interaction");

/*const ram_logger = new (require('./manager/logger'))('./usage_log/');
setInterval(() => {
    let mem = process.memoryUsage();

    ram_logger.info(`RAM Usage: ${Math.round((mem.heapUsed/1024/1024) * 100) / 100} MB`, chalk.greenBright);
    //ram_logger.info(`RAM Usage: ${mem.heapUsed/(1024)}/${mem.heapTotal/)}GB`, chalk.greenBright);
}, 2000);*/

const logger = new (require("./manager/logger"))();
const cooldowns = new (require("./manager/cooldown"))();
const giveaway = new (require("./manager/giveaway"))(false, logger);
const infraction = new (require("./manager/infraction"))(null, logger);
const user = new (require("./manager/user"))(null);


let client = new Client(`Bot ${process.env.BOT_TOKEN}`, {
    intents: ["guildMembers", "guildMessages", "guilds", "guildMessageReactions", /*"guildBans"*/], getAllUsers: true, restMode: true
}), mongo = new MongoClient(process.env.MONGODB, { useUnifiedTopology: true });

/*

TODO: debate whether to replace the variable 'mongo' with giveaway since it technically will hold a mongoclient.

*/

module.exports = {
    client, mongo, logger, cooldowns, giveaway, user, infraction
};

client.interactions = {
    aliases: {}
};
client.components = {};

['interaction', /*'command'*/].forEach((val) => require("./handler/" + val)(client));

//client.interactions = new Collection();
//client.components = new Collection();

/* 

TODO (DONE sort of?) - Create a separate folder for all of the discord events so it will be neater in index.js
TODO - Create a separate folder for all of the giveaway manager events so it will be neater in here

*/

readdirSync("./event/").forEach((name) => {//.filter(name => name.endsWith('.js')).forEach((name) => {
    if (!statSync('./event/' + name).isDirectory()) return;

    readdirSync("./event/" + name).filter(file => file.endsWith('.js')).forEach((file) => {
        (require('./event/' + name + '/' + file))(module.exports);
    })

    //console.log(require("fs").statSync('./event/' + name).isDirectory())//name.endsWith("/"));

    //(require('./event/discord/' + name))(module.exports); // I tried using .call(this) in hope that it wouldnt use module.exports but nope rip
    // Also after taking a look at this again, I just realise how useless it is to use module.exports when I could just require index :pepg:
});

client.connect();