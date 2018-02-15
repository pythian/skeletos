import _ = require("lodash");
import history = require("history");
import {
    AbstractAction,
    AbstractSkeletosState,
    ConsoleLogger,
    getDefaultLogger,
    ISkeletosCommand,
    setDefaultLogger,
    SkeletosCursor
} from "../../../core";
import {SkeletosWebRouterConstants} from "../../helpers/SkeletosWebRouterConstants";
import {AbstractRootRouteState, RouteBuilder} from "../../";
import {HammerpackWebserviceUtil} from "../../../hammerpack";

/**
 * An abstract action that allows you to use Skeletos and skeletos-web-router and turn your application into a Single
 * Page Application.
 */
export abstract class AbstractInitializeBrowserAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractAction {

    /**
     * The corresponding cursor for #rootState.
     */
    protected rootCursor: SkeletosCursor;

    /**
     * The root state that we created from deserializing the serialized state stored in window.
     */
    protected rootState: RootStateType;

    /**
     * The original Console handler before we hook into it.
     */
    protected oldConsoleHandlers: { [name: string]: IConsoleHandler } = {};

    /**
     * The HammerpackUtils for things like figuring out static resource paths.
     */
    protected hammerpackUtil: HammerpackWebserviceUtil;

    /**
     * An instance of the History object to listen and change URL state.
     */
    protected browserHistory: history.History;

    /**
     * Use this to compare the old route and new changed route on Skeletos state changes.
     */
    private oldRootRouteState: RootRouteStateType;

    /**
     * Use this to compare the hash of old route and new changed route on Skeletos state changes.
     */
    private oldRootRouteStateFastCompare: RootRouteStateType;

    /**
     * Use this to compare the old URL and the new URL on URL History changes.
     */
    private oldLocation: history.Location;


