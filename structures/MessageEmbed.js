module.exports = class MessageEmbed {
    /**
     * @param {Object} data 
     * @param {string} [data.title] 
     * @param {string} [data.type] 
     * @param {string} [data.description] 
     * @param {string} [data.url]
     * @param {number} [data.timestamp]
     * @param {number} [data.color]
     * @param {{text: string, icon_url?: string, proxy_icon_url?: string}} [data.footer]
     * @param {{name?: string, url?: string, icon_url?: string, proxy_icon_url?: string}} [data.author]
     * @param {{name: string, value: string, inline?: boolean}[]} [data.fields]
     */
    constructor(data) {
        if (data.title) this.title = data.title;
        if (data.type) {
            this.type = (data.title) ? data.title : 'rich';
        }
        if (data.description) this.description = data.description;
        if (data.url) this.url = data.url;
        if (data.timestamp) this.timestamp = data.timestamp;
        if (data.color) this.color = data.color;
        if (data.author) {
            this.author = {};

            if (data.author.name)           this.author.name           = data.author.name;
            if (data.author.icon_url)       this.author.icon_url       = data.author.icon_url;
            if (data.author.proxy_icon_url) this.author.proxy_icon_url = data.author.proxy_icon_url;
            if (data.author.url)            this.author.url            = data.author.url;
        }//data.color;
        if (data.footer) {
            this.footer = {};

            if (data.footer.text)           this.footer.text           = data.footer.text;
            if (data.footer.icon_url)       this.footer.icon_url       = data.footer.icon_url;
            if (data.footer.proxy_icon_url) this.footer.proxy_icon_url = data.footer.proxy_icon_url;
        }
        if (data.fields) {
            if (Array.isArray(data.fields)) {
                this.fields = data.fields;
            } else {
                this.fields = [data.fields];
            }
        }
    }

    toJSON() {
        const {title, author, color, description, fields, footer, timestamp, type, url} = this;
        return {
            title,
            author,
            color,
            description,
            fields,
            footer,
            timestamp,
            type, 
            url
        };
    }
}