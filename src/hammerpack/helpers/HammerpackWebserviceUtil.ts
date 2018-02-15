import _ = require("lodash");
import {IHammerpackParameters} from "./IHammerpackParameters";
import {ProcessEnvUtils, UrlUtils} from "../../core";

/**
 * Utilities for dealing with Hammerpack webservice plugin
 */
export class HammerpackWebserviceUtil {

    static BROWSER_GLOBAL_ID: string = "___HAMMERPACK_PARAMS";

    static SINGLETON: HammerpackWebserviceUtil;

    params: IHammerpackParameters;

    /**
     * Initializes Hammerpack parameters using as much information supplied by Hammerpack as possible.
     *
     * Note that calling this function will also set HammerpackUtils#GLOBAL_HAMMERPACK_PARAMS to the params
     * if it is not already set.
     *
     * @param {IHammerpackParameters} params
     */
    constructor(params?: IHammerpackParameters) {
        if (!params) {
            if (typeof window !== "undefined" && window[HammerpackWebserviceUtil.BROWSER_GLOBAL_ID]) {
                params = JSON.parse(_.unescape(window[HammerpackWebserviceUtil.BROWSER_GLOBAL_ID]));
            }
        }

        if (!params || !params.resources || !params.resources.clientFiles) {
            throw new Error("params is incorrect and is likely not supplied by Hammerpack.");
        }

        const fileNames: string[] = params.resources.clientFiles;
        params.resources.jsFiles = [];
        params.resources.cssFiles = [];

        if (fileNames) {
            for (const fileName of fileNames) {
                if (fileName.endsWith(".js")) {
                    params.resources.jsFiles.push(fileName);
                } else if (fileName.endsWith(".css")) {
                    params.resources.cssFiles.push(fileName);
                }
            }
        }

        // ensure we trim the extra / from the URLs.
        params.resources.hotreload = _.trimEnd(params.resources.hotreload, "/") + "/";

        params.enableHttps =
            ProcessEnvUtils.getEnvVarAsBoolean(false, "HAMMERPACK_ENABLE_HTTPS", "ENABLEHTTPS", "ENABLE_HTTPS");
        params.port = ProcessEnvUtils.getEnvVarAsNumber(8080, "PORT", "SERVER_PORT");
        params.host = ProcessEnvUtils.getEnvVarAsString(null, "HOST", "SERVER_HOST");

        // tslint:disable-next-line
        const defaultPublicUrl: string = (params.enableHttps ? "https://" : "http://") +
            (params.host ? params.host : "localhost") +
            ((params.port !== 80 && params.port !== 443) ? ":" + params.port : "");

        params.publicUrl =
            _.trimEnd(ProcessEnvUtils.getEnvVarAsString(defaultPublicUrl, "PUBLICURL", "PUBLIC_URL"), "/") + "/";

        if (!this.params) {
            this.params = params;
        }

        HammerpackWebserviceUtil.SINGLETON = this;
    }

    isServer(): boolean {
        return typeof window === "undefined" ||
            (typeof process !== "undefined" && process.env && process.env.RENDER_ENV === "server");
    }

    isBrowser(): boolean {
        return !this.isServer();
    }

    isProduction(): boolean {
        return (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "production");
    }

    isDevelopment(): boolean {
        return !this.isProduction();
    }

    /**
     * Gets the file path of the resource on the server.
     *
     * @param {string} resourceName
     * @param pathModule this is the `require("path")` that needs to be passed in. We can't require it in this class
     *     because this class can be used in the browser as well.
     * @returns {string}
     */
    getFilePath(resourceName: string, pathModule: any): string {
        if (this.isBrowser()) {
            throw new Error("File paths not available on the browser.");
        }

        if (!this.params) {
            throw new Error("Hammerpack not initialized.");
        }

        return pathModule.resolve(this.params.resources.dir, this.getFolderName(resourceName), resourceName);
    }

    /**
     * Gets the URL of the resource on the server.
     *
     * @param {string} resourceName
     * @returns {string}
     */
    getServerUrl(resourceName: string): string {
        if (!this.params) {
            throw new Error("Hammerpack not initialized.");
        }

        return _.trimEnd(this.params.resources.staticAssetsPath, "/") + "/" +
            UrlUtils.ensureTrailingSlash(this.getFolderName(resourceName)) + resourceName;
    }

    private getFolderName(resourceName: string): string {
        const ext = resourceName.substring(resourceName.lastIndexOf("."));
        switch (ext) {
            case ".jpg":
            case ".jpeg":
            case ".png":
            case ".gif":
            case ".svg":
            case ".ico":
                return this.params.resources.img;
            case ".woff":
            case ".woff2":
            case ".eot":
            case ".ttf":
                return this.params.resources.font;
            default:
                return this.params.resources.misc;
        }
    }
}

declare const window: any;