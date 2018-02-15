import {generateUniqueId, getDefaultLogger} from "../../core";
import url = require("url");
import _ = require("lodash");


/**
 * Logs an express request using getDefaultLogger().
 *
 * @returns {(req, res, next) => void}
 */
export function requestLogger() {
    const logger = getDefaultLogger();

    // tslint:disable-next-line
    return function (req: any, res: any, next: any): void {
        const rEnd = res.end;

        // To track response time
        req._rlStartTime = new Date();
        req._requestId = generateUniqueId();

        // Setup the key-value object of data to log and include some basic info
        req.kvLog = extractLoggingDetailsFromRequest(req);

        // Proxy the real end function
        // tslint:disable-next-line
        res.end = function (chunk, encoding) {
            // Do the work expected
            res.end = rEnd;
            res.end(chunk, encoding);

            // Save a few more variables that we can only get at the end
            req.kvLog.status = res.statusCode;
            req.kvLog.response_time = (new Date().getTime() - req._rlStartTime);

            const msg = `${req.kvLog.status} ${req.kvLog.method} ${req.kvLog.url} (${req.kvLog.response_time}ms)`;

            if (req.kvLog.status >= 500) {
                logger.error(msg, req.kvLog);
            } else if (req.kvLog.status >= 400) {
                logger.warn(msg, req.kvLog);
            } else {
                logger.info(msg, req.kvLog);
            }

        };

        next();
    };
}

export function extractLoggingDetailsFromRequest(req: any): any {
    return {
        date: req._rlStartTime.toISOString(),
        method: req.method,
        url: url.parse(req.originalUrl).pathname,
        type: "reqlog",
        id: req._requestId,
        headers: _.omit(req.headers, ["cookie"]) // remove potentially user confidential data from being logged.
    };
}