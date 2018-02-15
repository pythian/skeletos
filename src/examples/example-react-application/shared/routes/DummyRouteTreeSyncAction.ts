import async = require("async");
import {HomeRoute} from "./HomeRoute";
import {RootState} from "../states/RootState";
import {ErrorUtil, ISkeletosCommand} from "../../../../core";
import {AbstractRouteAction, AbstractRouteState} from "../../../../web-router";


export class DummyRouteTreeSyncAction extends AbstractRouteAction<HomeRoute, HomeRoute, RootState> {

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionAsynchronously(this.changeSyncString)
        ];
    }

    private changeSyncString(callback: async.ErrorCallback<Error>): void {
        const route: AbstractRouteState = this.newRoute ? this.newRoute : this.oldRoute;
        const routeName: string = ErrorUtil.getDebugName(route);

        if (!this.getRootState(RootState).loadedTreeSync) {
            this.getRootState(RootState).loadedTreeSync = routeName + " Started<br>";
        } else {
            this.getRootState(RootState).loadedTreeSync += routeName + " Started<br>";
        }

        setTimeout(() => {
            this.getRootState(RootState).loadedTreeSync += routeName + " Ended<br>";
            callback();
        }, 0);
    }
}