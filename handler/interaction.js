/*

This handler was made with absolutely no effort, I should probably bother to improve this soon.
TODO: improve...

*/


const { existsSync: efs, readdirSync: rds } = require("fs");
const ascii = require("ascii-table");
const tableInt = new ascii().setHeading("Interaction", "Load Status");
const tableComp = new ascii().setHeading("Component", "Load Status");

module.exports = 
/**
 * @param {Object} client 
 * @param {Object} [client.interactions]
 * @param {Object} [client.interactions.aliases]
 * @param {Object} [client.components]
 */
(client) => {
    rds("./interactions/(components)/").filter(name => name.endsWith('.js'))/*.map(name => './interactions/(components)/' + name)*/.forEach(dir => {
        let file = require(`../interactions/(components)/${dir}`);

        if (file.functions != null && Array.isArray(file.functions)) {
            if (file.functions === 0) return;

            client.components[dir.slice(0, -3)] = {};

            for (let function_name of file.functions) { // Can't have 'function' as a variable :c
                if (!file[function_name]) {
                    tableComp.addRow(dir.slice(0, -3) + '-' + function_name, "- -> missing something?");
                    continue;
                } else if (typeof(file[function_name]) !== 'function') {
                    tableComp.addRow(dir.slice(0, -3) + '-' + function_name, "- -> not a function?");
                    continue;
                }

                client.components[dir.slice(0, -3)][function_name] = file[function_name];
                tableComp.addRow(dir.slice(0, -3) + '-' + function_name, "+");
            }

            if (!Object.keys(client.components[dir.slice(0, -3)]).length) delete client.components[dir.slice(0, -3)];//client.components.remove({id: dir.slice(0, -3)});

        } else {
            if (file.functions != null) {
                tableComp.addRow(dir.slice(0, -3), "- -> missing somethings?");
            }
        }

    });

    //console.log(tableComp.toString());

    rds("./interactions/").forEach(dir => {

        if (dir.startsWith("(") && dir.endsWith(")")) return;

        // Checks if it is a folder

        if (!efs(`./interactions/${dir}/`)) return;

        // Checks if it has an index.js

        if (!efs(`./interactions/${dir}/index.js`)) return;

        // Process index.js

        let indexFile = require(`../interactions/${dir}/index.js`);//require("../interactions/giveaway/index"); //require(`../interactions/${dir}/index.js`);

        if (indexFile.sub_group != null && indexFile.sub_group) {
            if (Object.keys(indexFile.sub_group).length !== 0) {//return;

                client.interactions[dir] = {};

                for (let sub_group of Object.keys(indexFile.sub_group)) { // SUB COMMAND GROUPS

                    client.interactions[dir][sub_group] = {};
                    for (let sub of indexFile.sub_group[sub_group]) { // SUB COMMANDS
                        if (!efs(`./interactions/${dir}/${sub_group}-${sub}.js`)) continue;

                        let pull = require(`../interactions/${dir}/${sub_group}-${sub}.js`);

                        if (pull.run && !pull.ignore) {
                            if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.interactions.aliases[alias] = [dir, file])
        
                            client.interactions[dir][sub_group][sub] = pull;
                            tableInt.addRow(dir + '-' + sub_group + '-' + sub, "+");
                        } else {
                            tableInt.addRow(dir + '-' + sub_group + '-' + sub, (pull.ignore) ? 'IGNORED' : "- -> missing somethings?");
                        }
                    }

                    if (!Object.keys(client.interactions[dir][sub_group]).length) delete client.interactions[dir][sub_group];//client.interactions.remove({id: dir});
                }

                if (!Object.keys(client.interactions[(dir)]).length) delete client.interactions[dir];//client.interactions.remove({id: dir});
            }
        }

        if (indexFile.sub != null && Array.isArray(indexFile.sub)) { // Either null or undefined || array of strings.
            if (indexFile.sub.length === 0) return;

            if (!client.interactions[dir]) client.interactions[dir] = {};
            for (let file of indexFile.sub) { // SUB COMMANDS
                if (!efs(`./interactions/${dir}/${file}.js`)) continue;

                let pull = require(`../interactions/${dir}/${file}.js`);

                if (pull.run && !pull.ignore) {
                    if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.interactions.aliases[alias] = [dir, file])

                    client.interactions[(dir)][file] = pull;
                    tableInt.addRow(dir + '-' + file, "+");
                } else {
                    tableInt.addRow(dir + '-' + file, (pull.ignore) ? 'IGNORED' : "- -> missing somethings?");
                }
            }

            if (!Object.keys(client.interactions[(dir)]).length) delete client.interactions[dir];//client.interactions.remove({id: dir});
        } else {
            if (indexFile.run && !indexFile.ignore) {
                if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.interactions.aliases[alias] = [dir])

                client.interactions[dir] = indexFile//.set(dir, indexFile);   
                tableInt.addRow(dir, "+");
            } else {
                tableInt.addRow(dir, (indexFile.ignore) ? 'IGNORED' : "- -> missing somethings?");
            }
        }


        /*continue;
        for (let file of interactions) { // This will check the folder of that interaction
            let pull = require(`../interactions/${dir}/${file}`);
        }

        for (let file of interactions) {
            let pull = require(`../interactions/${dir}/${file}`);

            if (pull.name) {
                client.interactions.set(pull.name, pull);
                //table.addRow(file, "✅");
            } else {
                //table.addRow(file, "❌ -> missing somethings?");
                continue;
            }

            if (pull.aliases && Array.isArray(pull.aliases)) {
                pull.aliasss.forEach(alias => client.aliasss.set(alias, pull.name))
            }
        }*/
    });

    console.log(tableInt.toString());
    console.log(tableComp.toString());
    //process.exit(1);
}