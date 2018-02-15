import _ = require("lodash");
import {
    AbstractSkeletosPromiseAction, ClassTypeInfo, ErrorUtil, ILoadingStateToReset, ISkeletosCommand,
    ResetLoadingStatesAction
} from "../../core";
import {AbstractRootRouteState} from "../extendible/state/AbstractRootRouteState";
import {Request, Response} from "../../shared-interfaces/ExpressInterfaces";
import {AbstractRouteState, IRouteStateClassInfo} from "../";
import {AbstractRouteAction} from "../extendible/actions/AbstractRouteAction";
import {ROUTESTATE_CLASS_KEY} from "../base/IRouteStateClassInfo";

/**
 * Runs all the onRoute** actions across all the RouteStates, and returns a promise that is resolved once these actions
 * have been run.
 */
export class FireRouteUpdateAction extends AbstractSkeletosPromiseAction<void> {

    private currentRootRouteState: AbstractRootRouteState;
    private oldRootRouteState: AbstractRootRouteState;

    private originalServerRequest: Request;
    private originalServerResponse: Response;

    private loadingStatesToReset: ILoadingStateToReset[];

    constructor(
        currentRootRouteState: AbstractRootRouteState, oldRootRouteState?: AbstractRootRouteState,
        originalServerRequest?: Request, originalServerResponse?: Response) {
        super(currentRootRouteState.cursor.root());

        this.currentRootRouteState = currentRootRouteState;

        this.oldRootRouteState = oldRootRouteState;
        this.originalServerRequest = originalServerRequest;
        this.originalServerResponse = originalServerResponse;

        this.determineLoadingStates();
    }

    protected getCommands(): ISkeletosCommand[] | object {
        const seriesCmds: Array<AbstractRouteAction<any, any>> = [];
        const parallelCmds: Array<AbstractRouteAction<any, any>> = [];

        let oldRoute: AbstractRouteState = this.oldRootRouteState;
        let newRoute: AbstractRouteState = this.currentRootRouteState;

        let continueFromBreakOffPoint: boolean = !!((oldRoute && !newRoute) || (!oldRoute && newRoute));
        let treeIsDifferent: boolean = false;
        let canRenderServerSide: boolean = true;

        while (oldRoute && newRoute) {
            // check if the oldRoute and newRoute are any different.
            if ((oldRoute as any).constructor !== (newRoute as any).constructor) {
                throw new Error("An error occurred while comparing new and old routes. The old route " +
                    ErrorUtil.getDebugName(oldRoute) + " is not the same type as the new route " +
                    ErrorUtil.getDebugName(newRoute));
            }

            // first check for 404 for an early exit
            const notFoundCmd: ISkeletosCommand = this.get404Command(newRoute);
            if (notFoundCmd) {
                return [notFoundCmd];
            }

            if (!newRoute.canRenderServerSide()) {
                canRenderServerSide = false;
            }

            if (this.areDifferent(oldRoute, newRoute)) {
                this.addCommands(oldRoute, newRoute, seriesCmds, parallelCmds, true);
                treeIsDifferent = true;
            } else {
                this.addCommands(oldRoute, newRoute, seriesCmds, parallelCmds, false);
            }

            if (!_.isEqual(oldRoute.currentRoute, newRoute.currentRoute)) {
                continueFromBreakOffPoint = true;
                treeIsDifferent = true;
                break;
            } else {
                oldRoute = oldRoute.getCurrentRouteState();
                newRoute = newRoute.getCurrentRouteState();
            }
        }

        if (continueFromBreakOffPoint) {
            if (oldRoute) {
                oldRoute = oldRoute.getCurrentRouteState();
                while (oldRoute) {
                    this.addCommands(oldRoute, null, seriesCmds, parallelCmds, true);
                    oldRoute = oldRoute.getCurrentRouteState();
                }
            }

            if (newRoute) {
                newRoute = newRoute.getCurrentRouteState();
                while (newRoute) {
                    // first check for 404 for an early exit
                    const notFoundCmd: ISkeletosCommand = this.get404Command(newRoute);
                    if (notFoundCmd) {
                        return [notFoundCmd];
                    }

                    this.addCommands(null, newRoute, seriesCmds, parallelCmds, true);

                    if (!newRoute.canRenderServerSide()) {
                        canRenderServerSide = false;
                    }
                    
                    newRoute = newRoute.getCurrentRouteState();
                }
            }
        }

        this.currentRootRouteState.pageMetadata.canRenderServerSide = canRenderServerSide;

        if (treeIsDifferent) {
            // we have to execute both series and parallel commands now. Will construct a single async.auto config
            // object and let async figure out the order of execution.
            const commands: object = {};
            const allCommands: string[] = [];
            
            // add all the parallel commands first so that the browser selects them to be executed first if they are ajax.
            // This would eliminate any race conditions in the application code early in case the parallel commands
            // are mistakenly dependent on some series command.
            if (parallelCmds.length > 0) {
                for (let i: number = 0; i < parallelCmds.length; i++) {
                    const routeName: string = "parallel" + i;
                    allCommands.push(routeName);
                    commands[routeName] = this.callAnotherAction(parallelCmds[i]);
                }
            }
            
            if (seriesCmds.length > 0) {
                let lastDependency: string;
                for (let i: number = 0; i < seriesCmds.length; i++) {
                    const routeName: string = "series" + i;
                    allCommands.push(routeName);

                    if (lastDependency) {
                        commands[routeName] = [lastDependency, this.callAnotherAction(seriesCmds[i])];
                    } else {
                        commands[routeName] = this.callAnotherAction(seriesCmds[i]);
                    }
                    
                    lastDependency = routeName;
                }
            }

            if (this.loadingStatesToReset && this.loadingStatesToReset.length > 0) {
                commands[LOADING_STATES_TO_RESET_COMMAND_NAME] = [
                    ...allCommands,
                    this.callAnotherAction(new ResetLoadingStatesAction(this.rootCursor, this.loadingStatesToReset))
                ];
            }

            return commands;
        } else {
            return [];
        }
    }

