import * as React from "react";
import {AbstractInitializeReactBrowserAction} from "../../../react-web-router/extendible/actions/AbstractInitializeReactBrowserAction";
import {RootState} from "../shared/states/RootState";
import {HomeRoute} from "../shared/routes/HomeRoute";
import {SkeletosCursor} from "../../../core";
import {HomeComponent} from "../shared/components/HomeComponent";

export class ExampleAppClientRenderAction extends AbstractInitializeReactBrowserAction<RootState, HomeRoute> {
    protected renderReactPage(rootState: RootState, rootRouteState: HomeRoute): JSX.Element {
        return (
            <HomeComponent skeletosState={rootState} route={rootRouteState} />
        );
    }

    protected createRootState(rootCursor: SkeletosCursor): RootState {
        return new RootState(rootCursor);
    }

    protected getRootRouteState(rootState: RootState): HomeRoute {
        return rootState.route;
    }

}