import _ = require("lodash");

export const ROUTESTATE_CLASS_KEY: string = "skeletos-router.routestate";

export interface IRouteStateClassInfo {

    /**
     * The name of the segment used in the URL vs the property name defined in the class.
     */
    segments: _.Dictionary<string>;

    /**
     * Whether this class has @Segment annotations.
     */
    hasSegments: boolean;

    /**
     * Whether a property name defined in the class is a @SegmentParam
     */
    segmentParams: _.Dictionary<true>;

    /**
     * Whether this class has @SegmentParam annotations.
     */
    hasSegmentParams: boolean;

    /**
     * The name of the query parameter used in the URL vs the property name defined in the class.
     */
    queryParams: _.Dictionary<string>;

    /**
     * A dummy state that has PropertyKeys vs RoutePath defined as per the @Segment annotations. This is a form of a
     * cache for the InternalRouteBuilder.
     */
    dummyState: object;

    /**
     * A dummy state that has PropertyKeys vs PropertyKeys for each of the values of queryParams. This is a form of a
     * cache for the InternalRouteBuilder.
     */
    dummyQueryParams: object;

}