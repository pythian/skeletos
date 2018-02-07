import _ = require("lodash");
import {ConsoleLogger, ErrorUtil, getDefaultLogger, setDefaultLogger} from "../../core";
import {AbstractInitializeServerAction, ProcessEnvUtils} from "../../express";
import express = require("express");
import {AbstractHammerpackRenderAction} from "./AbstractHammerpackRenderAction";
import * as serveStatic from "serve-static";
import {IHammerpackParameters} from "./IHammerpackParameters";

/**
 * Initializes the express server when using Hammerpack to develop/build.
 */
export abstract class AbstractInitializeHammerpackWebServiceAction
    extends AbstractInitializeServerAction<AbstractHammerpackRenderAction<any, any>> {

    /**
     * The startup parameters are the ones that are initially supplied to us through
     * the bootstrap function.
     */
    protected hammerpackParams: IHammerpackParameters;

    /**
     * Export this function as the default of your server entry point.
     *
     * E.g. in /server/index.ts:
     *
     * export default new MyInitAction().bootstrap;
     */
    // tslint:disable-next-line
    public bootstrap: Function = (hammerpackStartup: IHammerpackParameters): void => {
        setDefaultLogger(new ConsoleLogger());

        getDefaultLogger().info("Received the following Hammerpack parameters:]\n" +
            JSON.stringify(hammerpackStartup, null, 2));

        ErrorUtil.logUncaughtExceptionsAndUnhandledRejections();

        this.initialize(hammerpackStartup);

        this.execute();
    }

    /**
     * Get the relative path of static resources. For example, if you return /resources then
     * all the images required by your client-side code will be under http://domain.com/resources/img/
     *
     * Default: /static/
     *
     * @returns {string}
     */
    protected getStaticResourcesPath(): string {
        return "/static/";
    }

    /**
     * Returns the configuration for the static resources. Allows expiration of static resources after a year.
     *
     * @returns {serveStatic.ServeStaticOptions}
     */
    protected getStaticResourcesConfig(): serveStatic.ServeStaticOptions {
        const oneYear: number = 365 * 24 * 60 * 60 * 1000;
        return {
            maxAge: oneYear
        };
    }

    /**
     * Override to serve static assets built from hammerpack webservice.
     */
    protected setupStaticAssetsMiddleware(): void {
        super.setupStaticAssetsMiddleware();

        const staticResourcesPath = this.getStaticResourcesPath();

        if (!staticResourcesPath) {
            this.expressApp.use(
                express.static(
                    this.hammerpackParams.resources.dir
                )
            );
        } else {
            this.expressApp.use(
                "/" + _.trim(staticResourcesPath, "/"),
                express.static(
                    this.hammerpackParams.resources.dir,
                    this.getStaticResourcesConfig()
                )
            );
        }
    }

    protected getPort(): number {
        return this.hammerpackParams.port;
    }

    protected getServerName(): string {
        return this.hammerpackParams.projectName;
    }

    private initialize(params: IHammerpackParameters): void {
        if (!params || !params.resources || !params.resources.clientFiles) {
            throw new Error("params is incorrect and is likely not supplied by Hammerpack.");
        }

        this.hammerpackParams = params;
        const fileNames: string[] = this.hammerpackParams.resources.clientFiles;
        this.hammerpackParams.resources.jsFiles = [];
        this.hammerpackParams.resources.cssFiles = [];

        if (fileNames) {
            for (const fileName of fileNames) {
                if (fileName.endsWith(".js")) {
                    this.hammerpackParams.resources.jsFiles.push(fileName);
                } else if (fileName.endsWith(".css")) {
                    this.hammerpackParams.resources.cssFiles.push(fileName);
                }
            }
        }

        // ensure we trim the extra / from the URLs.
        this.hammerpackParams.resources.hotreload = _.trimEnd(this.hammerpackParams.resources.hotreload, "/") + "/";

        this.hammerpackParams.enableHttps =
            ProcessEnvUtils.getEnvVarAsBoolean(false, "HAMMERPACK_ENABLE_HTTPS", "ENABLEHTTPS", "ENABLE_HTTPS");
        this.hammerpackParams.port = ProcessEnvUtils.getEnvVarAsNumber(8080, "PORT", "SERVER_PORT");
        this.hammerpackParams.host = ProcessEnvUtils.getEnvVarAsString(null, "HOST", "SERVER_HOST");

        // tslint:disable-next-line
        const defaultPublicUrl: string = (this.hammerpackParams.enableHttps ? "https://" : "http://") +
            (this.hammerpackParams.host ? this.hammerpackParams.host : "localhost") +
            ((this.hammerpackParams.port !== 80 && this.hammerpackParams.port !== 443) ? ":" + this.hammerpackParams.port : "");

        this.hammerpackParams.publicUrl =
            _.trimEnd(ProcessEnvUtils.getEnvVarAsString(defaultPublicUrl, "PUBLICURL", "PUBLIC_URL"), "/") + "/";
    }

}