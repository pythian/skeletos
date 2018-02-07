import _ = require("lodash");
import {AbstractRouteState} from "../extendible/state/AbstractRouteState";
import {ClassTypeInfo, EPropType, ErrorUtil, PropTypeInfo} from "../../core";
import {IRouteStateClassInfo, ROUTESTATE_CLASS_KEY} from "../base/IRouteStateClassInfo";

export const SEGMENT_PROP_KEY: string = "skeletos-router.segment-prop";

export interface ISegmentPropInfo {
    /**
     * The segment string that will be used in the URL.
     */
    name: string;
}

export function Segment(segmentName?: string): PropertyDecorator {
    return function SegmentDecorator(target: AbstractRouteState, propertyKey: string): void {

        const routeName: string = segmentName || propertyKey;

        // we have to make sure the segmentName does not have any reserved keywords.
        const splitRouteName: string[] = routeName.split(/[a-zA-Z0-9\~\_\-\.]+/g);
        if (splitRouteName.length === 0) {
            throw new Error("A segmentName for a @Segment cannot be null. See " + propertyKey + " in " +
                ErrorUtil.getDebugName(target) + ".");
        } else {
            for (const part of splitRouteName) {
                if (part.length > 0) {
                    throw new Error("A segmentName for a @Segment ca only be alphanumeric or have " +
                        "special characters (~, _, -, .). See " + propertyKey + " in " +
                        ErrorUtil.getDebugName(target) + ".");
                }
            }
        }

        const classTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(target);
        const classInfo: IRouteStateClassInfo = classTypeInfo.getIfExistsOrPutExtension(ROUTESTATE_CLASS_KEY);

        if (classInfo.segmentParams && !_.isEmpty(classInfo.segmentParams)) {
            throw new Error("A @Segment parameter cannot be defined on a Route class that also has a " +
                "@SegmentParam for another property. In " + ErrorUtil.getDebugName(target) +
                ", you defined @Segment on " + propertyKey + " but there is also @SegmentParam defined on " +
                _.keys(classInfo.segmentParams)[0]);
        }

        const propTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        // a Segment can only ever be defined on a @State
        if (propTypeInfo.propType !== EPropType.state) {
            throw new Error("A @Segment can only be defined on a property that also has @State defined. " +
                "If you already have @State defined on " +
                propertyKey + " in " + ErrorUtil.getDebugName(target) +
                ", then try switching the order (i.e. @State should be at the bottom, and @Segment should be above @State).");
        }

        // put the propInfo for segment
        propTypeInfo.putExtension(SEGMENT_PROP_KEY, {
            name: routeName
        } as ISegmentPropInfo);

        // next we put the same info in a dictionary on the class
        if (!classInfo.segments) {
            classInfo.segments = {};
        }

        if (classInfo.segments[routeName]) {
            throw new Error("There is already another property " + classInfo.segments[routeName] + " in " +
                ErrorUtil.getDebugName(target) + " with the same route (" + routeName + ") as the property " +
                propertyKey);
        }

        classInfo.segments[routeName] = propertyKey;
        classInfo.hasSegments = true;
        classInfo.hasSegmentParams = false;
    };
}