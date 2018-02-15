import * as React from "react";
import {DummyUiState} from "../../../states/DummyUiState";
import {TodoRoute} from "../../../routes/home/todos/TodoRoute";
import {HomeRoute} from "../../../routes/HomeRoute";
import {AbstractDummyComponent} from "../../AbstractDummyComponent";

export class TodoComponent extends AbstractDummyComponent<DummyUiState, TodoRoute, HomeRoute> {
    protected getComponentName(): string {
        return "TodoComponent";
    }

    protected getSubComponents(): JSX.Element | JSX.Element[] {
        return undefined;
    }

}