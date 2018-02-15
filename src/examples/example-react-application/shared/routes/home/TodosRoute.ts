import {TodoRoute} from "./todos/TodoRoute";
import {DummyRouteTreeSyncAction} from "../DummyRouteTreeSyncAction";
import {DummyRouteSyncAction} from "../DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "../DummyRouteAsyncAction";
import {DummyRouteTreeAsyncAction} from "../DummyRouteTreeAsyncAction";
import {Primitive, State} from "../../../../../core";
import {AbstractRouteAction, AbstractRouteState, SegmentParam} from "../../../../../web-router";

export class TodosRoute extends AbstractRouteState {


    @SegmentParam()
    @Primitive()
    todoId: string;

    @SegmentParam()
    @State(() => TodoRoute)
    todo: TodoRoute;

    onRouteUpdatedSync(): typeof AbstractRouteAction {
        return DummyRouteSyncAction as any;
    }

    onRouteUpdatedAsync(): typeof AbstractRouteAction {
        return DummyRouteAsyncAction as any;
    }

    onRouteTreeUpdatedSync(): typeof AbstractRouteAction {
        return DummyRouteTreeSyncAction as any;
    }

    onRouteTreeUpdatedAsync(): typeof AbstractRouteAction {
        return DummyRouteTreeAsyncAction as any;
    }
}