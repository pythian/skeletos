import {AbstractRootRouteState} from "../extendible/state/AbstractRootRouteState";

export type IClientLocationChangeListener =
    <RootRouteStateType extends AbstractRootRouteState>(
        oldRootRouteState: RootRouteStateType,
        oldUrl: string,
        newRootRouteState: RootRouteStateType,
        newUrl: string
    ) => void;