import {Primitive, SkeletosDictionary, State} from "../../../../core";
import {TodosRoute} from "./home/TodosRoute";
import {UsersRoute} from "./home/UsersRoute";
import {ProfileRoute} from "./home/ProfileRoute";
import {DummyRouteSyncAction} from "./DummyRouteSyncAction";
import {DummyRouteAsyncAction} from "./DummyRouteAsyncAction";
import {DummyRouteTreeSyncAction} from "./DummyRouteTreeSyncAction";
import {DummyRouteTreeAsyncAction} from "./DummyRouteTreeAsyncAction";
import {AbstractRootRouteState, AbstractRouteAction, QueryParam, Segment} from "../../../../web-router";

export class HomeRoute extends AbstractRootRouteState {

    @Segment()
    @State(() => TodosRoute)
    todos: TodosRoute;

    @Segment()
    @State(() => UsersRoute)
    users: UsersRoute;

    @Segment("p") // you can specify a different segment to use in the actual URL
    @State(() => ProfileRoute)
    profile: ProfileRoute;

    @QueryParam("s")
    @Primitive()
    sidebar: boolean;

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