/**
 * Holds meta data information of the page.
 */
import {AbstractSkeletosState, Primitive} from "../../../core";

export class PageMetadataState extends AbstractSkeletosState {

    /**
     * The current title of the page.
     */
    @Primitive()
    title: string;

    /**
     * The user agent of the requesting browser. We place the user agent here so we can use it on the server side.
     */
    @Primitive()
    userAgent: string;

    /**
     * The locale of the requesting browser. We place the locale here so we can use it on the server side.
     */
    @Primitive()
    locale: string;

    /**
     * Initial page response from the server.
     */
    @Primitive()
    pageResponseCode: number;

    /**
     * If page response code is 302, then user will be redirected to this url.
     */
    @Primitive()
    redirectUrl: string;

    /**
     * The URL that we tried to render before we redirected to #redirectUrl.
     *
     * This is either:
     * 1. The URL that we received a request to serve, given (2) below is not available, or
     * 2. If a session cookie is available for the current redirect URL, then that session cookie.
     *
     * You can also set this as part of a AbstractRouteAction and the two points above will not apply.
     */
    @Primitive()
    urlBeforeRedirect: string;

    /**
     * Error message to be sent on initial page load.
     */
    @Primitive()
    errorMessage: string;

    /**
     * Whether this page can be rendered on the server. This is a cumulative result of all the
     * AbstractRouteState#canRenderServerSide() in the URL's route tree.
     */
    @Primitive()
    canRenderServerSide: boolean;
}