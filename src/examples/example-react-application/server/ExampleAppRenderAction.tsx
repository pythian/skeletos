import * as React from "react";
import {RootState} from "../shared/states/RootState";
import {HomeRoute} from "../shared/routes/HomeRoute";
import {SkeletosCursor} from "../../../core";
import {HomeComponent} from "../shared/components/HomeComponent";
import {AbstractHammerpackRenderAction} from "../../../react-express-hammerpack";


export class ExampleAppRenderAction extends AbstractHammerpackRenderAction<RootState, HomeRoute> {

    protected renderRootComponent(): JSX.Element {
        const readOnlyRootState = this.readOnlyRootState;
        return <HomeComponent skeletosState={readOnlyRootState} route={readOnlyRootState.route}/>;
    }

    protected createRootState(cursor: SkeletosCursor): RootState {
        return new RootState(cursor);
    }

    protected getRootRouteStateFromRootState(rootState: RootState): HomeRoute {
        return this.rootState.route;
    }
}