import {ELogLevel} from "./ELogLevel";

/**
 * A common interface for logging. Different implementations for browser and node are available.
 *
 * See:
 * 1. ConsoleLogger
 * 2. DefaultLogger
 */
export interface ILogger {

    /**
     * Log an error or an error message. Context can be any JSON object.
     *
     * @param {string | Error} message
     * @param context
     */
    error(message: string|Error, context?: any): void;

    /**
     * Log a warning error or a warning message. Context can be any JSON object.
     *
     * @param {string | Error} message
     * @param context
     */
    warn(message: string|Error, context?: any): void;

    /**
     * Log an info error or an info message. Context can be any JSON object.
     *
     * @param {string | Error} message
     * @param context
     */
    info(message: string|Error, context?: any): void;

    /**
     * Log a debugging error or an debugging message. Context can be any JSON object.
     *
     * @param {string | Error} message
     * @param context
     */
    debug(message: string|Error, context?: any): void;

    /**
     * Log an error or a message at the given log level. Context can be any JSON object.
     *
     * @param {ELogLevel} level
     * @param {string | Error} message
     * @param context
     */
    log(level: ELogLevel, message: string|Error, context?: any): void;
}