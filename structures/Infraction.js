module.exports = class Infraction {
    /**
     * @param {Object} data
     * @param {string} [data._id] Infraction's ID
     * @param {Object} data.user User's information
     * @param {string} data.user.id User's ID
     * @param {string} [data.user.name] User's name
     * @param {Object} data.action The action taken
     * @param {number} data.action.type Type of action
     * @param {number} data.action.start When the action's taking effect, in milliseconds
     * @param {number} [data.action.duration] When the action's due to end, in milliseconds. (null for permanent)
     * @param {boolean} [data.action.resolved] If the action has been cleared (re-qualify or unban) when the action has expired.
     * @param {Object} data.moderator Moderator's information
     * @param {string} data.moderator.id Moderator's ID
     * @param {Object} data.guild Guild's information
     * @param {string} data.guild.id Guild's ID
     * @param {string} [data.reason] Reason for the infraction
     */
    constructor(data) {
        if (!data.user || !data.user.id) throw Error("The user's ID is not provided.");
        if (!data.action || !data.action.type) throw Error("The action type is not provided.");
        if (!data.moderator || !data.moderator.id) throw Error("The moderator's ID is not provided.");
        if (!data.guild || !data.guild.id) throw Error("The guild's ID is not provided.");

        if (data._id) 
        /**
         * Infraction's ID, is optional if one is being created.
        */ this._id = data._id;

        /**
         * Reason for the infraction.
         */
        this.reason = data.reason || null;

        this.guild = {
            id: data.guild.id
        }

        /**
         * The moderator who took an action on the user.
         */
        this.moderator = {
            id: data.moderator.id
        }

        //if (data.user) {
            /**
             * The user affected by the infraction.
             */
            this.user = {
                id: data.user.id,
                name: data.user.name || null,
            }
        //}

        //if (data.action) {
            this.action = {
                /**
                 * 1 for disqualification, 2 for ban
                 */
                type: data.action.type,
                start: data.action.start || null,
                /**
                 * If null, the action is to linger permanently.
                 */
                duration: data.action.duration || null,
                /**
                 * If the action has been cleared (re-qualify or unban) when the action has expired.
                 */
                resolved: data.action.resolved || false
            }
        //}
    }

    static action_type = {
        DIQ: 1,
        BAN: 2
    }
}