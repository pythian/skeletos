import * as React from "react";
import _ = require("lodash");
import {renderToString} from "react-dom/server";
import {AbstractSkeletosState, ErrorUtil, getDefaultLogger} from "../../core";
import {AbstractRootRouteState} from "../../web-router";
import {AbstractSkeletosRenderAction} from "../../express";
import {SkeletosReactConstants} from "../../react";
import {SkeletosWebRouterConstants} from "../../web-router/helpers/SkeletosWebRouterConstants";

/**
 * Subclasses AbstractSkeletosExpressAction to render the response using React. You can override various methods here to
 * customize the response while maintaining React JSX style customizations.
 */
export abstract class AbstractReactExpressRenderAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractSkeletosRenderAction<RootStateType, RootRouteStateType> {


    /**
     * Override superclass' renderHtml() to render to string the #renderJsx() method.
     *
     * @returns {string}
     */
    protected renderHtml(): string {
        return this.renderToString(this.renderJsx());
    }

    /**
     * Override superclass' renderErrorHtml() to render to string the #renderErrorJsx() method.
     *
     * @param {Error} error
     * @returns {string}
     */
    protected renderErrorHtml(error?: Error): string {
        return this.renderToString(this.renderErrorJsx(error));
    }

    /**
     * Renders a JSX element to string. Includes
     *
     * @param {JSX.Element} element
     * @returns {string}
     */
    protected renderToString(element: JSX.Element): string {
        return this.renderPreHtml() + "\n" + renderToString(this.renderJsx());
    }

    /**
     * Renders anything that should come before the <html> tag. Currently, this returns `&lt;!DOCTYPE html&gt;`.
     *
     * @returns {string}
     */
    protected renderPreHtml(): string {
        return `<!DOCTYPE html>`;
    }

    /**
     * Renders the HTML as a React JSX.
     *
     * @returns {JSX.Element}
     */
    protected renderJsx(): JSX.Element {
        return (
            <html>
                {this.renderHead()}
                {this.renderBody()}
            </html>
        );
    }

    /**
     * Renders an error as React JSX.
     *
     * @param {Error} error
     * @returns {JSX.Element}
     */
    protected renderErrorJsx(error?: Error): JSX.Element {
        return (
            <html>
                {this.renderHead()}
                {this.renderErrorBody(error)}
            </html>
        );
    }

    /**
     * Renders the <head> element. It includes (in this order):
     *
     * 1. #renderMetaTags()
     * 2. #renderHeadLinksAndStylesheets()
     *
     * @returns {JSX.Element}
     */
    protected renderHead(): JSX.Element {
        return (
            <head>
                {this.renderMetaTags()}
                {this.renderHeadLinksAndStylesheets()}
            </head>
        );
    }

    /**
     * Renders the <body> element. It includes (in this order):
     *
     * 1. #renderRootComponent()
     * 2. An embedded <script> with contents from #getBodyCustomScriptContents
     * 3. #renderBodyScriptTags
     *
     * @returns {JSX.Element}
     */
    protected renderBody(): JSX.Element {
        return (
            <body>
                <div id={SkeletosReactConstants.ROOT_REACT_DIV_ID}>
                    {this.renderRootComponent()}
                </div>

                {/* tslint:disable-next-line */}
                <div dangerouslySetInnerHTML={{__html: this.createScriptTagFromContents()}} />

                {this.renderBodyScriptTags()}
            </body>
        );
    }

    /**
     * Returns the contents for the <script> tag that is directly embedded in the body from renderBody(..). Use this to
     * add arbitrary javascript code, for example, Google Analytics javascript code.
     *
     * Note that these script tags are added to the end of the body so they will be loaded at the end. They will be
     * added after #renderBodyScriptTags().
     *
     * @returns {string}
     */
    protected getBodyCustomScriptContents(): string {
        const serializedState: string = _.escape(this.getSerializedState() || "");
        return `window.${SkeletosWebRouterConstants.SKELETOS_DEHYDRATED_STATE_GLOBAL_ID} = "${serializedState}";`;
    }

    /**
     * Returns <script src=...> tags that should be added to the end of <body>. Use this to add the client-side scripts.
     *
     * Note that these script tags are added to the end of the body so they will be loaded at the end. They will be
     * added after #getBodyCustomScriptContents().
     *
     * @returns {JSX.Element[]}
     */
    protected renderBodyScriptTags(): JSX.Element[] {
        return [];
    }

    /**
     * Returns the <link> tags that should be added to <head>. Use this to add stylesheets.
     *
     * @returns {JSX.Element[]}
     */
    protected renderHeadLinksAndStylesheets(): JSX.Element[] {
        return [];
    }

    /**
     * Serializes the root state and returns it.
     *
     * @returns {string}
     */
    protected getSerializedState(): string {
        return this.rootState.cursor.db.serialize();
    }

    /**
     * Render the root component of your application here.
     *
     * @returns {JSX.Element}
     */
    protected abstract renderRootComponent(): JSX.Element;

    /**
     * Renders any errors that occurred while the application was being rendered.
     *
     * @param {Error} error
     * @returns {JSX.Element}
     */
    protected renderErrorBody(error?: Error): JSX.Element {
        return (
            <body>
                <div id={SkeletosReactConstants.ROOT_REACT_DIV_ID}>
                    <h1>Oh no!</h1>
                    <p>
                        An error occurred while navigating to this page.
                    </p>
                    <p>
                        {ErrorUtil.getPrintableError(error || "¯\\_(ツ)_/¯")}
                    </p>
                </div>
            </body>
        );
    }

    /**
     * Renders the <meta> tags for the <head>.
     *
     * @returns {JSX.Element[]}
     */
    protected renderMetaTags(): JSX.Element[] {
        return [
            <meta charSet="UTF-8" key="charset" />
        ];
    }

    /**
     * Returns the title of the page.
     *
     * @returns {string}
     */
    protected getTitle(): string {
        return this.rootRouteState.pageMetadata.title;
    }

    private createScriptTagFromContents(): string {
        return `<script>${this.getBodyCustomScriptContents()}</script>`;
    }

}
