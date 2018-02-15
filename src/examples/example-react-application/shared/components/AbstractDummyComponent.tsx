import * as React from "react";
import {AbstractRouteComponent, HrefAnchor} from "../../../../react-web-router";
import {AbstractSkeletosState, LoadingState} from "../../../../core";
import {AbstractRootRouteState, AbstractRouteState} from "../../../../web-router";

export abstract class AbstractDummyComponent<
    SkeletosStateType extends AbstractSkeletosState,
    RouteStateType extends AbstractRouteState,
    RootRouteStateType extends AbstractRootRouteState=AbstractRootRouteState,
    ExtraPropsType={},
    ReactComponentStateType={}
    > extends AbstractRouteComponent<SkeletosStateType, RouteStateType, RootRouteStateType, ExtraPropsType, ReactComponentStateType> {

    protected doRender(): JSX.Element | false | null {
        return (
            <div>
                {this.renderComponentName()}
                <div style={{marginLeft: 30}}>
                    {this.getSubComponents()}
                </div>
            </div>
        );
    }

    protected doNotRender(): JSX.Element | false | null {
        return (
            <div>
                {this.renderComponentName()}
            </div>
        );
    }

    protected abstract getComponentName(): string;

    protected abstract getSubComponents(): JSX.Element | JSX.Element[];

    protected renderComponentName(): JSX.Element {
        return (
            <HrefAnchor routeBuilder={this.routeBuilder.resetAllQueryParams()}>
                {this.getComponentName()}
            </HrefAnchor>
        );
    }

    protected doRenderLoading(loading: LoadingState): JSX.Element | false | null {
        return null;
    }

}