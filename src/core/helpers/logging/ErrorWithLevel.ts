import {ELogLevel} from "./ELogLevel";

/**
 * A convenience class to encapsulate an Error with an ELogLevel.
 */
export class ErrorWithLevel extends Error {

    /**
     *
     * @param level - Log level.  Note: 'error' will trigger an alert in our monitoring system
     * @param message - Summary of log item entry
     * @param meta - Meta information about the error, typically used to add more info to the log
     */
    constructor(public level: ELogLevel, message: string, public meta?: any) {
        super(message);
    }
}