    /**
     * Figures out if an oldRoute is any different than the newRoute.
     * 
     * @param {AbstractRouteState} oldRoute
     * @param {AbstractRouteState} newRoute
     * @returns {boolean}
     */
    protected areDifferent(oldRoute: AbstractRouteState, newRoute: AbstractRouteState): boolean {
        if (!_.isEqual(oldRoute.currentRoute, newRoute.currentRoute)) {
            return true;
        }

        // go through all the query parameters
        const routeClassInfo: IRouteStateClassInfo = ClassTypeInfo.maybeGetExtension(oldRoute, ROUTESTATE_CLASS_KEY);
        if (routeClassInfo) {
            for (const queryParamPropKey of _.values(routeClassInfo.queryParams)) {
                if (!_.isEqual(oldRoute[queryParamPropKey], newRoute[queryParamPropKey])) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * This method gets called when the requested URL cannot be synchronized to the route state tree, i.e. a 404.
     *
     * The routeThatCannotBeFound parameter has a currentRoute string that is not null, yet the
     * routeThatCannotBeFound.getCurrentRouteState() returns null.
     *
     * @param {AbstractRouteState} routeThatCannotBeFound
     */
    protected do404(routeThatCannotBeFound: AbstractRouteState): void {
        this.currentRootRouteState.pageMetadata.pageResponseCode = 404;
    }

    /**
     * Checks if there is a 404 at the current route and if there is then returns a 404 command to use.
     *
     * @param {AbstractRouteState} newRoute
     * @returns {ISkeletosCommand}
     */
    private get404Command(newRoute: AbstractRouteState): ISkeletosCommand {
        if (!_.isNil(newRoute.currentRoute) && !newRoute.getCurrentRouteState()) {
            return this.callFunctionSynchronously(() => {
                this.do404(newRoute);
            });
        }

        return null;
    }

    /**
     * Adds the onRoute* commands to the array of commands to be run in series and in parallel respectively.
     * 
     * @param {AbstractRouteState} oldRoute
     * @param {AbstractRouteState} newRoute
     * @param {AbstractRouteAction<any, any>[]} seriesCmds
     * @param {AbstractRouteAction<any, any>[]} parallelCmds
     * @param {boolean} doAddNonTreeCommands
     */
    private addCommands(
        oldRoute: AbstractRouteState,
        newRoute: AbstractRouteState,
        seriesCmds: Array<AbstractRouteAction<any, any>>,
        parallelCmds: Array<AbstractRouteAction<any, any>>,
        doAddNonTreeCommands: boolean) {

        const someRoute: AbstractRouteState = oldRoute ? oldRoute : newRoute;

        if (doAddNonTreeCommands) {

            const routeUpdatedSyncAction = someRoute.onRouteUpdatedSync();
            const routeUpdatedAsyncAction = someRoute.onRouteUpdatedAsync();

            if (routeUpdatedSyncAction) {
                seriesCmds.push(new (routeUpdatedSyncAction as any)(oldRoute, this.oldRootRouteState, newRoute,
                    this.currentRootRouteState, this.originalServerRequest, this.originalServerResponse,
                    this._loadingState, this._errorState
                ));
            }

            if (routeUpdatedAsyncAction) {
                parallelCmds.push(new (routeUpdatedAsyncAction as any)(oldRoute, this.oldRootRouteState, newRoute,
                    this.currentRootRouteState, this.originalServerRequest, this.originalServerResponse,
                    this._loadingState, this._errorState
                ));
            }
        }

        const routeTreeUpdatedSyncAction = someRoute.onRouteTreeUpdatedSync();
        const routeTreeUpdatedAsyncAction = someRoute.onRouteTreeUpdatedAsync();
        if (routeTreeUpdatedSyncAction) {
            seriesCmds.push(new (routeTreeUpdatedSyncAction as any)(oldRoute, this.oldRootRouteState, newRoute,
                this.currentRootRouteState, this.originalServerRequest, this.originalServerResponse,
                this._loadingState, this._errorState
            ));
        }
        if (routeTreeUpdatedAsyncAction) {
            parallelCmds.push(new (routeTreeUpdatedAsyncAction as any)(oldRoute, this.oldRootRouteState, newRoute,
                this.currentRootRouteState, this.originalServerRequest, this.originalServerResponse,
                this._loadingState, this._errorState
            ));
        }
    }

    private determineLoadingStates(): void {
        const routes: AbstractRouteState[] = [this.currentRootRouteState];
        let currentIndex: number = 0;
        this.loadingStatesToReset = [];

        /**
         * Go through the entire route hierarchy and determine which routes are currently in a loading state. Save a
         * reference to that loading state and the current value of its loading count. This value is important because
         * it's the exact amount that we will decrease the loading count by after all the route actions has completed.
         */
        while (currentIndex < routes.length) {
            const currentRoute: AbstractRouteState = routes[currentIndex];
            currentIndex++;

            // Record a ref to the loading state and its current loading count value
            if (currentRoute.loadingCursor.exists() && currentRoute.loading.isLoading()) {
                this.loadingStatesToReset.push({
                    loadingState: currentRoute.loading,
                    amountToDecrement: currentRoute.loading.loadingCount
                });
            }

            for (const key in currentRoute) {
                if (currentRoute[key] instanceof AbstractRouteState) {
                    routes.push(currentRoute[key]);
                }
            }
        }
    }
}

const LOADING_STATES_TO_RESET_COMMAND_NAME: string = "___LOADING_STATES_TO_RESET_ACTION";