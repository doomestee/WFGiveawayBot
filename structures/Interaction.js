let {RequestHandler, Permission} = require("eris");
const MessageEmbed = require("./MessageEmbed");
const Component = require("./Component");

//new perm()

class ApplicationCommandOption {
    /**
     * @param {Object} data
     * @param {number} [data.type]
     * @param {string} [data.name]
     * @param {string} [data.description]
     * @param {boolean} [data.required]
     * @param {Object} [data.choices]
     * @param {string} [data.choices.name]
     * @param {number} [data.choices.value]
     * @param {ApplicationCommandOption[]} [data.options]
     */
    constructor(data) {
        this.type = data.type;
        this.name = data.name;
        this.description = data.description;
        this.required = (data.required) ? true : false;
        this.choice = (data.choices) ? data.options : null;
        this.options = (data.options) ? data.options : null;
    }
}

class ApplicationCommandInteractionDataOption {
    /**
     * Value and options are mutually exclusive.
     * @param {Object} data
     * @param {string} [data.name]
     * @param {number} [data.type]
     * @param {string|number} [data.value]
     * @param {ApplicationCommandInteractionDataOption[]} [data.options]
     */
    constructor(data) {
        this.name = data.name;
        this.type = data.type;
        if (data.value) // && ['SUB_COMMAND', 'SUB_COMMAND_GROUP'].some(a => a === this.fetchType(this.type)))
            this.value = data.value;
        if (data.options)
            this.options = data.options;
    }

    fetchType(type=this.type) {
        if (type === 1) return 'SUB_COMMAND';
        if (type === 2) return 'SUB_COMMAND_GROUP';
        if (type === 3) return 'STRING';
        if (type === 4) return 'INTEGER';
        if (type === 5) return 'BOOLEAN';
        if (type === 6) return 'USER';
        if (type === 7) return 'CHANNEL';
        if (type === 8) return 'ROLE';
        if (type === 9) return 'MENTIONABLE';
        else return 'NO_TYPE_GIVEN';
    }
}

