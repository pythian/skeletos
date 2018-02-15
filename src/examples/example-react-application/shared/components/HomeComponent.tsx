import * as React from "react";
import {RootState} from "../states/RootState";
import {HomeRoute} from "../routes/HomeRoute";
import {AbstractRootRouteComponent} from "../../../../react-web-router";
import {ProfileComponent} from "./home/ProfileComponent";
import {TodosComponent} from "./home/TodosComponent";
import {UsersComponent} from "./home/UsersComponent";
import {HammerpackWebserviceUtil} from "../../../../hammerpack";
require("./HomeComponent.less");

// tslint:disable

export class HomeComponent extends AbstractRootRouteComponent<RootState, HomeRoute> {

    render(): JSX.Element {
        const canadaFlag: string = HammerpackWebserviceUtil.SINGLETON.getServerUrl("canada2.png");

        return (
            <div>
                <img src={canadaFlag}/>
                <br/>
                HomeComponent
                <div style={{marginLeft: 30}}>
                    <ProfileComponent skeletosState={this.skeletosState.ui} route={this.route.profile} />
                    <TodosComponent skeletosState={this.skeletosState.ui} route={this.route.todos} />
                    <UsersComponent skeletosState={this.skeletosState.ui} route={this.route.users} />
                </div>

                <div>
                    Sync String: <div dangerouslySetInnerHTML={{__html: this.skeletosState.loadedSync}}/>
                </div>
                <br/><br/><br/>
                <div>
                    Async String: <div dangerouslySetInnerHTML={{__html: this.skeletosState.loadedAsync}}/>
                </div>
                <br/><br/><br/>
                <div>
                    Sync Tree String: <div dangerouslySetInnerHTML={{__html: this.skeletosState.loadedTreeSync}}/>
                </div>
                <br/><br/><br/>
                <div>
                    Async Tree String: <div dangerouslySetInnerHTML={{__html: this.skeletosState.loadedTreeAsync}}/>
                </div>
            </div>
        );
    }
}