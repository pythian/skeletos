import {ClassTypeInfo, EPropType, ErrorUtil, PropTypeInfo} from "../../core";
import {AbstractRouteState} from "../extendible/state/AbstractRouteState";
import {IRouteStateClassInfo, ROUTESTATE_CLASS_KEY} from "../base/IRouteStateClassInfo";

export const QUERY_PARAM_PROP_KEY: string = "skeletos-router.queryParam";

export interface IQueryParamProp {
    /**
     * The query parameter key.
     */
    name?: string;
}


export function QueryParam(keyName?: string): PropertyDecorator {
    return function QueryParamDecorator(target: AbstractRouteState, propertyKey: string): void {

        const queryKey: string = keyName || propertyKey;
        const splitQueryKey: string[] = queryKey.split(/[a-zA-Z0-9\~\_\-\.]+/g);
        if (splitQueryKey.length === 0) {
            throw new Error("A keyName for a @QueryParam cannot be null. See " + propertyKey + " in " +
                ErrorUtil.getDebugName(target) + ".");
        } else {
            for (const part of splitQueryKey) {
                if (part.length > 0) {
                    throw new Error("A keyName for a @QueryParam ca only be alphanumeric or have " +
                        "special characters (~, _, -, .). See " + propertyKey + " in " +
                        ErrorUtil.getDebugName(target) + ".");
                }
            }
        }

        const classTypeInfo = ClassTypeInfo.getOrCreateClassTypeInfo(target);
        const classInfo: IRouteStateClassInfo = classTypeInfo.getIfExistsOrPutExtension(ROUTESTATE_CLASS_KEY);
        if (!classInfo.queryParams) {
            classInfo.queryParams = {};
        }
        classInfo.queryParams[queryKey] = propertyKey;

        const propTypeInfo = PropTypeInfo.getOrCreatePropTypeInfo(target, propertyKey);

        // a @QueryParam can only ever be defined on a @Primitive
        if (propTypeInfo.propType !== EPropType.primitive) {
            throw new Error("A @QueryParam can only be defined on a property that also has @Primitive defined. " +
                "If you already have @Primitive defined on " +
                propertyKey + " in " + ErrorUtil.getDebugName(target) +
                ", then try switching the order (i.e. @Primitive should be at the bottom, and @QueryParam should be above @Primitive).");
        }

        // put the propInfo for segment
        propTypeInfo.putExtension(QUERY_PARAM_PROP_KEY, {
            name: queryKey
        } as IQueryParamProp);
    };
}