    constructor() {
        super();
        if (typeof window === "undefined") {
            throw new Error(
                "This class can only be imported on the browser. Make sure you have imported this class from your " +
                "bootstrapping client-only code.");
        }
    }

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionSynchronously(this.hookConsole),
            this.callFunctionSynchronously(this.setupLogger),
            this.callFunctionSynchronously(this.deserializeSkeletosState),
            this.callFunctionSynchronously(this.deserializeHammerpack),
            this.callFunctionSynchronously(this.initializeLocale),
            this.callFunctionSynchronously(this.initializeRouting),
            this.callFunctionSynchronously(this.doRender),
        ];
    }

    /**
     * Hooks the console so that every time there is an error or a warning in the console, you have the opportunity
     * to display the error somewhere else or to even send it back to the server or to analytics.
     */
    protected hookConsole(): void {
        this.doHookConsole("error", this.onConsoleError.bind(this));
        this.doHookConsole("warn", this.onConsoleWarning.bind(this));
    }

    /**
     * Sets up the default logger.
     *
     * Default: uses ConsoleLogger. Note that all errors and warnings output in the console can also be hooked
     * separately using onConsoleError() and onConsoleWarning().
     */
    protected setupLogger(): void {
        setDefaultLogger(new ConsoleLogger());
    }

    /**
     * What to do when there is an error.
     *
     * @param message
     * @param optionalParams
     */
    protected onConsoleError(message?: any, ...optionalParams: any[]): void {
        // do nothing
    }

    /**
     * What to do when there is a warning.
     *
     * @param message
     * @param optionalParams
     */
    protected onConsoleWarning(message?: any, ...optionalParams: any[]): void {
        // do nothing
    }

    /**
     * Deserializes the Skeletos state that is stored in window on page load/hot-reload.
     */
    protected deserializeSkeletosState(): void {
        this.rootCursor = new SkeletosCursor(true);
        this.rootState = this.createRootState(this.rootCursor);

        if (window[SkeletosWebRouterConstants.SKELETOS_DEHYDRATED_STATE_GLOBAL_ID]) {
            this.rootCursor.db.deserialize(
                _.unescape(window[SkeletosWebRouterConstants.SKELETOS_DEHYDRATED_STATE_GLOBAL_ID]));

            const rootRouteState = this.getRootRouteState(this.rootState);
            if (rootRouteState && !_.isNil(rootRouteState.pageMetadata.errorMessage)) {
                getDefaultLogger().error(rootRouteState.pageMetadata.errorMessage);
            }
        }
    }

    /**
     * Deserializes and stores the hammerpack params in #hammerpackUtil.
     */
    protected deserializeHammerpack(): void {
        if (window[HammerpackWebserviceUtil.BROWSER_GLOBAL_ID]) {
            this.hammerpackUtil = new HammerpackWebserviceUtil();
        }
    }

    /**
     * Initializes the locale. By default, doesn't do anything.
     */
    protected initializeLocale(): void {
        // nothing
    }

    /**
     * Initializes client-side routing. This gives you the ability to act as a Single Page Application.
     */
    protected initializeRouting(): void {
        if (window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF]) {
            window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF]();
        }

        const historyOptions: history.BrowserHistoryBuildOptions = {
            basename: ""
        };

        this.browserHistory = history.createBrowserHistory(historyOptions);

        // create a state for the route to compare hashes for later.
        this.oldRootRouteStateFastCompare = this.getRootRouteState(this.rootState);
        // save a copy of the route state for later comparison.
        this.oldRootRouteState = RouteBuilder.clone(this.oldRootRouteStateFastCompare).doNotResetChildRoutes().build();

        // we don't need to keep track of an unregister Skeletos db listener on hot reloads because the entire DB
        // is replaced and everything related to it will be GC'ed.
        this.rootCursor.db.addListener(this.doStateChange.bind(this));

        window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF] = this.browserHistory.listen(this.doUrlChange.bind(this));

        this.browserHistory.block((location: history.Location, action: history.Action): string | false | void => {
            return this.getLeavePagePrompt(
                location,
                RouteBuilder.clone(this.oldRootRouteState).syncFromUrl(this.locationToString(location)).build(),
                this.oldRootRouteState, this.rootState
            );
        });
    }

    /**
     * If you want to block the page from transitioning to another page, then return a string -- a question for the
     * user that they can say yes or no to -- so as to allow or prevent the user from leaving the page.
     *
     * For example, "You have unsaved changes, which you will lose if you navigate away from this page Are you sure you
     * want to navigate away from this page?"
     *
     * If you want to block the page from transitioning without a string, return false explicitly.
     *
     * If you do not want to block the page from transitioning, do not return anything, or return null, or return undefined.
     *
     * Default: returns null.
     *
     * @param {Location} targetLocation
     * @param {RootRouteStateType} targetRootRouteState
     * @param {RootRouteStateType} currentRootRouteState
     * @returns {string | false | void | null}
     */
    protected getLeavePagePrompt(
        targetLocation: history.Location, targetRootRouteState: RootRouteStateType,
        currentRootRouteState: RootRouteStateType,
        currentRootState: RootStateType): string | false | void {
        return null;
    }

    /**
     * What happens where this is a change in the URL? Use this to, for example, add hooks into Google Analytics.
     *
     * Default: changes the document title based on `#getRootRouteState(..).pageMetadata.title`
     *
     * @param {Location} location
     */
    protected onUrlChange(
        location: history.Location,
        currentRootRouteState: RootRouteStateType,
        oldRootRouteState: RootRouteStateType): void {
        if (currentRootRouteState.pageMetadata.title) {
            document.title = currentRootRouteState.pageMetadata.title;
        }
    }

    /**
     * Renders the page.
     *
     * @param {RootStateType} rootState
     * @param {RootRouteStateType} rootRouteState
     */
    protected abstract render(rootState: RootStateType, rootRouteState: RootRouteStateType): void;

    /**
     * What to do upon hot reload. Typically you would want to re-render your page.
     *
     * Default: calls `#render()`
     */
    protected onHotModuleReload(): void {
        this.render(this.rootState, this.getRootRouteState(this.rootState));
    }

    /**
     * What to do before the hot-reload is going to be reloaded. Typically, we would want to save any client state
     * somewhere then reload that state when we are reloaded.
     */
    public onBeforeHotModuleReload(): void {
        // because the entire client script will be reloaded, we need to save the current skeletos state so we can
        // reload it later.
        if (this.rootState) {
            window[SkeletosWebRouterConstants.SKELETOS_DEHYDRATED_STATE_GLOBAL_ID] =
                _.escape(this.rootState.cursor.db.serialize());
        }

        // restore the old console handlers
        _.forEach(this.oldConsoleHandlers, (value: IConsoleHandler, messageType: string) => {
            window.console[messageType] = value;
        });

        this.oldConsoleHandlers = {};
    }

    /**
     * Creates a root state using the given cursor.
     *
     * @param {SkeletosCursor} rootCursor
     * @returns {RootStateType}
     */
    protected abstract createRootState(rootCursor: SkeletosCursor): RootStateType;

    /**
     * Gets the root route state from the root state.
     *
     * @param {RootStateType} rootState
     * @returns {RootRouteStateType}
     */
    protected abstract getRootRouteState(rootState: RootStateType): RootRouteStateType;

    protected doBeforeExecute(): void {
        // nothing
    }

    protected doAfterExecute(err?: Error): void {
        // nothing
    }

    private doHookConsole(messageType: string, handler: IConsoleHandler): any {
        if (typeof console === "undefined") {
            return;
        }

        if (window.console[messageType]) {
            this.oldConsoleHandlers[messageType] = window.console[messageType];
        }

        // tslint:disable-next-line
        const me = this;
        window.console[messageType] = function(message?: any, ...optionalParams: any[]): void {
            const params: any[] = [].slice.call(arguments);
            handler.apply(me, params);

            if (me.oldConsoleHandlers[messageType]) {
                return me.oldConsoleHandlers[messageType].apply(this, params);
            }
        };
    }

    private doStateChange(): void {
        const newRootRouteState = this.getRootRouteState(this.rootState);

        if (!newRootRouteState.isEqualsTo(this.oldRootRouteStateFastCompare)) {

            if (newRootRouteState.changeUrlToReflectCurrentState) {
                newRootRouteState.changeUrlToReflectCurrentState = false;

                const newPath = RouteBuilder.clone(newRootRouteState).doNotResetChildRoutes().buildString();

                if (this.locationToString(this.browserHistory.location) !== newPath) {
                    this.browserHistory.push(newPath);
                }
            }

            this.oldRootRouteStateFastCompare = newRootRouteState;
        }
    }

    private doUrlChange(location: history.Location): void {
        const isSameLoc: boolean = location && this.oldLocation &&
            // ensure the paths are the same
            this.oldLocation.pathname === location.pathname &&
            // ensure the query is the same
            _.isEqual(this.oldLocation.search, location.search);

        if (!isSameLoc) {

            const newUrl = this.locationToString(location);

            const copyOfOldRoute = RouteBuilder
                .clone(this.oldRootRouteState).doNotResetChildRoutes().build();

            const routeBuilder = RouteBuilder
                .clone(this.oldRootRouteState);

            // change the old route and location for comparison for next time.
            this.oldRootRouteState = routeBuilder.syncFromUrl(newUrl).build();
            this.oldLocation = location;

            routeBuilder
                .merge(this.getRootRouteState(this.rootState))
                .then(() => {
                    getDefaultLogger().info("Navigated to: " + newUrl);

                    const newRouteState = this.getRootRouteState(this.rootState);

                    this.onUrlChange(location, copyOfOldRoute, newRouteState);
                })
                .catch((error: Error) => {
                    getDefaultLogger().error(error);
                });
        }
    }

    private locationToString(location: history.Location): string {
        let retVal: string = "";
        if (location) {
            if (location.pathname) {
                retVal = location.pathname;
            }

            if (location.search) {
                retVal += location.search;
            }

            if (location.hash) {
                retVal += location.hash;
            }
        }

        return retVal;
    }

    private doRender(): void {
        this.render(this.rootState, this.getRootRouteState(this.rootState));
    }
}

export type IConsoleHandler = (message?: any, ...optionalParams: any[]) => void;

declare const window: any;
declare const document: any;
const HISTORY_LISTENER_UNREGISTER_CALLBACK_REF: string = "___HISTORY_LISTENER_UNREGISTER_CALLBACK_REF";