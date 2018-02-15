// tslint:disable-next-line
/// <reference path="../../../typings/custom/express-flash.d.ts"/>
// tslint:disable-next-line
/// <reference types="express-session"/>

import _ = require("lodash");
import async = require("async");
import express = require("express");
import {
    AbstractPromiseAction,
    AbstractSkeletosState,
    ErrorUtil,
    getDefaultLogger,
    ISkeletosCommand,
    SkeletosCursor,
    SkeletosTransaction
} from "../../core";
import {AbstractRootRouteState, AbstractRouteState, FireRouteUpdateAction, RouteBuilder} from "../../web-router";

/**
 * An action that you can use to render a page for a request.
 */
export abstract class AbstractSkeletosRenderAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractPromiseAction<void> {

    protected req: express.Request;
    protected res: express.Response;
    protected next: express.NextFunction;

    protected requestedUrl: string;

    protected rootWriteableCursor: SkeletosCursor;
    protected rootState: RootStateType;
    protected rootRouteState: RootRouteStateType;

    private responseSent: boolean;
    private routingError: Error;

    constructor(req: express.Request, res: express.Response, next: express.NextFunction) {
        super();
        this.req = req;
        this.requestedUrl = this.req.originalUrl || this.req.url;

        this.res = res;
        this.next = next;

        this.rootWriteableCursor = new SkeletosCursor(true);

        this.rootState = this.createRootState(this.rootWriteableCursor);
        if (!this.rootState || !(this.rootState instanceof AbstractSkeletosState)) {
            throw new Error("createRootState must return a valid AbstractSkeletosState.");
        }

        this.rootRouteState = this.getRootRouteStateFromRootState(this.rootState);
        if (!this.rootRouteState || !(this.rootRouteState instanceof AbstractRouteState)) {
            throw new Error("getRouteStateFromRootState must return a valid AbstractRouteState.");
        }
    }

