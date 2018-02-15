// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import * as React from "react";
import {ComponentClass} from "react";
import {HrefAnchorAction} from "../helpers/HrefAnchorAction";
import {InternalRouteBuilder, IRouteBuilderInstance} from "../../web-router";
import _ = require("lodash");

/**
 * The properties for HrefAnchor.
 */
export interface IAnchorHrefProps extends React.HTMLAttributes<any> {
    routeBuilder: IRouteBuilderInstance<any, any>;
    componentClass?: ComponentClass<React.HTMLAttributes<any>>;
    target?: string;
    href?: string;
}

/**
 * A replacement for <a /> that works on both the server and the client.
 *
 * If you were to use <a /> only on the client, the page would reload every time. Using <HrefAnchor /> instead would
 * allow the application to behave like a Single Page Application (SPA) on the client side.
 */
export class HrefAnchor extends React.Component<IAnchorHrefProps, {}> {

    onClick(event: React.MouseEvent<any>): void {
        event.preventDefault();
        new HrefAnchorAction(this.props.routeBuilder as InternalRouteBuilder<any, any>).execute();
    }

    render(): JSX.Element {
        const anchorProps: IAnchorHrefProps = _.assign({}, this.props) as IAnchorHrefProps;
        delete anchorProps.routeBuilder;
        delete anchorProps.componentClass;

        const target: string = anchorProps.target;

        const url: string = this.props.routeBuilder.buildString();

        if (this.props.componentClass) {
            anchorProps.href = url;
            anchorProps.onClick = this.onClick.bind(this);

            return React.createElement(this.props.componentClass, anchorProps, this.props.children);
        } else if (target) {
            return (
                <a href={url} {...(anchorProps as React.HTMLAttributes<any>)}>
                    {this.props.children}
                </a>
            );
        } else {
            return (
                <a href={url} onClick={this.onClick.bind(this)} {...(anchorProps as React.HTMLAttributes<any>)}>
                    {this.props.children}
                </a>
            );
        }
    }
}
