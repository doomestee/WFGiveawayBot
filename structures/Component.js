const PartialEmoji = require("./PartialEmoji");

module.exports = class Component {
    /**     
     * @param {Object} data
     * @param {number} [data.type] FOR ALL TYPES | 1 for Action Row, 2 for Button
     * @param {number} [data.style] BUTTONS ONLY | 1 for Primary (Custom ID is required), 2 for Secondary (Custom ID is required), 3 for Success (Custom ID is required), 4 for Danger (Custom ID is required), 5 for Link (URL is required)
     * @param {string} [data.label] BUTTONS ONLY | 80 characters only
     * @param {Object} [data.emoji] BUTTONS ONLY
     * @param {string} [data.emoji.name] BUTTONS ONLY
     * @param {string} [data.emoji.id] BUTTONS ONLY
     * @param {boolean} [data.emoji.animated] BUTTONS ONLY
     * @param {string} [data.custom_id] BUTTONS/SELECT MENUS ONLY
     * @param {string} [data.url] BUTTONS ONLY
     * @param {boolean} [data.disabled] BUTTONS ONLY
     * @param {Component[]} [data.components] ACTION ROWS ONLY 
     * @param {string} [data.placeholder] SELECT MENUS ONLY
     * @param {number} [data.min_values] SELECT MENUS ONLY (default 1, min 0, max 25)
     * @param {number} [data.max_values] SELECT MENUS ONLY (default 1, max 25)
     * @param {Object[]} [data.options] SELECT MENUS ONLY
     * @param {string} [data.options.label] The user-facing name of the option, max 25 characters
     * @param {string} [data.options.value] The dev-define value of the option, max 100 characters
     * @param {string} [data.options.description] An additional description of the option, max 50 characters
     * @param {PartialEmoji} [data.options.emoji] Emoji Object
     * @param {boolean} [data.options.default] Will render this option as selected by default
     */
    constructor(data) {
        this.type = data.type;
        this.raw = data;

        if (data.style) 
            /**
             * 1 for Primary (Custom ID is required), 2 for Secondary (Custom ID is required), 3 for Success (Custom ID is required), 4 for Danger (Custom ID is required), 5 for Link (URL is required)
             */
            this.style = (data.style) ? data.style : 1;
        if (data.label) this.label = data.label.trim().slice(0, 80);
        if (data.emoji) {
            if (data.emoji.id) {
                this.emoji = {
                    id: data.emoji.id,
                }

                if (data.emoji.animated != undefined)
                    this.emoji.animated = data.emoji.animated;

                if (data.emoji.name != undefined)
                    this.emoji.name = data.emoji.name;
                else this.emoji.name = null;
            }
        }
        if (data.custom_id) this.custom_id = data.custom_id.trim().slice(0, 100);
        if (this.style == 5) {
            if (data.url) {
                this.url = data.url;
            } else {
                this.url = "https://www.google.com/search?q=empty+link";
            }
        }
        if (data.type === 2) this.disabled = (data.disabled) ? true : false;
        if (data.type === 1) this.components = data.components;

        if (data.placeholder) this.placeholder = data.placeholder;
        if (data.min_values) this.min_values = data.min_values;
        if (data.max_values) this.max_values = data.max_values;
        if (data.options) this.options = data.options;

    }

    /**
     * This object doesn't feature all of the stuff you need for a button object,
     * they are rather there to help identify what you're looking for.
     */
    static button = {
        style: {
            /**
             * Blurple colour
             */
            primary: 1,
            /**
             * Gray colour
             */
            secondary: 2,
            /**
             * Green colour
             */
            success: 3,
            /**
             * Red colour
             */
            danger: 4,
            /**
             * Gray, navigates to a URL
             */
            link: 5,
        }
    }

    /**
     * The type of the component
     */
    static type = {
        ActionRow: 1,
        Button: 2,
        SelectMenu: 3
    }
}

class SelectOption {
    /**
     * @param {Object} data
     * @param {string} [data.label] The user-facing name of the option, max 25 characters
     * @param {string} [data.value] The dev-define value of the option, max 100 characters
     * @param {string} [data.description] An additional description of the option, max 50 characters
     * @param {PartialEmoji} [data.emoji] Emoji Object
     * @param {boolean} [data.default] Will render this option as selected by default
     */
    constructor(data) {
        this.label = data.label;
        this.value = data.value;
        if (data.description) this.description = data.description;
        if (data.emoji && typeof(data.emoji) === 'object') this.emoji = (data.emoji instanceof PartialEmoji) ? data.emoji.toObject() : data.emoji;
        if (data.default) this.default = (data.default) ? true : false; 
    }

    toObject() { // First time making toObject, its prob a bad idea to recreate one on every other classes when I could extend a class to this.
        let obj = {};
        obj['label'] = this.label;
        obj['value'] = this.value;
        if (this.description) obj['description'] = this.description;
        if (this.emoji) obj['emoji'] = this.emoji;
        if (this.default) obj['default'] = this.default;

        //Object.getOwnPropertyNames(this).forEach(a => obj[a] = this[a]);
        return obj;
    }
}