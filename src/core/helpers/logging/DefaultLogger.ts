import {ILogger} from "./ILogger";
import {getConsoleLogger} from "./ConsoleLogger";

let defaultLogger: ILogger;

export function setDefaultLogger(logger: ILogger): ILogger {
    defaultLogger = logger;
    return defaultLogger;
}

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