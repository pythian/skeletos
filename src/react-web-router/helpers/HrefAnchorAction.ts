import async = require("async");
import {AbstractSkeletosPromiseAction, ISkeletosCommand} from "../../core";
import {AbstractRootRouteState, AbstractRouteState, InternalRouteBuilder} from "../../web-router";

/**
 * Just simple action to merge the RouteBuilder route into the main db.
 *
 * This will kick off Route Actions.
 */
export class HrefAnchorAction extends AbstractSkeletosPromiseAction<void> {

    private routeBuilder: InternalRouteBuilder<AbstractRouteState, AbstractRootRouteState>;
    private routeToMergeInto: AbstractRootRouteState;

    constructor(routeBuilder: InternalRouteBuilder<AbstractRouteState, AbstractRootRouteState>) {
        super(routeBuilder.routeToClone.cursor.root());
        this.routeBuilder = routeBuilder;

        this.routeToMergeInto =
            new ((this.routeBuilder.routeToClone as any).constructor)(this.routeBuilder.routeToClone, this.transaction);
    }

    protected getCommands(): ISkeletosCommand[] | object {
        return [
            this.callFunctionSynchronously(this.doMerge)
        ];
    }

    protected doMerge(): void {
        this.routeBuilder.mergeWithoutRouteActions(this.routeToMergeInto);
    }

}