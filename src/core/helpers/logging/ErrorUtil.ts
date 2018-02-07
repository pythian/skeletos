import _ = require("lodash");
import {AbstractSkeletosState} from "../../extendible/AbstractSkeletosState";

/**
 * Various utilities to work with errors.
 */
export class ErrorUtil {

    /**
     * Customize the given error with the additional given message. A new Error will be returned.
     *
     * @param {Error | string} e
     * @param {string} message
     * @returns {Error}
     */
    static customize(e: Error | string, message: string): Error {
        if (!e) {
            return new Error(message);
        } else if (_.isString(e)) {
            return new Error(message + "\n" + e);
        } else {
            (e as Error).message = message + "\n" + (e as Error).message;
            return e;
        }
    }

    /**
     * Stringifies an object including Errors (which cannot be stringified with JSON.stringify).
     *
     * @param obj
     * @returns {string}
     */
    static stringify(obj: any): string {
        if (_.isString(obj)) {
            return obj;
        } else {
            return JSON.stringify(this.recursivePropertyFinder(obj), null, "\t");
        }
    }

    /**
     * Gets a developer-friendly string from an Error that can be printed out into the console or in the logs.
     *
     * @param {Error | string} messageOrError
     * @returns {string}
     */
    static getPrintableError(messageOrError: Error|string): string {
        if (_.isString(messageOrError)) {
            return messageOrError;
        } else if (messageOrError instanceof Error) {
            const error: Error = messageOrError as Error;
            let ret: string = error.toString() || "An error occurred";

            // tslint:disable-next-line:no-string-literal
            if (error["details"]) {
                // tslint:disable-next-line:no-string-literal
                ret += "\n" + JSON.stringify(error["details"]);
            }

            if (process.env.NODE_ENV !== "production") {
                if (error.stack) {
                    ret += "\n" + error.stack;
                }
            }

            return ret;
        }

        // if neither of the above.
        try {
            return this.stringify(messageOrError);
        } catch (e) {
            return messageOrError;
        }
    }

    /**
     * Gets the name of a class or an object that can be used in Error objects and for debugging purposes.
     *
     * @param objectOrPrototype
     * @returns {string}
     */
    static getDebugName(objectOrPrototype: any): string {
        let name: string;

        if (!objectOrPrototype) {
            name = "null";
        } else if (_.isFunction(objectOrPrototype)) {
            name = objectOrPrototype.toString().match(/\w+/g)[1];
        } else if (objectOrPrototype.constructor) {
            name = objectOrPrototype.constructor.toString().match(/\w+/g)[1];
        } else if (objectOrPrototype.prototype) {
            name = objectOrPrototype.prototype.constructor.toString().match(/\w+/g)[1];
        } else {
            name = objectOrPrototype.toString();
        }

        if (objectOrPrototype instanceof AbstractSkeletosState && (objectOrPrototype as AbstractSkeletosState).cursor) {
            name += " (" + (objectOrPrototype as AbstractSkeletosState).cursor.path.join("/") + ")";
        }

        return name;
    }

    /**
     * Logs any uncaught exceptions and unhandled promise rejections.
     *
     * Generally, it is a bad practice to just log uncaught errors and move on. It is recommended that, in a server
     * environment, you supply a callback that when called will prevent any new server requests and drain the current
     * connections, and finally do a process.exit(1).
     */
    static logUncaughtExceptionsAndUnhandledRejections(callback?: (thrown: any) => void): void {
        const handler = (thrown: any): void => {
            let msg: string = "Unknown Error";
            if (thrown instanceof Error) {
                const error: Error = thrown as Error;
                msg = error.name + ": " + error.message + "\n" + error.stack;
            } else if (thrown) {
                msg = thrown.toString();
            }

            // tslint:disable-next-line
            console.error("Uncaught error:\n" + msg);

            if (callback) {
                try {
                    callback(thrown);
                } catch (e) {
                    // tslint:disable-next-line
                    console.error("Error while calling callback on catastrophic failure:\n" +
                        ErrorUtil.getPrintableError(e));
                }
            }
        };

        (process as NodeJS.EventEmitter).on("uncaughtException", handler);
        (process as NodeJS.EventEmitter).on("unhandledRejection", handler);
    }

    /**
     * Makes sure Errors can be serialized.
     *
     * @param obj
     * @returns {object}
     */
    private static recursivePropertyFinder(obj): object {
        if (obj === Object.prototype) {
            return {};
        } else {
            return _.reduce(Object.getOwnPropertyNames(obj),
                function copy(result, value, key) {
                    if (!_.isFunction(obj[value])) {
                        if (_.isObject(obj[value])) {
                            result[value] = ErrorUtil.recursivePropertyFinder(obj[value]);
                        } else {
                            result[value] = obj[value];
                        }
                    }
                    return result;
                }, ErrorUtil.recursivePropertyFinder(Object.getPrototypeOf(obj))
            );
        }
    }
}