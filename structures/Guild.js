module.exports = class Guild {
    /**
     * @param {Object} data
     * @param {string} data._id Guild's ID
     * @param {string} data.owner_id Owner's ID
     * @param {string} data.
     * @param {string} data.
     * @param {string} data.
     */
    constructor(data) {
        if (!data._id) throw Error("How can you not know the ID of the guild you want to create?");
        if (!data.owner_id) throw Error("The owner's ID (owner_id) is not provided.");
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