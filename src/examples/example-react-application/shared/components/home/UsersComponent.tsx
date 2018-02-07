import * as React from "react";
import {AbstractRouteComponent} from "../../../../../react-web-router";
import {HomeRoute} from "../../routes/HomeRoute";
import {LoadingState} from "../../../../../core";
import {UsersRoute} from "../../routes/home/UsersRoute";
import {DummyUiState} from "../../states/DummyUiState";
import {UserComponent} from "./users/UserComponent";

export class UsersComponent extends AbstractRouteComponent<DummyUiState, UsersRoute, HomeRoute> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                UsersComponent
                <div style={{marginLeft: 30}}>
                    <UserComponent skeletosState={this.skeletosState} route={this.route} />
                </div>
            </div>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}