module.exports = class Interaction {
    /**
     * @param {Object} [data]
     * 
     * @param {string} [data.id]
     * 
     * @param {string} [data.application_id] 
     * 
     * @param {number} [data.type]
     * 
     * @param {Object} [data.data]
     * @param {string} [data.data.id] 
     * @param {string} [data.data.name] 
     * @param {*} [data.data.resolved] 
     * @param {ApplicationCommandInteractionDataOption[]} [data.data.options]
     * @param {string} [data.data.custom_id]
     * @param {string[]} [data.data.values]
     * @param {number} [data.data.component_type]
     * 
     * @param {string} [data.guild_id] 
     * 
     * @param {string} [data.channel_id]
     * 
     * @param {Object} [data.user]
     * @param {string} [data.user.username]
     * @param {number} [data.user.public_flags]
     * @param {string} [data.user.id]
     * @param {string} [data.user.discriminator]
     * @param {string} [data.user.avatar]
     * 
     * @param {Object} [data.member]
     * @param {Object} [data.member.user]
     * @param {string} [data.member.user.username]
     * @param {number} [data.member.user.public_flags]
     * @param {string} [data.member.user.id]
     * @param {string} [data.member.user.discriminator]
     * @param {string} [data.member.user.avatar]
     * @param {string[]} [data.member.roles]
     * @param {null} [data.member.premium_since]
     * @param {string} [data.member.permissions]
     * @param {boolean} [data.member.pending]
     * @param {string} [data.member.nick] 
     * @param {boolean} [data.member.mute] 
     * @param {string} [data.member.joined_at] 
     * @param {boolean} [data.member.deaf] 
     * @param {string} [data.member.avatar] 
     * 
     * TODO: add user stuff here
     * 
     * @param {string} [data.token] 
     * 
     * @param {number} [data.version] 
     * 
     * 
     * @param {Object} [data.message] 
     * 
     * TODO: add message stuff here
     */
    constructor(data, addRaw=false) {
        this.sentInitial = false;
        this.deferred = false;

        /**
         * When the interaction was initialised.
         */
        this.createdAt = Date.now();
        /**
         * Is always 1
         */
        this.version = data.version | 1;
        /**
         * Type of the interaction; 1 for PING, 2 for APPLICATION_COMMAND, 3 for MESSAGE_COMPONENT.
         */
        this.type = data.type;
        /**
         * The interaction token, is used to make a response.
         */
        this.token = data.token;
        if (data.member) {
            /**
             * (CONDITIONS: Interaction used in Guild)
             * The member who invoked the interaction.
             */
            this.member = {
                user: {
                    username: data.member.user.username,
                    public_flags: data.member.user.public_flags,
                    id: data.member.user.id,
                    discriminator: data.member.user.discriminator,
                    /**
                     * The avatar hash.
                     * Example: "`8342729096ea3675442027381ff50dfe`"
                     */
                    avatar: data.member.user.avatar
                },
                roles: data.member.roles,
                premium_since: data.member.premium_since,
                permissions: new Permission(data.member.permissions),//null//new , 
                pending: data.member.pending,
                nick: data.member.nick,
                mute: data.member.mute,
                joined_at: data.member.joined_at,
                is_pending: data.member.is_pending,
                deaf: data.member.deaf,
                /**
                 * The avatar hash.
                 * Example: "`8342729096ea3675442027381ff50dfe`"
                 */
                avatar: data.member.avatar
            }
        } else {
            this.member = null;
        }
        if (data.user) {
            this.user = {
                username: data.user.username,
                public_flags: data.user.public_flags,
                id: data.user.id,
                discriminator: data.user.discriminator,
                /**
                 * The avatar hash.
                 * Example: "`8342729096ea3675442027381ff50dfe`"
                 */
                avatar: data.user.avatar
            }
        } else data.user = null;
        /**
         * The interaction's ID, not to be confused with the invoking user/member's ID.
         */
        this.id = data.id;
        if (data.guild_id) {
            this.guild = {
                id: data.guild_id
            };
        }
        if (data.channel_id) {
            this.channel = {
                id: data.channel_id
            };
        }
        this.application = {
            id: data.application_id
        };

        if (this.type === 2) {
            this.data = {
                /**
                 * The name of the invoked command
                 */
                name: data.data.name,
                /**
                 * The ID of the invoked command
                 */
                id: data.data.id,
                resolved: data.data.resolved,
                options: data.data.options
            };
        } else if (this.type === 3) {
            this.data = {
                custom_id: data.data.custom_id,
                /**
                 * Type of the component; 1 for Action Row, 2 for Button, 3 for Select Menu.
                 */
                type: data.data.component_type,
                /**
                 * (CONDITIONS: the component is a Select Menu) An array of string, with pre-defined values.
                 */
                values: data.data.values || null
            }
        }

        if (data.message) {
            this.message = data.message;//{
                //id: data.message.id,
                //flags: data.message.flags,
                //raw: data.message
            //}
        };

        if (addRaw) this.raw = data;

        /*
        this.COMPONENT_TYPE = {
            ACTION_ROW: 1,
            BUTTON: 2
        };
        this.COMPONENT_STYLE = {
            PRIMARY: 1,
            SECONDARY: 2,
            SUCCESS: 3,
            DANGER: 4,
            LINK: 5
        }*/
    }

    /**
     * This will return a slash command so users can copy it with ease from the bot should they be lazy to Ctrl-Z on PC.
     * @param {ApplicationCommandInteractionDataOption[]} options
     */
    spitOptions(options) {
        options = options || this.data.options;

        if (!options || !options.length) return '';

        // Checks if it is a group
        let group = options.find(a => a.type === 2);
        let sub_cmd = (group) ? group.options.find(a => a.type === 1) : options.find(a => a.type === 1);

        if (group)        return `/${this.data.name} ${group.name} ${sub_cmd.name} ${(sub_cmd.options) ? sub_cmd.options.map(a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
        else if (sub_cmd) return `/${this.data.name} ${sub_cmd.name} ${(sub_cmd.options) ? sub_cmd.options.map(a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
        else              return `/${this.data.name} ${(this.data.options) ? this.data.options.map(a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
    }

    /**
     * This will check the interaction's options and see if it has the key, to which will provide the value.
     * If options is provided, this will override the options from this interaction and assume that you are looking for the option inside that array.
     * @param {string} key
     * @param {ApplicationCommandInteractionDataOption[]} options
     * @param {boolean} roamOptions If true, this will allow the code to roam the nested options within the options 
     * @returns Don't forget to check if its null before proceeding as it may be empty.
     */
    fetchOption(key, roamOptions=false, options) {
        options = options || this.data.options;

        if (!options) return null;

        if (!roamOptions) {
            return (options.some(a => a.name === key)) ? options.find(a => a.name === key) : null;
        } else {
            // Since there can't really be more than 2 nested options... cri.
            // First layer:

            if (options.some(a => a.name === key)) 
                return options.find(a => a.name === key);
            
            if (!options.some(a => (a.options) ? a.options.length > 0 : false)) return null;

            // Second layer:

            if (options.some(a => a.options.some(b => b.name === key))) 
                return options.find(a => a.options.some(b => b.name === key)).options.find(b => b.name === key);
            
            if (!options.some(a => a.options.some(b => (b.options) ? b.options.length > 0 : false))) return null;
            
            // Third and final layer:

            if (options.some(a => a.options.some(b => b.options.some(c => c.name === key))))
                return options.find(a => a.options.some(b => b.options.some(c => c.name === key))).options.find(b => (b.options) ? b.options.some(c => c.name === key) : false).options.find(c => c.name === key); //options.find(a => a.options.some(b => b.options.some(c => c.name === key)));

            return null;
        }
    }

    /**
     * Ignores if already deferred, can be overrided for error by manually editting `this.deferred` before the execution of function
     * @param {RequestHandler} requestHandler 
     * @param {boolean} ephemeral 
     */
    async defer(requestHandler, ephemeral=false) {
        if (this.deferred) return;
        if (this.sentInitial) return;

        let result = {
            type: 5,
        };

        if (ephemeral) result['data'] = {flags: 64};

        this.deferred = true;
        return requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, false, result);
    }

    /**
     * 
     * @param {RequestHandler} requestHandler 
     * @param {boolean} defer 
     * 
     * @param {Object} data 
     * 
     * @param {string} [data.content] 
     * 
     * @param {MessageEmbed[]} [data.embeds]
     * 
     * @param {Object} [data.allowed_mentions] 
     * 
     * @param {("roles"|"users"|"everyone")[]} [data.allowed_mentions.parse] 
     * @param {string[]} [data.allowed_mentions.roles] snowflakes
     * @param {string[]} [data.allowed_mentions.users] snowflakes
     * @param {boolean} [data.allowed_mentions.replied_user] if replied, whether to mention the author of the message being replied to
     * 
     * @param {Component[]} [data.components]
     * 
     * @param {boolean} ephemeral 
     */
    async respond(requestHandler, defer, data, ephemeral=false, setPatch=false) {
        let result = {
            type: (defer) ? 6 : 7
        };

        if (ephemeral) result['data'] = {flags:64};
        if (!defer && data) {
            if (!result['data']) result['data'] = {};
            
            if (data.content)          result['data']['content']          = data.content;
            //if (data.embeds)           result['data']['embeds']           = data.embeds;
            if (data.allowed_mentions) result['data']['allowed_mentions'] = data.allowed_mentions;
            if (data.components)       result['data']['components']       = data.components;

            if (data.embeds) {
                if (!Array.isArray(data.embeds)) data.embeds = [data.embeds];

                result['data']['embeds'] = [];

                for (let i = 0; i < data.embeds.length; i++) {
                    if (data.embeds[i] instanceof MessageEmbed) {
                        result['data']['embeds'].push(JSON.parse(JSON.stringify(data.embeds[i])));
                    } else {
                        if (typeof(data.embeds[i]) == 'object') {
                            result['data']['embeds'].push(data.embeds[i]);
                        }
                    }
                }

                if (result['data']['embeds'].length == 0) {
                    delete result['data']['embeds'];
                }
            }

            //console.log(data.components[0].components);
            
            if (Object.keys(result['data']).filter(a => a != 'flags').length == 0) throw Error("really?");

        }

        return (setPatch) ? requestHandler.request('PATCH', `/webhooks/${this.application.id}/${this.token}/messages/@original`, true, result) : requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, false, result);

    }

    /**
     * @param {RequestHandler} requestHandler 
     * 
     * @param {Object} data 
     * 
     * @param {string} [data.content] 
     * 
     * @param {MessageEmbed[]} [data.embeds]
     * 
     * @param {Object} [data.allowed_mentions] 
     * 
     * @param {("roles"|"users"|"everyone")[]} [data.allowed_mentions.parse] 
     * @param {string[]} [data.allowed_mentions.roles] snowflakes
     * @param {string[]} [data.allowed_mentions.users] snowflakes
     * @param {boolean} [data.allowed_mentions.replied_user] if replied, whether to mention the author of the message being replied to
     * 
     * @param {Component[]} [data.components]
     * 
     * @param {import("eris").MessageFile} file
     * 
     * @param {string} msg_id
     * @param {string} token
     */
    async edit(requestHandler, data, file, msg_id, token) {
        let result = {};

        if (data.content)          result['content']          = data.content;
        //if (data.embeds)           result['embeds']           = data.embeds;
        if (data.allowed_mentions) result['allowed_mentions'] = data.allowed_mentions;
        if (data.components)       result['components']       = data.components;

        if (data.embeds) {
            if (!Array.isArray(data.embeds)) data.embeds = [data.embeds];

            result['embeds'] = [];

            for (let i = 0; i < data.embeds.length; i++) {
                if (data.embeds[i] instanceof MessageEmbed) {
                    result['embeds'].push(JSON.parse(JSON.stringify(data.embeds[i])));
                } else {
                    if (typeof(data.embeds[i]) == 'object') {
                        result['embeds'].push(data.embeds[i]);
                    }
                }
            }

            if (result['embeds'].length == 0) {
                delete result['embeds'];
            }
        }

        if (Object.keys(result).length == 0) throw Error("really?");

        //console.log(`/webhooks/${this.application.id}/${(token) ? token : this.token}/messages/${(msg_id) ? msg_id : '@original'}`);

        //console.log(data.components);

        return requestHandler.request('PATCH', `/webhooks/${this.application.id}/${(token) ? token : this.token}/messages/${(msg_id) ? msg_id : '@original'}`, true, result, file);
    }


    /**
     * This is for sending **INITIAL** message (**not defer**)
     * @param {RequestHandler} requestHandler
     * 
     * @param {Object} data 
     * 
     * @param {string} [data.content] 
     * 
     * @param {MessageEmbed[]} [data.embeds]
     * 
     * @param {Object} [data.allowed_mentions] 
     * 
     * @param {("roles"|"users"|"everyone")[]} [data.allowed_mentions.parse] 
     * @param {string[]} [data.allowed_mentions.roles] snowflakes
     * @param {string[]} [data.allowed_mentions.users] snowflakes
     * @param {boolean} [data.allowed_mentions.replied_user] if replied, whether to mention the author of the message being replied to
     * 
     * @param {Component[]} [data.components]
     * 
     * @param {Object} options
     * @param {boolean} [options.ephemeral]
     * @param {'DeferredChannelMessageWithSource'|'ChannelMessageWithSource'} [options.interaction_type]
     * @ignore
     * @param {boolean} [options.suppressError]
     */
    async sendInitial(requestHandler, data, options) { //ephemeral=false, interaction_type='ChannelMessageWithSource') {
        if (this.sentInitial) return this.edit(requestHandler, data);

        if (!options) options = {ephemeral: false, interaction_type: 'ChannelMessageWithSource'};
        if (options.ephemeral == undefined) options['ephemeral'] = false;
        if (options.interaction_type == undefined) options['interaction_type'] = 'ChannelMessageWithSource';
        //if (options.interaction_type == undefined) options['suppressError'] = false;

        /**
         * @type {{type: 4|5, data: {flags: null|64, content: null|string, allowed_mentions: null|any, components: null|Component[], embeds: null|MessageEmbed[]}}}
         */
        let result = {
            type: (options.interaction_type === 'ChannelMessageWithSource') ? 4 : 5
        };

        if (options.interaction_type === 'ChannelMessageWithSource') {
            if (!result['data']) result['data'] = {};


            if (options.ephemeral)     result['data']['flags']            = 64;
            if (data.content)          result['data']['content']          = data.content;
            //if (data.embeds)         result['data']['embeds']           = data.embeds;
            if (data.allowed_mentions) result['data']['allowed_mentions'] = data.allowed_mentions;
            if (data.components)       result['data']['components']       = data.components;

            if (data.embeds) {
                if (!Array.isArray(data.embeds)) data.embeds = [data.embeds];

                result['data']['embeds'] = [];

                for (let i = 0; i < data.embeds.length; i++) {
                    if (data.embeds[i] instanceof MessageEmbed) {
                        result['data']['embeds'].push(JSON.parse(JSON.stringify(data.embeds[i])));
                    } else {
                        if (typeof(data.embeds[i]) == 'object') {
                            result['data']['embeds'].push(data.embeds[i]);
                        }
                    }
                }

                if (result['data']['embeds'].length == 0) {
                    delete result['data']['embeds'];
                }
            }

            //console.log(data.components[0].components);
            
            if (/*!options.suppressError && */Object.keys(result['data']).filter(a => a != 'flags').length == 0) throw Error("really?");
        }

        this.sentInitial = true;

        return requestHandler.request('POST', `/interactions/${this.id}/${this.token}/callback`, true, result);

    }

    isGuild() {
        return (this.guild) ? (this.guild.id) ? true : false : false; // idk why im using this when i coulda just do "if (this.guild)" but oh well
    }
}