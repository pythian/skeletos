import {ILogger} from "./ILogger";
import {getConsoleLogger} from "./ConsoleLogger";

let defaultLogger: ILogger;

/**
 * Set the static global default logger. You should only do this once when your application (node and browser) starts up.
 *
 * @param {ILogger} logger
 * @returns {ILogger}
 */
export function setDefaultLogger(logger: ILogger): ILogger {
    defaultLogger = logger;
    return defaultLogger;
}

/**
 * Gets the default global logger.
 *
 * @returns {ILogger}
 */
export function getDefaultLogger(): ILogger {
    if (defaultLogger) {
        return defaultLogger;
    } else {
        const logger = getConsoleLogger();
        logger.warn("Have you initialized logging?  On client-side, must call: setDefaultLogger(new Logger()) at the earliest possible location. " +
            "If calling from server-side, make sure initializeServerLogging() and setDefaultLogger(new Logger()) are called before calling getDefaultLogger().");
        return logger;
    }
}