/**
 * This class is for structures that requires a partial emoji in form of id, name and animated.
 */
module.exports = class PartialEmoji {
    /**
     * @param {Object} data
     * @param {string} [data.id]
     * @param {string} [data.name]
     * @param {string} [data.animated]
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name || null;
        if (data.animated) this.animated = data.animated;
    }

    toObject() {
        let obj = {};

        if (obj.animated) obj['animated'] = (obj.animated) ? true : false; // force result as boolean.
        obj['id'] = this.id;
        obj['name'] = this.name;

        return obj;
    }
}