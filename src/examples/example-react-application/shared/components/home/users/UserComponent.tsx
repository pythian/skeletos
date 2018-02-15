import * as React from "react";
import {DummyUiState} from "../../../states/DummyUiState";
import {UsersRoute} from "../../../routes/home/UsersRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {AbstractDummyComponent} from "../../AbstractDummyComponent";

export class UserComponent extends AbstractDummyComponent<DummyUiState, UsersRoute, HomeRoute> {
    protected getComponentName(): string {
        return "UserComponent";
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return undefined;
    }

}