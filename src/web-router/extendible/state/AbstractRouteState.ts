import _ = require("lodash");
import {ClassTypeInfo, EPropType, LoadingAndErrorState, Primitive, PropTypeInfo} from "../../../core";
import {IRouteStateClassInfo, ROUTESTATE_CLASS_KEY} from "../../base/IRouteStateClassInfo";
import {AbstractRouteAction} from "../actions/AbstractRouteAction";

export abstract class AbstractRouteState extends LoadingAndErrorState {

    /**
     * The current route represents the segment in the URL that is being used at this route location.
     *
     * For example, given a URL
     *
     * /a/b/c
     *
     * If a is represented by RouteA, b by RouteB, c by RouteC, and there exists a RootRoute (extends
     * AbstractRootRouteState), then:
     *
     * 1. RootRoute.currentRoute == "a";
     * 2. RouteA.currentRoute == "b";
     * 3. RouteB.currentRoute == "c";
     * 4. RouteC.currentRoute == null || undefined;
     */
    @Primitive()
    currentRoute: string | number;

    /**
     * Return an action class that can be constructed and executed when this route are updated.
     *
     * An updated route can mean that either:
     *
     * 1. This route is now used because its parent container route uses a currentRoute that corresponds to this
     * RouteState (i.e. this route was mounted). The returned action class in this case will be constructed with
     * oldRoute=null and newRoute=this.
     *
     * 2. This route is no longer used because its parent container route now has a different currentRoute that does
     * not correspond to this RouteState. The returned action class will be constructed with oldRoute=this and
     * newRoute=null.
     *
     * 3. This route's currentRoute attribute has changed, indicating that a child segment is now different.
     *
     * 4. one or more of the query parameters in this route have changed. The returned action class in this case will be
     * constructed with oldRoute=(old instance of this class) and newRoute=this.
     *
     * ---------------
     *
     * Note that the different between onRouteUpdated* and onRouteTreeUpdated* methods is that onRouteUpdated* are only
     * called when this specific route changes, whereas onRouteTreeUpdated* are called when any route in the child
     * hierarchy of this route changes.
     *
     * ---------------
     *
     * Routes are updated top-down synchronously, so parent routes will be updated first, followed by their children
     * routes.
     *
     * For example, given a URL /a/b/c, where segment a corresponds to RouteA, b to RouteB, and c to RouteC, in this
     * case:
     * 1. RouteA will be updated first,
     * 2. followed by RouteB,
     * 3. finally followed by RouteC.
     *
     * The action returned from this method will only be called only when all the onRouteUpdatedSync-actions of
     * parent routes have been executed, hence why it is 'synchronous' to all the parent routes mounting first.
     *
     * For example, you can use this method to load data that can only be fetched once the data from parent routes is
     * loaded (because you need some context or a project ID for example from the parent route).
     *
     * @returns {AbstractRouteAction}
     */
    onRouteUpdatedSync(): typeof AbstractRouteAction {
        return null;
    }

    /**
     *
     * Return an action class that can be constructed and executed when this route are updated.
     *
     * An updated route can mean that either:
     *
     * 1. This route is now used because its parent container route uses a currentRoute that corresponds to this
     * RouteState (i.e. this route was mounted). The returned action class in this case will be constructed with
     * oldRoute=null and newRoute=this.
     *
     * 2. This route is no longer used because its parent container route now has a different currentRoute that does not
     * correspond to this RouteState. The returned action class in this will be constructed with oldRoute=this and
     * newRoute=null.
     *
     * 3. This route's currentRoute attribute has changed, indicating that a child segment is now different. Or, one or
     * more of the query parameters in this route have changed. The returned action class in this case will be
     * constructed with oldRoute=(old instance of this class) and newRoute=this.
     *
     * ---------------
     *
     * The action class returned from this method will be called regardless of whether or not all the
     * onRouteUpdatedAsync-actions of the parent routes have finished executing, hence why it is 'asynchronous'.
     *
     * For example, you can use this method to load data that does **not** depend on the data loaded by parent routes.
     *
     * If you do want to depend on the order of update actions of parent routes, consider using #onRouteUpdatedSync()
     * instead.
     *
     * @returns {AbstractRouteAction}
     */
    onRouteUpdatedAsync(): typeof AbstractRouteAction {
        return null;
    }

    /**
     * Return an action class that can be constructed and executed when this route or any of the children routes
     * are updated.
     *
     * See description of #onRouteUpdatedSync() for more information and difference.
     *
     * @returns {AbstractRouteAction}
     */
    onRouteTreeUpdatedSync(): typeof AbstractRouteAction {
        return null;
    }

    /**
     * Return an action class that can be constructed and executed when this route or any of the children routes
     * are updated.
     *
     * See description of #onRouteUpdatedAsync() for more information and difference.
     *
     * @returns {AbstractRouteAction}
     */
    onRouteTreeUpdatedAsync(): typeof AbstractRouteAction {
        return null;
    }

    /**
     * If this route can be rendered server side, return true. If it can't (for example, it has some components that
     * only work with a real DOM) then return false.
     *
     * @returns {boolean}
     * Default: true
     */
    canRenderServerSide(): boolean {
        return true;
    }

    /**
     * Gets the current route state from this.currentRoute.
     * 
     * See description of #currentRoute for more details.
     *
     * @returns {AbstractRouteState}
     */
    getCurrentRouteState(): AbstractRouteState {
        if (this.currentRoute) {
            // need to figure out the route state from the current route string.
            // let's use the segment class info
            const classInfo: IRouteStateClassInfo = ClassTypeInfo.maybeGetExtension(this, ROUTESTATE_CLASS_KEY);
            if (classInfo) {

                if (classInfo.hasSegments) {
                    const segment = classInfo.segments[this.currentRoute];
                    return this[segment];
                }

                if (classInfo.hasSegmentParams) {
                    let ret: AbstractRouteState = null;
                    _.forEach(
                        classInfo.segmentParams, (value: true, key: string) => {
                            const propTypeInfo = PropTypeInfo.getPropTypeInfo(this, key);
                            if (propTypeInfo.propType === EPropType.state) {
                                ret = this[key];
                            }
                        });

                    return ret;
                }
            }
        }

        // there is no current route defined.
        return null;
    }
}