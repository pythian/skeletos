import _ = require("lodash");
import {ConsoleLogger, ErrorUtil, getDefaultLogger, setDefaultLogger} from "../../core";
import {AbstractInitializeServerAction} from "../../express";
import express = require("express");
import {AbstractHammerpackRenderAction} from "./AbstractHammerpackRenderAction";
import * as serveStatic from "serve-static";
import favicon = require("serve-favicon");
import fs = require("fs");
import path = require("path");
import {HammerpackWebserviceUtil, IHammerpackParameters} from "../../hammerpack";


/**
 * Initializes the express server when using Hammerpack to develop/build.
 */
export abstract class AbstractInitializeHammerpackWebServiceAction
    extends AbstractInitializeServerAction<AbstractHammerpackRenderAction<any, any>> {

    protected hammerpackUtil: HammerpackWebserviceUtil;

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

        hammerpackStartup.resources.staticAssetsPath = "/" + _.trim(this.getStaticResourcesPath(), "/") + "/";

        this.hammerpackUtil = new HammerpackWebserviceUtil(hammerpackStartup);

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
                    this.hammerpackUtil.params.resources.dir
                )
            );
        } else {
            this.expressApp.use(
                "/" + _.trim(staticResourcesPath, "/"),
                express.static(
                    this.hammerpackUtil.params.resources.dir,
                    this.getStaticResourcesConfig()
                )
            );
        }

        const serverPath: string = this.hammerpackUtil.getFilePath("favicon.ico", path);
        if (fs.existsSync(serverPath)) {
            this.expressApp.use(favicon(serverPath));
        }
    }

    protected getPort(): number {
        return this.hammerpackUtil.params.port;
    }

    protected getServerName(): string {
        return this.hammerpackUtil.params.projectName;
    }

}