import _ = require("lodash");
import Url = require("domurl");
import {
    AbstractSkeletosAction,
    AbstractSkeletosState,
    ErrorState,
    getDefaultLogger,
    LoadingState,
    SkeletosTransaction
} from "../../../core";
import {AbstractRouteState, IRouteBuilderInstance, RouteBuilder} from "../../";
import {AbstractRootRouteState} from "../state/AbstractRootRouteState";
import {Request, Response} from "../../../shared-interfaces/ExpressInterfaces";

/**
 * The route action deals with the lifecycle of routes.
 *
 * Use the following table to decide what is happening to a route:
 *
 * oldRoute  |  newRoute  |     action
 * =======================================
 *    x      |     y      | Route updating, perhaps the route's currentRoute changed or some query parameter changed.
 *  null     |     y      | Route is going to be used the first time (route is being mounted)
 *    x      |   null     | Route is no longer used, perhaps the parent container route's currentRoute != route
 *
 *
 * Note that newRootRoute (and newRoute) represents the current state of the route. Modifying this route will modify
 * the URL in your address bar. The oldRootRoute (and oldRoute) is a read-only state for comparison purposes.
 *
 * Additionally, if this action does not complete successfully (i.e. completes with an error), then newRootRoute
 * will be rolled back to oldRootRoute (and hence newRoute will become oldRoute).
 *
 * If you want this action to complete with an error, so that the newRootRoute is rolled back, but you still want to
 * store some state (e.g. an error message) in the db, consider using #getStickyMutableNewRootRouteState()
 */
