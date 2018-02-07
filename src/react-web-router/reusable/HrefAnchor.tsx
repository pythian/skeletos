// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import * as React from "react";
import {ComponentClass} from "react";
import _ = require("lodash");


export interface IAnchorHrefProps extends React.HTMLAttributes<any> {
    hrefAction: any;
    componentClass?: ComponentClass<React.HTMLAttributes<any>>;
    target?: string;
    href?: string;
}

export class HrefAnchor extends React.Component<IAnchorHrefProps, {}> {

    onClick(event: React.MouseEvent<any>): void {
        event.preventDefault();
        this.props.hrefAction.execute();
    }

    render(): JSX.Element {
        const anchorProps: IAnchorHrefProps = _.assign({}, this.props) as IAnchorHrefProps;
        delete anchorProps.hrefAction;
        delete anchorProps.componentClass;

        const target: string = anchorProps.target;

        const url: string = this.props.hrefAction.toRoute.syncRouteToUrl();

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