    /**
     * Returns a read-only version of the root state that you can use to render your Skeletos components.
     *
     * (Reminder: Skeletos components require read-only states.)
     *
     * @returns {RootStateType}
     */
    protected get readOnlyRootState(): RootStateType {
        return new (this.rootState as any).constructor(this.rootState, null);
    }

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionSynchronously(this.initializeDefaultHeaders),
            this.callFunctionSynchronously(this.initializePageMetadata),
            this.callFunctionAsynchronously(this.initializeBeforeRouting),
            this.callFunctionAsynchronously(this.callRouteActions),
            this.callFunctionAsynchronously(this.initializeAfterRoutingBeforeRendering),
            this.callFunctionAsynchronously(this.respond),
        ];
    }

    /**
     * Initializes the default headers for the response.
     */
    protected initializeDefaultHeaders(): void {
        this.res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        this.res.setHeader("Pragma", "no-cache");
        this.res.setHeader("Expires", "0");
    }

    /**
     * Initializes data in the PageMetaData state.
     */
    protected initializePageMetadata(): void {
        this.rootRouteState.pageMetadata.userAgent = this.req.get(HEADER_USER_AGENT);

        // save any redirect URLs for logging in before redirecting so that the next time
        // a login request comes in we know where to go after successful login.
        if (this.req.session && this.req.session[URL_BEFORE_REDIRECT] &&
            !this.rootRouteState.pageMetadata.urlBeforeRedirect) {
            this.rootRouteState.pageMetadata.urlBeforeRedirect = this.req.session[URL_BEFORE_REDIRECT];
        } else {
            this.rootRouteState.pageMetadata.urlBeforeRedirect = this.requestedUrl;
        }
    }

    /**
     * Override to provide any initialization that needs to be done before the route actions are run.
     *
     * @param {ErrorCallback<Error>} callback
     */
    protected initializeBeforeRouting(callback: async.ErrorCallback<Error>): void {
        // blank
        callback();
    }

    /**
     * Initializes the routing by merging the requested URL into the root route and calling all the route actions.
     *
     * @param {ErrorCallback<Error>} callback
     */
    protected callRouteActions(callback: async.ErrorCallback<Error>): void {
        // execute this action in a separate skeletos transaction because we don't want to rollback whatever
        // we have done so far in the previous actions. This sync action does redirects and unauthorization error
        // callbacks which we don't want to interfere with the render call on the server.
        const rootRouteStateWithNewTransaction: RootRouteStateType = new (this.rootRouteState as any).constructor(
            this.rootRouteState, new SkeletosTransaction(this.rootRouteState.cursor.db));

        RouteBuilder.clone(
            rootRouteStateWithNewTransaction, this.req as any, this.res as any,
            this.getFireRouteUpdateActionClass()
        ).syncFromUrl(this.requestedUrl).merge()
            .then(() => callback())
            .catch((err?: Error) => {
                this.routingError = err;
                callback(err);
            });
    }

    /**
     * Override to provide any initialization that needs to be done after the route actions are run but before the
     * rendering takes place.
     *
     * @param {ErrorCallback<Error>} callback
     */
    protected initializeAfterRoutingBeforeRendering(callback: async.ErrorCallback<Error>): void {
        // blank
        callback();
    }

    /**
     *
     * @param {ErrorCallback<Error>} callback
     */
    protected respond(callback: async.ErrorCallback<Error>): void {
        let serverRendering: string;

        try {
            serverRendering = this.renderHtml();
            this.sendResponse(serverRendering);
            callback();
        } catch (e) {
            getDefaultLogger().error(ErrorUtil.customize(e, ErrorUtil.getDebugName(this) +
                ": An error occurred responding to an express request."), this.req);

            this.rootRouteState.pageMetadata.errorMessage = ErrorUtil.getPrintableError(e);
            this.rootRouteState.pageMetadata.pageResponseCode = 500;
        }
    }

    /**
     * Renders the HTML that needs to be sent back to the client. Use this to either render server-side or to include
     * just the scripts that would render on the client side.
     *
     * @returns {string}
     */
    protected abstract renderHtml(): string;

    /**
     * In case there is an unexpected error (such as one that is not raised by the application and is not stored in the
     * PageMetadata state), an error needs to be rendered on the client.
     *
     * An error **may** be supplied as an argument. You can also use `this.rootRouteState.pageMetadata.errorMessage`
     * for more details.
     *
     * @returns {string}
     */
    protected abstract renderErrorHtml(error?: Error): string;

    /**
     * Create a new RootState using the supplied write cursor.
     * @returns {RootStateType}
     */
    protected abstract createRootState(cursor: SkeletosCursor): RootStateType;

    /**
     * Gets the top-level Route state from the root state that the request URL can be synced into.
     *
     * @param {RootStateType} rootState
     * @returns {RouteStateType}
     */
    protected abstract getRootRouteStateFromRootState(rootState: RootStateType): RootRouteStateType;

    /**
     * Returns a read-only root state for usage in rendering components.
     *
     * @returns {RootStateType}
     */
    protected getReadOnlyRootState(): RootStateType {
        return new (this.rootState as any).constructor(this.rootState, null);
    }

    /**
     * Gets the action class for FireRouteUpdateAction, in case you have customized it.
     *
     * @returns {typeof FireRouteUpdateAction}
     */
    protected getFireRouteUpdateActionClass(): typeof FireRouteUpdateAction {
        return FireRouteUpdateAction;
    }

    /**
     * Sends the given response back to the client. The details in `this.rootRouteState.pageMetadata` are used. For
     * example, the `this.rootRouteState.pageMetadata.pageResponseCode` or
     * `this.rootRouteState.pageMetadata.errorMessage` is used.
     *
     * @param {string} response
     */
    protected sendResponse(response: string = "") {
        let pageResponseCode: number = 200;
        if (!_.isNil(this.rootRouteState.pageMetadata.pageResponseCode)) {
            pageResponseCode = this.rootRouteState.pageMetadata.pageResponseCode;
        }

        if (pageResponseCode === 302) {
            let redirectUrl: string = this.rootRouteState.pageMetadata.redirectUrl;

            // if the redirect URL is not available, use the root route state, cuz maybe that was modified... ¯\_(ツ)_/¯
            if (!redirectUrl) {
                redirectUrl = RouteBuilder.clone(this.rootRouteState).doNotResetChildRoutes().buildString();
                this.rootRouteState.pageMetadata.redirectUrl = redirectUrl;
            }

            // if we have session, then put the session cookie for redirect
            if (this.req.session) {
                this.req.session[URL_BEFORE_REDIRECT] = this.rootRouteState.pageMetadata.urlBeforeRedirect;
            }

            this.res.redirect(302, redirectUrl);
        } else {
            const flashedErrors: string[] = this.req.flash ? this.req.flash("errors") || [] : [];

            // check for error
            if (!this.rootRouteState.pageMetadata.errorMessage) {
                if (flashedErrors.length !== 0) {
                    this.rootRouteState.pageMetadata.errorMessage = flashedErrors[0];
                } else if (this.routingError) {
                    this.rootRouteState.pageMetadata.errorMessage = ErrorUtil.getPrintableError(this.routingError);
                }
            }

            if (this.req.session && !this.rootRouteState.pageMetadata.urlBeforeRedirect) {
                delete this.req.session[URL_BEFORE_REDIRECT];
            }

            this.res.status(pageResponseCode).send(response);
        }

        this.responseSent = true;
    }

    protected doBeforeExecute(): void {
        // nothing here
    }

    /**
     * Override to customize the response being sent back.
     *
     * @param {Error} err
     */
    protected doAfterExecute(err?: Error): void {
        if (!this.responseSent && err) {
            // if there was an error while executing this action, we don't want the client socket to be left hanging
            // because that leads to socket leak -> crash.

            try {
                this.rootRouteState.pageMetadata.errorMessage = err.toString();
                this.rootRouteState.pageMetadata.pageResponseCode = 500;
                this.sendResponse(this.renderHtml());
            } catch (e) {
                // try to send an error from the subclass.
                if (!this.responseSent) {
                    try {
                        this.res.status(500).send(
                            this.renderErrorHtml(ErrorUtil.customize(e, ErrorUtil.getPrintableError(err || ""))));
                        this.responseSent = true;
                    } catch (e2) {
                        // There was an error while handling an error, but we have to do something at this point.
                        // Last resort: send a plain message. This should never happen, but we still need to
                        // make this into a pretty error page in case it does.

                        if (!this.responseSent) {
                            this.res.status(500).send("An error occurred: " + ErrorUtil.getPrintableError(
                                ErrorUtil.customize(e2, ErrorUtil.getPrintableError(err || e || ""))));
                            this.responseSent = true;
                        }
                    }
                }

            }
        }
    }
}

const HEADER_USER_AGENT: string = "user-agent";
export const URL_BEFORE_REDIRECT: string = "url-before-redirect";