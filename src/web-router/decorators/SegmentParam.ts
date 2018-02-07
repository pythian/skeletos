import _ = require("lodash");
import {AbstractRouteState} from "../extendible/state/AbstractRouteState";
import {ClassTypeInfo, EPropType, ErrorUtil, PropTypeInfo} from "../../core";
import {IRouteStateClassInfo, ROUTESTATE_CLASS_KEY} from "../base/IRouteStateClassInfo";

export const SEGMENT_PARAM_PROP_KEY: string = "skeletos-router.segment-param-prop";

// tslint:disable-next-line
export interface ISegmentParamPropInfo {
    // empty
}

export function SegmentParam(): PropertyDecorator {
    return function SegmentParamDecorator(target: AbstractRouteState, propertyKey: string): void {

        const classTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(target);
        const classInfo: IRouteStateClassInfo = classTypeInfo.getIfExistsOrPutExtension(ROUTESTATE_CLASS_KEY);

        if (classInfo.segments && !_.isEmpty(classInfo.segments)) {
            throw new Error("A @SegmentParam parameter cannot be defined on a Route class that also has a " +
                "@Segment for another property. In " + ErrorUtil.getDebugName(target) +
                ", you defined @SegmentParam on " + propertyKey + " but there is also @Segment defined on " +
                _.values(classInfo.segments)[0]);
        }

        const propTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        // a Segment can only ever be defined on a @State
        if (propTypeInfo.propType !== EPropType.state && propTypeInfo.propType !== EPropType.primitive) {
            throw new Error("A @SegmentParam can only be defined on a property that also has @State or @Primitive defined. " +
                "If you already have @State or @Primitive defined on " +
                propertyKey + " in " + ErrorUtil.getDebugName(target) +
                ", then try switching the order (i.e. @State or @Primitive should be at the bottom, and @SegmentParam should be above).");
        }

        // put the propInfo for segment
        propTypeInfo.putExtension(SEGMENT_PARAM_PROP_KEY, {
            // empty
        } as ISegmentParamPropInfo);

        // next we put the same info in a dictionary on the class
        if (!classInfo.segmentParams) {
            classInfo.segmentParams = {};
        }

        classInfo.segmentParams[propertyKey] = true;
        classInfo.hasSegmentParams = true;
        classInfo.hasSegments = false;
    };
}