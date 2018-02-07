import {Primitive, State} from "../../../core";
import {AbstractRouteState} from "./AbstractRouteState";
import {PageMetadataState} from "./PageMetadataState";

export abstract class AbstractRootRouteState extends AbstractRouteState {

    /**
     * Once you are done with modifying the homeRoute, call this method to indicate to any listener that the URL has to
     * be changed now.
     *
     * Note: this is only applicable on the root route.
     */
    @Primitive()
    changeUrlToReflectCurrentState: boolean;

    /**
     * Holds metadata such as title, response code, etc.
     */
    @State(() => PageMetadataState)
    pageMetadata: PageMetadataState;
}