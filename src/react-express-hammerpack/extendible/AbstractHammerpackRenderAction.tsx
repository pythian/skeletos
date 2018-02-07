import express = require("express");
import _ = require("lodash");
import * as React from "react";
import {AbstractSkeletosState} from "../../core";
import {UrlUtils} from "../../express";
import {AbstractReactExpressRenderAction} from "../../react-express";
import {AbstractRootRouteState} from "../../web-router";
import {IHammerpackParameters} from "./IHammerpackParameters";

/**
 * Uses the startup parameters defined for Hammerpack Webservice to return client javascript and css
 * bundles in the responses.
 */
export abstract class AbstractHammerpackRenderAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractReactExpressRenderAction<RootStateType, RootRouteStateType> {

    protected pathToStaticResources: string;
    protected hammerpackParams: IHammerpackParameters;
    protected hotreloadUrl: string;

    constructor(
        req: express.Request, res: express.Response, next: express.NextFunction, pathToStaticResources: string,
        hammerpackParams: IHammerpackParameters) {
        super(req, res, next);
        this.pathToStaticResources = UrlUtils.ensureTrailingSlash(pathToStaticResources);
        this.hammerpackParams = hammerpackParams;
        this.hotreloadUrl = UrlUtils.ensureTrailingSlash(this.hammerpackParams.resources.hotreload);
    }

    protected renderHeadLinksAndStylesheets(): JSX.Element[] {
        const elements: JSX.Element[] = super.renderHeadLinksAndStylesheets();

        if (_.isEmpty(this.hammerpackParams.resources.cssFiles)) {
            return elements;
        }

        if (process.env.NODE_ENV === "production") {
            return elements.concat(_.map(this.hammerpackParams.resources.cssFiles, (fileName) => {
                const src: string = this.pathToStaticResources + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        } else {
            return elements.concat(_.map(this.hammerpackParams.resources.cssFiles, (fileName) => {
                const src = this.hotreloadUrl + this.pathToStaticResources + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        }
    }

    protected renderBodyScriptTags(): JSX.Element[] {
        const elements: JSX.Element[] = super.renderBodyScriptTags();

        if (_.isEmpty(this.hammerpackParams.resources)) {
            return elements;
        }

        if (process.env.NODE_ENV === "production") {
            return elements.concat(_.map(this.hammerpackParams.resources.jsFiles, (fileName) => {
                const src = this.pathToStaticResources + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        } else {
            return elements.concat(_.map(this.hammerpackParams.resources.jsFiles, (fileName) => {
                const src = this.hotreloadUrl + this.pathToStaticResources + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        }
    }
}