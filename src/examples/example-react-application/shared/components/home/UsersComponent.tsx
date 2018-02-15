import * as React from "react";
import {HomeRoute} from "../../routes/HomeRoute";
import {UsersRoute} from "../../routes/home/UsersRoute";
import {DummyUiState} from "../../states/DummyUiState";
import {UserComponent} from "./users/UserComponent";
import {AbstractDummyComponent} from "../AbstractDummyComponent";

export class UsersComponent extends AbstractDummyComponent<DummyUiState, UsersRoute, HomeRoute> {
    protected getComponentName(): string {
        return "UsersComponent";
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return <UserComponent skeletosState={this.skeletosState} route={this.route} />;
    }

}