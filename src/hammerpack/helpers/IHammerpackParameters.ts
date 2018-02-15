/**
 * Represents Hammerpack parameters. Some of these come directly from the parameters that
 * the startup Hammerpack script supplies. Others are derived.
 */
export interface IHammerpackParameters {
    resources: {
        /**
         * The absolute path of the resources folder.
         */
        dir: string;

        /**
         * The relative URL where the static assets are located on the server.
         */
        staticAssetsPath: string;

        /**
         * The URL of the hot reload server.
         */
        hotreload: string;

        /**
         * The name of the images resources folder
         */
        img: string;

        /**
         * The name of the font resources folder
         */
        font: string;

        /**
         * The name of the misc resources folder
         */
        misc: string;

        /**
         * All the js and css files.
         */
        clientFiles: string[];

        /**
         * The paths of JS files.
         */
        jsFiles?: string[];

        /**
         * The paths of the CSS files
         */
        cssFiles?: string[];
    };

    /**
     * The build ID as defined in the hammerpack config file.
     */
    buildId: string;

    /**
     * The type of the Hammerpack task (develop or build or test).
     */
    taskType: string;

    /**
     * The name of the project.
     */
    projectName: string;

    /**
     * Whether to enable HTTPS.
     */
    enableHttps: boolean;

    /**
     * The host the server should bind to.
     */
    host: string;

    /**
     * The port the server should run on.
     */
    port: number;

    /**
     * The public URL of the server.
     */
    publicUrl: string;
}