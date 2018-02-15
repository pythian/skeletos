import express = require("express");
import _ = require("lodash");
import * as React from "react";
import {AbstractSkeletosState, UrlUtils} from "../../core";
import {AbstractReactExpressRenderAction} from "../../react-express";
import {AbstractRootRouteState} from "../../web-router";
import {HammerpackWebserviceUtil} from "../../hammerpack/helpers/HammerpackWebserviceUtil";
import Hammerpack from "hammerpack";

/**
 * Uses the startup parameters defined for Hammerpack Webservice to return client javascript and css
 * bundles in the responses.
 */
export abstract class AbstractHammerpackRenderAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractReactExpressRenderAction<RootStateType, RootRouteStateType> {

    protected hammerpackUtil: HammerpackWebserviceUtil;
    protected hotreloadUrl: string;

    constructor(
        req: express.Request, res: express.Response, next: express.NextFunction,
        hammerpackUtil: HammerpackWebserviceUtil) {
        super(req, res, next);
        this.hammerpackUtil = hammerpackUtil;
        this.hotreloadUrl = UrlUtils.ensureTrailingSlash(this.hammerpackUtil.params.resources.hotreload);
    }

    protected renderHeadLinksAndStylesheets(): JSX.Element[] {
        const elements: JSX.Element[] = super.renderHeadLinksAndStylesheets();

        if (_.isEmpty(this.hammerpackUtil.params.resources.cssFiles)) {
            return elements;
        }

        if (process.env.NODE_ENV === "production") {
            return elements.concat(_.map(this.hammerpackUtil.params.resources.cssFiles, (fileName) => {
                const src: string = this.hammerpackUtil.params.resources.staticAssetsPath + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        } else {
            return elements.concat(_.map(this.hammerpackUtil.params.resources.cssFiles, (fileName) => {
                const src = this.hotreloadUrl + fileName;

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

        if (_.isEmpty(this.hammerpackUtil.params.resources)) {
            return elements;
        }

        if (process.env.NODE_ENV === "production") {
            return elements.concat(_.map(this.hammerpackUtil.params.resources.jsFiles, (fileName) => {
                const src = this.hammerpackUtil.params.resources.staticAssetsPath + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        } else {
            return elements.concat(_.map(this.hammerpackUtil.params.resources.jsFiles, (fileName) => {
                const src = this.hotreloadUrl + fileName;

                return (
                    <script
                        key={fileName}
                        src={src}
                    />
                );
            }));
        }
    }

    protected getBodyCustomScriptContents(): string {
        let retVal = super.getBodyCustomScriptContents();
        retVal += `\nwindow.${HammerpackWebserviceUtil.BROWSER_GLOBAL_ID} = "${_.escape(
            JSON.stringify(this.hammerpackUtil.params))}";`;

        return retVal;
    }
}