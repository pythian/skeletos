import async = require("async");
import {HomeRoute} from "./HomeRoute";
import {RootState} from "../states/RootState";
import {ErrorUtil, ISkeletosCommand} from "../../../../core";
import {AbstractRouteAction, AbstractRouteState} from "../../../../web-router";


export class DummyRouteTreeAsyncAction extends AbstractRouteAction<HomeRoute, HomeRoute, RootState> {

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionAsynchronously(this.changeAsyncString)
        ];
    }

    private changeAsyncString(callback: async.ErrorCallback<Error>): void {
        const route: AbstractRouteState = this.newRoute ? this.newRoute : this.oldRoute;
        const routeName: string = ErrorUtil.getDebugName(route);

        if (!this.getRootState(RootState).loadedTreeAsync) {
            this.getRootState(RootState).loadedTreeAsync = routeName + " Started<br>";
        } else {
            this.getRootState(RootState).loadedTreeAsync += routeName + " Started<br>";
        }

        setTimeout(() => {
            this.getRootState(RootState).loadedTreeAsync += routeName + " Ended<br>";
            callback();
        }, 500);
    }
}