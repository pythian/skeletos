import * as ReactDOM from "react-dom";
import {AbstractSkeletosState, SkeletosCursor} from "../../../core";
import {AbstractInitializeBrowserAction, AbstractRootRouteState} from "../../../web-router";
import {SkeletosReactConstants} from "../../../react";


export abstract class AbstractInitializeReactBrowserAction<RootStateType extends AbstractSkeletosState, RootRouteStateType extends AbstractRootRouteState>
    extends AbstractInitializeBrowserAction<RootStateType, RootRouteStateType> {

    protected render(rootState: RootStateType, rootRouteState: RootRouteStateType): void {
        const readOnlyCursor = new SkeletosCursor(this.rootCursor, false);
        const readOnlyRootState = this.createRootState(readOnlyCursor);

        ReactDOM.render(
            this.renderReactPage(readOnlyRootState, this.getRootRouteState(readOnlyRootState)),
            document.getElementById(SkeletosReactConstants.ROOT_REACT_DIV_ID)
        );
    }

    protected abstract renderReactPage(rootState: RootStateType, rootRouteState: RootRouteStateType): JSX.Element;

}

declare const document: any;