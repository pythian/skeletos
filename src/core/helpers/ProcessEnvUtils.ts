import _ = require("lodash");

/**
 * Utility to get environment variables from a list of possible keys.
 *
 * E.g. you may want to check if there is an environment variable defined for PORT or SERVER_PORT.
 */
export class ProcessEnvUtils {

    /**
     * Gets the environment variables
     * @param defaultValue
     * @param {string} possibleKeys
     * @returns {any}
     */
    static getEnvVar(defaultValue: any, ...possibleKeys: string[]): any {
        if (!process || !process.env) {
            return defaultValue;
        }

        let val: any;
        for (const key of possibleKeys) {
            val = process.env[key];
            if (val) {
                return val;
            }
        }

        // try all lowercase...only do this once we have checked case sensitive for performance reasons.
        const processEnv: object = {};

        if (process && process.env) {
            // tslint:disable-next-line:forin
            for (const key in process.env) {
                processEnv[key.toLowerCase()] = process.env[key];
            }
        }

        for (const key of possibleKeys) {
            val = processEnv[key.toLowerCase()];
            if (val) {
                return val;
            }
        }

        return defaultValue;
    }

    static getEnvVarAsBoolean(defaultValue: boolean, ...possibleKeys: string[]): boolean {
        const retVal: string = this.getEnvVar(defaultValue, ...possibleKeys);
        if (_.isString(retVal)) {
            return retVal === "true";
        } else {
            return !!retVal;
        }
    }

    static getEnvVarAsString(defaultValue: string, ...possibleKeys: string[]): string {
        const retVal: string = this.getEnvVar(defaultValue, ...possibleKeys);
        if (retVal === undefined || retVal === null) {
            return retVal;
        } else {
            return retVal + "";
        }
    }

    static getEnvVarAsNumber(defaultValue: number, ...possibleKeys: string[]): number {
        const retVal: string = this.getEnvVar(defaultValue, ...possibleKeys);
        if (_.isString(retVal)) {
            return parseInt(retVal, 10);
        } else if (_.isNumber(retVal)) {
            return retVal as number;
        } else {
            return Number.NaN;
        }
    }
}