export abstract class AbstractRouteAction<
    RouteStateType extends AbstractRouteState,
    RootRouteStateType extends AbstractRootRouteState,
    RootStateType extends AbstractSkeletosState=AbstractSkeletosState
    >
    extends AbstractSkeletosAction<RootStateType> {

    /**
     * Represents the old route that will be changed to the newRoute. This is a read-only state.
     *
     * This can be null if the oldRoute did not exist before.
     */
    protected oldRoute: RouteStateType;

    /**
     * Represents the current root route. This is a read-only state.
     */
    protected oldRootRoute: RootRouteStateType;

    /**
     * Represents the new route. This can be null if the newRoute is no longer used.
     */
    protected newRoute: RouteStateType;

    /**
     * Represents the new root route that we are transitioning to. It is also the current state of the route in the db.
     *
     * If you throw an error in completing this action, the newRootRoute will be rolled back to its previous state,
     * the oldRootRoute.
     *
     * Also, you can use this newRootRoute to make further modifications to the current route.
     *
     * If you want to make modifications to the new root route but also want to throw an error in the action (for
     * example, user is unauthorized and you want to make modifications to the route as a result), you can use
     * the attribute #stickyMutableNewRootRouteState.
     */
    protected newRootRoute: RootRouteStateType;

    /**
     * If this action is being executed on the server, then this attribute will hold the Express Request.
     */
    protected serverRequest: Request;

    /**
     * If this action is being executed on the server, then this attribute will hold the Express Response.
     */
    protected serverResponse: Response;

    /**
     * Whether we should redirect to the given URL.
     */
    private redirectToUrl: string;

    constructor(
        oldRoute: RouteStateType, oldRootRoute: RootRouteStateType,
        newRoute: RouteStateType, newRootRoute: RootRouteStateType,
        originalServerRequest: Request,
        originalServerResponse: Response,
        loadingState?: LoadingState,
        errorState?: ErrorState) {
        super(newRootRoute.cursor.root(), loadingState, errorState);

        this.oldRoute = oldRoute;
        this.oldRootRoute = oldRootRoute;

        this.newRoute = new (newRoute as any).constructor(newRoute, this.transaction);
        this.newRootRoute = new (newRootRoute as any).constructor(newRootRoute, this.transaction);

        this.serverRequest = originalServerRequest;
        this.serverResponse = originalServerResponse;
    }

    /**
     * Returns the route builder for this.oldRoute. Will return null if this.oldRoute is null.
     *
     * @returns {IRouteBuilderInstance<RouteStateType extends AbstractRouteState, RootRouteStateType extends
     *     AbstractRootRouteState>}
     */
    protected get routeBuilderUsingOldRoute(): IRouteBuilderInstance<RouteStateType, RootRouteStateType> {
        if (this.oldRoute) {
            return this.rootRouteBuilderUsingOldRoute.skipTo(this.oldRoute);
        } else {
            return null;
        }
    }

    /**
     * Returns the route builder for the new route. Will return null if this.newRoute is null.
     *
     * @returns {IRouteBuilderInstance<RootRouteStateType extends AbstractRootRouteState, RootRouteStateType extends
     *     AbstractRootRouteState>}
     */
    protected get routeBuilderUsingNewRoute(): IRouteBuilderInstance<RouteStateType, RootRouteStateType> {
        if (this.newRoute) {
            return this.rootRouteBuilderUsingNewRoute.skipTo(this.newRoute);
        } else {
            return null;
        }
    }

    /**
     * Returns the route builder for the old root route.
     *
     * @returns {IRouteBuilderInstance<RootRouteStateType extends AbstractRootRouteState, RootRouteStateType extends
     *     AbstractRootRouteState>}
     */
    protected get rootRouteBuilderUsingOldRoute(): IRouteBuilderInstance<RootRouteStateType, RootRouteStateType> {
        return RouteBuilder.clone(this.oldRootRoute);
    }

    /**
     * Returns the route builder using the new root route.
     *
     * @returns {IRouteBuilderInstance<RootRouteStateType extends AbstractRootRouteState, RootRouteStateType extends
     *     AbstractRootRouteState>}
     */
    protected get rootRouteBuilderUsingNewRoute(): IRouteBuilderInstance<RootRouteStateType, RootRouteStateType> {
        return RouteBuilder.clone(this.newRootRoute);
    }

    /**
     * Gets the URL from the new route.
     *
     * @returns {string}
     */
    protected get newUrl(): string {
        return this.rootRouteBuilderUsingNewRoute.buildString();
    }

    /**
     * Gets the URL from the old route.
     *
     * @returns {string}
     */
    protected get oldUrl(): string {
        return this.rootRouteBuilderUsingOldRoute.buildString();
    }

    /**
     * Returns a mutable root route state that can stay mutated even after there is an error in this action that incurs
     * a rollback for the transaction. Hence why the mutation is "sticky".
     *
     * Use this mutable root route state only when you want to modify the root route state before you throw an error,
     * and if you want this mutation to not be part of the rollback of this action's transaction.
     *
     * @returns {RootRouteStateType}
     */
    protected getStickyMutableNewRootRouteState(): RootRouteStateType {
        return new (this.newRootRoute as any).constructor(
            this.newRootRoute,
            new SkeletosTransaction(this.newRootRoute.cursor.db)
        );
    }

    protected doAfterExecute(err?: Error): void {
        // this will rollback skeletos transaction
        super.doAfterExecute(err);

        // now we want to do the redirect
        if (this.redirectToUrl) {
            // if this action has an error, all the mutations it did part of the original transaction are now likely
            // reset, which is why we want to create a new transaction that holds the error details.
            const newStickyRootRoute: RootRouteStateType = this.getStickyMutableNewRootRouteState();

            if (err) {
                if (_.isNil(newStickyRootRoute.pageMetadata.pageResponseCode)) {
                    newStickyRootRoute.pageMetadata.pageResponseCode = 500;
                }
                if (_.isNil(newStickyRootRoute.pageMetadata.errorMessage)) {
                    newStickyRootRoute.pageMetadata.errorMessage = err.message || err.name || err.toString();
                }
            } else {
                if (_.isNil(newStickyRootRoute.pageMetadata.pageResponseCode)) {
                    newStickyRootRoute.pageMetadata.pageResponseCode = 302; // just a regular redirect
                }
            }

            this._doRedirect(newStickyRootRoute);
        }

        this.logFinish();
    }

    protected doBeforeExecute(): void {
        super.doBeforeExecute();

        this.logStart();
    }

    /**
     * Redirect to another route. You can use this in cases where you have hit an error (e.g. unauthorized, 404, etc.).
     *
     * @param {string | IRouteBuilderInstance<any, RootRouteStateType extends AbstractRootRouteState>} redirectUrl
     */
    protected redirect(redirectUrl: string|IRouteBuilderInstance<any, RootRouteStateType>): void {
        if (_.isString(redirectUrl)) {
            this.redirectToUrl = redirectUrl as string;
        } else {
            this.redirectToUrl = (redirectUrl as IRouteBuilderInstance<any, RootRouteStateType>).buildString();
        }
    }

    /**
     * Logs the start of this action. Called from doBeforeExecute(). Only does it on the client side.
     */
    protected logStart(): void {
        if (typeof window !== "undefined") {
            getDefaultLogger().info(this._actionName, {
                req: this.serverRequest
            });
        }
    }

    /**
     * Logs the completion of this action. Called from doAfterExecute().
     */
    protected logFinish(): void {
        if (typeof window !== "undefined") {
            getDefaultLogger().info(this._actionName, {
                started: this._startTime,
                req: this.serverRequest
            });
        }
    }

    private _doRedirect(currentRootRoute: RootRouteStateType): void {
        // for the client.
        const parsedUrl: Url = new Url(this.redirectToUrl);

        if (typeof window !== "undefined") {
            // figure out if we need to just reload the page when the URL doesn't belong to us
            const currentUrl: Url = new Url(window.location.href);
            if (currentUrl.host !== parsedUrl.host) {
                window.location.href = this.redirectToUrl;
                return;
            }
        }

        // for the client.
        RouteBuilder.clone(currentRootRoute).syncFromUrl(this.redirectToUrl);

        // for the server...
        currentRootRoute.pageMetadata.redirectUrl = this.redirectToUrl;
    }

}

declare const window: any;