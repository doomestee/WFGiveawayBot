const { ObjectID } = require("mongodb");

module.exports = class OBID {
    /**
     * @param {string|ObjectID} id Can be ignored if the class has '_id' or 'report_id' tag.
     */
    fetchIDinObjectForm(id) {
        if (!id) {
            if (this._id) id = this._id;
            if (!id && this.report_id) id = this.report_id;

            if (!id) throw Error("No ID");
        }

        return (id instanceof ObjectID) ? id : new ObjectID(id);
    }
}