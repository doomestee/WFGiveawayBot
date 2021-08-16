/**
 * This file is not related to any of Eris or Discord libraries, just
 * a separate User class for stuff in mongodb.
 */

module.exports = class User {
    /**
     * @param {Object} data
     * @param {string} [data._id] User's ID
     * @param {string} [data.name] User's (user, not nick)name
     * @param {number} [data.plat] Amount of platinum donated and logged
     */
    constructor(data) {
        this._id = data._id;
        this.name = data.name;
        this.plat = data.plat;
    }
}