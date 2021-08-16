const fs = require("fs").readdirSync;

//const ascii = require("ascii-table");
//const table = new ascii().setHeading("Command", "Load Status");

module.exports = (client) => {
    fs("./commands/").forEach(dir => {
        const commands = fs(`./commands/${dir}/`).filter(f => f.endsWith(".js"));

        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);

            if (pull.name) {
                client.commands.set(pull.name, pull);
                //table.addRow(file, "✅");
            } else {
                //table.addRow(file, "❌ -> missing somethings?");
                continue;
            }

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliases.forEach(alias => client.aliases.set(alias, pull.name))
            }
        }
    });
}