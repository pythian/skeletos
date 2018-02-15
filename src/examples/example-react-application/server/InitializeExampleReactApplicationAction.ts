import express = require("express");
import {
    AbstractHammerpackRenderAction,
    AbstractInitializeHammerpackWebServiceAction
} from "../../../react-express-hammerpack";
import {ExampleAppRenderAction} from "./ExampleAppServerRenderAction";

export class InitializeExampleReactApplicationAction extends AbstractInitializeHammerpackWebServiceAction {

    protected createPageRenderAction(
        request: express.Request, response: express.Response,
        next: express.NextFunction): AbstractHammerpackRenderAction<any, any> {
        return new ExampleAppRenderAction(
            request, response, next, this.hammerpackUtil);
    }

}