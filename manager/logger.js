const chalk = require("chalk");
const {promises: {appendFile: append}, existsSync, mkdirSync } = require("fs");
const fastq = require("fastq");

/**
 * @param {Object} obj
 * @param {"main"|"error"} [obj.type] If unprovided, it will use `'main'` by default.
 * @param {*} obj.info The type of stuff to write to.
 * @param {Number|Date} [obj.time] If unprovided, it will use the time taken when calling the function
 * @param {string} obj.path If unprovided, `it will use './log/main/DATE.txt'` for example, by default.
 */
async function worker(obj) {
    if (obj == undefined) obj = {};
    if (obj.type == undefined) obj.type = 'main';
    if (!['main', 'error'].includes(obj.type)) return Promise.reject('Unknown type');

    if (obj.time == undefined) obj.time = new Date();
    if (typeof(obj.time) === "number") obj.time = new Date(obj.time);

    if (obj.info == undefined || obj.info.toString().length === 0) return Promise.reject('Empty information');

    const file = (obj.type === 'main') ? obj.path + 'main/' + obj.time.toLocaleDateString('en-GB').replace(/\//g, '-') + '.txt' : (obj.type === 'error') ? obj.path + 'error/' + obj.time.toLocaleDateString('en-GB').replace(/\//g, '-') + '.txt' : obj.path + 'unknown.txt';

    return append(file, `[${obj.time.toLocaleTimeString('en-GB')}.${obj.time.getMilliseconds().toString().padStart(3, '0')}] ${obj.info}\n`, {flag: 'a+'});
}

function catchQueue(error) {
    this.queue.pause();
    this._ready = false;

    console.error(chalk.redBright(`An error has been caught!`), error);
}

/**
 * idk
 */
module.exports = class LoggerManager {
    /**
     * @param {string} path String please. Default is: `'./log/'`
     */
    constructor(path) {

        this.path = path || './log/';
        this.path = (!this.path.endsWith("/")) ? this.path + '/' : this.path;

        if (!existsSync(this.path))            mkdirSync(this.path);
        if (!existsSync(this.path + 'main/'))  mkdirSync(this.path + 'main/');
        if (!existsSync(this.path + 'error/')) mkdirSync(this.path + 'error/');


        this.createdAt = Date.now();
        this.queue = fastq.promise(worker, 1);
        /**
         * @protected
         */
        this._ready = true;

        this.queue.push({info: "Logger initialised.", path: this.path}).catch(err => catchQueue.call(this, err));
    }

    /**
     * Changes the ready state of the function, idk why is this added tbf.
     * @param {boolean} bool 
     * @param {Object} options
     * @param {string} options.path This will change the path if provided.
     */
    ready(bool=true, options) {
        this._ready = !!bool;

        if (!bool) this.queue.pause();
        else this.queue.resume();

        if (options) {
            if (options.path) this.path = (!options.path.endsWith("/")) ? options.path + '/' : this.path;
        }
    }

    /**
     * As this is for any sort of error, it will obviously write to the file regardless whether or not if intended.
     * @param {*} error 
     */
    error(error) {
        console.error(chalk.redBright(`An error has been caught!`), error);
        this.queue.push({info: error, path: this.path, time: Date.now(), type: 'error'}).catch(err => catchQueue.call(this, err));
    }

    /**
     * @param {string} info 
     * @param {import("chalk").Chalk} colour If this is set to null, it will not log to console. (Put `undefined` if you just want to skip to the next argument while retaining the default value of this property)
     * @param {boolean} writeFile This will log to the file if necessary.
     * @param {boolean} writeConsole Whether to log to console
     */
    info(info, colour=chalk.whiteBright, writeFile=true, logToConsole=true) {
        if (colour !== null && logToConsole) console.log(colour(info));

        if (writeFile) this.queue.push({info: info, path: this.path, time: Date.now(), type: 'main'}).catch(err => catchQueue.call(this, err));
    }
}