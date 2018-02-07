import _ = require("lodash");
import async = require("async");
import express = require("express");
import cuid = require("cuid");
import helmet = require("helmet");
import compression = require("compression");
import expressValidator = require("express-validator");
import bodyParser = require("body-parser");
import cookieParser = require("cookie-parser");
import dotenv = require("dotenv");
import {
    AbstractAction,
    ConsoleLogger,
    ErrorUtil,
    getDefaultLogger,
    ISkeletosCommand,
    setDefaultLogger
} from "../../core";
import {requestLogger} from "../helpers/requestLogger";
import {FilePathUtils} from "../helpers/FilePathUtils";
import {AbstractSkeletosRenderAction} from "./AbstractSkeletosRenderAction";
import * as http from "http";
import * as https from "https";
import {ServerOptions} from "https";


/**
 * Initializes an express server by setting up good defaults.
 */
export abstract class AbstractInitializeServerAction<RenderActionType extends AbstractSkeletosRenderAction<any, any>>
    extends AbstractAction {

    /**
     * The express app.
     */
    protected expressApp: express.Express;

    /**
     * The server instance.
     */
    protected server: http.Server | https.Server;

    /**
     * Export this function as the default of your server entry point.
     *
     * E.g. in /server/index.ts:
     *
     * export default new MyInitAction().bootstrap;
     */
    // tslint:disable-next-line
    public bootstrap: Function = (): void => {
        setDefaultLogger(new ConsoleLogger());

        ErrorUtil.logUncaughtExceptionsAndUnhandledRejections();

        this.execute();
    }

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionAsynchronously(this.delayedStart),
            this.callFunctionAsynchronously(this.loadEnvFile),
            this.callFunctionSynchronously(this.createExpressInstance),
            this.callFunctionSynchronously(this.initializeLogging),
            this.callFunctionSynchronously(this.setupRequestPreprocessors),
            this.callFunctionSynchronously(this.setupMetadataResponses),
            this.callFunctionSynchronously(this.setupStaticAssetsMiddleware),
            this.callFunctionSynchronously(this.setupPageRenderMiddleware),
            this.callFunctionSynchronously(this.setupAPIMiddleware),
            this.callFunctionSynchronously(this.setupServer),
        ];
    }

    /**
     * How long to wait before starting the server? In milliseconds.
     *
     * Default: process.env.DELAYED_START or 0.
     *
     * @returns {number}
     */
    protected getDelayedStartPeriod(): number {
        if (process.env.DELAYED_START) {
            return parseInt(process.env.DELAYED_START, 10);
        } else {
            return 0;
        }
    }

    /**
     * Gives enough time for any startup breakpoints to be hit in development time.
     *
     * @param callback
     */
    protected delayedStart(callback: async.ErrorCallback<Error>): void {
        if (process.env.NODE_ENV !== "production") {
            setTimeout(() => callback(), this.getDelayedStartPeriod());
        } else {
            callback();
        }
    }

    /**
     * Loads the environment properties file if applicable. Just call callback if you don't have one.
     *
     * Default: Checks if there is a .env or .properties file in the same process.cwd() or __dirname. If there is one,
     * then loads it using dotenv
     *
     * @param {ErrorCallback<Error>} callback
     */
    protected loadEnvFile(callback: async.ErrorCallback<Error>): void {
        const filenamesToCheck = [
            ".env", "config.env", "configuration.env", ".properties", "config.properties", "configuration.properties"
        ];

        let found: string;
        for (const filenameToCheck of filenamesToCheck) {
            found = FilePathUtils.searchForPath(__dirname, filenameToCheck);
            if (found) {
                break;
            }

            found = FilePathUtils.searchForPath(process.cwd(), filenameToCheck);
            if (found) {
                break;
            }
        }

        if (!found) {
            callback();
        } else {
            try {
                dotenv.config(
                    {
                        path: found
                    }
                );

                callback();
            } catch (e) {
                callback(e);
            }
        }
    }

    /**
     * Creates the express instance.
     */
    protected createExpressInstance(): void {
        this.expressApp = express();
    }

    /**
     * Returns the paths that should be excluded from logging automatically. For example, this could be an array:
     *
     * [
     *  "/excludedFromLogs/",    // excludes everything under /excludedFromLogs/**
     *  "/nestedPath/excluded/"  // excludes everything under /nestedPath/excluded/
     *  "/partial"               // notice there is no ending /, hence both /partial and /partially will be excluded.
     * ]
     *
     * Use this to exclude non-important calls that ping the server very frequently.
     *
     * Note: this method is called by #getPathsToLog(). If you override that function and re-implement it, then this
     * method will never get called.
     *
     * Default: "/excludedFromLogs/"
     *
     * @returns {string[]}
     */
    protected getPathsExcludedFromLog(): string|string[] {
        return "/excludedFromLogs/";
    }

    /**
     * Gets the request paths that need to be logged.
     *
     * Default: everything except paths that belong to /excludedFromLogs/**
     */
    protected getPathsToLog(): RegExp {
        return this.createRegExToExcludePaths(this.getPathsExcludedFromLog());
    }

    /**
     * Initialize server side logging
     */
    protected initializeLogging(): void {
        this.expressApp.use(
            this.getPathsToLog(),
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                /* tslint:disable */
                // add a unique identifier to the request, so that we can identify all log messages
                // that are from the same request
                req["reqId"] = cuid();
                /* tslint:enable */
                next();
            },
            requestLogger()
        );
    }

    /**
     * Sets up the response headers that will be returned for every request.
     */
    protected setupMetadataResponses(): void {
        // Use Helmet to add common headers, see:
        // https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
        this.expressApp.use(helmet());

        // Add headers
        this.expressApp.use(
            (req: express.Request, res: express.Response, next: express.NextFunction): any => {
                // Request methods you wish to allow
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
                // Request headers you wish to allow
                res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
                // Set to true if you need the website to include cookies in the requests sent
                // to the API (e.g. in case you use sessions)
                res.setHeader("Access-Control-Allow-Credentials", "true");
                // Pass to next layer of middleware
                next();
            }
        );

        // TODO: apply security best practices from
        // http://expressjs.com/en/advanced/best-practice-security.html
        this.expressApp.set("trust proxy", "loopback");
        this.expressApp.disable("x-powered-by");
    }

    /**
     * Returns the paths that should be excluded from body parser automatically. For example, this could be an array:
     *
     * [
     *  "/excludedFromBodyParser/",    // excludes everything under /excludedFromBodyParser/**
     *  "/nestedPath/excluded/"  // excludes everything under /nestedPath/excluded/
     *  "/partial"               // notice there is no ending /, hence both /partial and /partially will be excluded.
     * ]
     *
     * Note: this method is called by #getPathsForBodyParser(). If you override that function and re-implement it, then
     * this method will never get called.
     *
     * Default: null
     *
     * @returns {string[]}
     */
    protected getPathsExcludedFromBodyParser(): string|string[] {
        return null;
    }

    /**
     * Gets the paths that will be used for body parser to automatically kick in.
     *
     * Default: all paths are parsed by body-parser.
     */
    protected getPathsForBodyParser(): RegExp {
        return this.createRegExToExcludePaths(this.getPathsExcludedFromBodyParser());
    }

    /**
     * Sets up request preprocessors such as cookie parser, body parser, compression, validator, etc.
     */
    protected setupRequestPreprocessors(): void {
        // compress all responses.
        this.expressApp.use(compression());

        this.expressApp.use(cookieParser());

        // configure app to use bodyParser()
        // this will let us get the data from a POST
        // exclusing the route to graphql
        this.expressApp.use(this.getPathsForBodyParser(), bodyParser.urlencoded({extended: true}));
        this.expressApp.use(this.getPathsForBodyParser(), bodyParser.json());

        this.expressApp.use(expressValidator());
    }

    /**
     * Sets up the express middleware to serve static assets (such as images and documents). Static assets middleware
     * takes precendence over #setupAdditionalMiddleware. Use `this.expressApp` to setup the routes.
     *
     * Order:
     * 1. #setupStaticAssetsMiddleware
     * 2. #setupAdditionalMiddleware
     * 3. #setupPageRenderMiddleware
     *
     * Default: does nothing.
     */
    protected setupStaticAssetsMiddleware(): void {
        // nothing
    }

    /**
     * Sets up express middleware to respond to additional API requests not related to pages. API middleware takes
     * precedence over #setupPageRenderMiddleware(). Use `this.expressApp` to setup the routes.
     *
     * Order:
     * 1. #setupStaticAssetsMiddleware
     * 2. #setupAdditionalMiddleware
     * 3. #setupPageRenderMiddleware
     *
     * Default: does nothing.
     */
    protected setupAPIMiddleware(): void {
        // nothing
    }

    /**
     * Sets up the express middleware to render or respond to page requests from the browser. This is a catch all /*
     * for all the requests. It calls #createPageRenderAction for each request.
     *
     * Order:
     * 1. #setupStaticAssetsMiddleware
     * 2. #setupAdditionalMiddleware
     * 3. #setupPageRenderMiddleware
     *
     * Default: tries to serve all requests that landed on this method by executing a new instance created by
     * #createPageRenderAction(...).
     */
    protected setupPageRenderMiddleware(): void {
        this.expressApp.use(
            "/*",
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                const renderAction = this.createPageRenderAction(req, res, next);
                if (renderAction) {
                    renderAction.execute();
                } else {
                    next();
                }
            }
        );
    }

    /**
     * Creates a page rendering action for the given request and response.
     *
     * @returns {AbstractSkeletosRenderAction}
     */
    protected abstract createPageRenderAction(
        request: express.Request, response: express.Response,
        next: express.NextFunction): RenderActionType;

    /**
     * Sets up the express server.
     */
    protected setupServer(): void {
        if (this.isHttpsEnabled()) {
            this.server = https.createServer(this.getHttpsServerOptions(), this.expressApp);
        } else {
            this.server = http.createServer(this.expressApp);
        }

        this.server.listen(this.getPort(), this.getHost());
    }

    /**
     * Determines whether HTTPS is enabled.
     *
     * Default: false.
     *
     * @returns {boolean}
     */
    protected isHttpsEnabled(): boolean {
        return false;
    }

    /**
     * Returns https server options. Only override if #isHttpsEnabled() returns true.
     *
     * @returns {"https".ServerOptions}
     */
    protected getHttpsServerOptions(): https.ServerOptions {
        return null;
    }

    /**
     * Returns the host on which express should bind itself to.
     *
     * Default: returns null, hence binding to all available hostnames/interfaces.
     *
     * @returns {string}
     */
    protected getHost(): string {
        return null;
    }

    /**
     * Returns the port on which the express server should listen to.
     *
     * @returns {number}
     */
    protected abstract getPort(): number;

    /**
     * The name of the server. The name is useful for printing into log at startup.
     *
     * @returns {string}
     */
    protected abstract getServerName(): string;

    protected doBeforeExecute(): void {
        getDefaultLogger().info("Starting...");
    }

    protected doAfterExecute(err?: Error): void {
        getDefaultLogger().info("Started.");
    }

    private createRegExToExcludePaths(excludedPaths: string|string[]): RegExp {
        let excluded: string = "";
        if (_.isString(excludedPaths)) {
            excluded = "(?!" + excludedPaths + ")";
        } else if (!excludedPaths) {
            // it's an array
            excludedPaths = _.map(excludedPaths, (excludedPath) =>
                _.trimStart(excludedPath, "/").replace(/\//g, "\\/"));
            excluded = "(?!((" + excludedPaths.join(")|(") + ")))";
        }

        const result = "\/(" + excluded + ".)*";
        return new RegExp(result);
    }

}