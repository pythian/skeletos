import * as React from "react";
import _ = require("lodash");

import {AbstractSkeletosState, ITreeNode} from "../../core";

/**
 * AbstractSkeletosComponent should be the super-class (directly or indirectly) of all Skeletos-based components.
 *
 * This component might be too general purpose for your direct use. Use SimpleSkeletosComponent instead
 * when starting out writing a component.
 *
 * Notes:
 * 1. AbstractSkeletosComponent works with a single subclass of AbstractSkeletosState. It is recommended that
 * you isolate your UI state from your data state, and reference data state from your UI state. Supply
 * UI state to AbstractSkeletosComponent.
 *
 * 2. Do not confuse Skeletos State and React Component State:
 *      - SkeletosState is the state that you built by subclassing AbstractSkeletoState. It is managed
 *          centrally by the SkeletosDb and interacts with SkeletosCursor.
 *      - ReactComponentState is the local state that is managed by the React component and does not leave
 *          the bounds of the component it is set in. Use this to manage temporary component state (for e.g.
 *          managing focus or text selection in a text box).
 *
 * 3. Sometimes, you would want to pass down props to a component but not have it managed centrally by the
 * SkeletosState. For example, this is when you want to configure a child component to behave in a certain way.
 * To aid in this, use the ExtraPropsType to supply an interface with extra props that you want to pass down.
 *
 * 4. AbstractSkeletosComponent does fast equality comparisons between the SkeletosState it was supplied and the next
 * state SkeletosState, but it does not do comparisons for anything else such as the ExtraProps and
 * ReactComponentState. If you have supplied these, then you will need to override
 * AbstractSkeletosComponent#areExtraPropsIdentical(..) and AbstractSkeletosComponent#isLocalStateIdentical(..) to
 * compare them.
 *
 * 5. SkeletosState MUST NOT be modified within the component. If you want to modify the state, write an action
 * and have it go through a proper transaction. See AbstractSkeletosAction.
 *
 */
export abstract class AbstractSkeletosComponent
    <SkeletosStateType extends AbstractSkeletosState, ExtraPropsType={}, ReactComponentStateType={}>
    extends React.Component<ISkeletosProps<SkeletosStateType> & ExtraPropsType, ReactComponentStateType> {

    /**
     * !Important! Subclasses are not expected to override this. See
     * AbstractSkeletosComponent#areExtraPropsIdentical(..) and AbstractSkeletosComponent#isLocalStateIdentical(..) if
     * you want to compare extra props and local state respectively.
     *
     * Invoked before rendering when new props or state are being received. This method is not called for the initial
     * render or when forceUpdate is used.
     *
     * Use this as an opportunity to return false when you're certain that the transition to the new props and state
     * will not require a component update.
     *
     * @param nextProps
     * @param nextState
     * @param nextContext
     */
    shouldComponentUpdate(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                          nextState: Readonly<ReactComponentStateType>,
                          nextContext: any): boolean {

        if ((nextProps && !this.props) || (!nextProps && this.props)) {
            return true;
        } else if (nextProps && this.props) {
            // if we don't have a skeletos state, then short circuit...
            if (!nextProps.skeletosState) {
                return !(this.areExtraPropsIdentical(nextProps, this.props) &&
                    this.isLocalStateIdentical(nextState, this.state));
            } else {
                // need to make sure everything returns true for us to not update component.
                return !(nextProps.skeletosState.isEqualsTo(this.props.skeletosState) &&
                    this.areExtraPropsIdentical(nextProps, this.props) &&
                    this.isLocalStateIdentical(nextState, this.state));
            }
        } else {
            // both nextProps and this.props are null or undefined
            return false;
        }
    }

    /**
     * Invoked when a component is receiving new props. This method is not called for the initial render.
     *
     * Use this as an opportunity to react to a prop transition before render() is called by updating the state using
     * this.setState(). The old props can be accessed via this.props. Calling this.setState() within this function will
     * not trigger an additional render.
     *
     * @param nextProps
     * @param nextContext
     */
    componentWillReceiveProps(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                              nextContext: any): void {
        this.checkForReadOnly(nextProps);
    }

    /**
     * Invoked once, both on the client and server, immediately before the initial rendering occurs.
     * If you call setState within this method, render() will see the updated state and will be executed only once
     * despite the state change.
     */
    componentWillMount(): void {
        this.checkForReadOnly(this.props);
    }

    /**
     * Invoked once, only on the client (not on the server), immediately after the initial rendering occurs. At this
     * point in the lifecycle, you can access any refs to your children (e.g., to access the underlying DOM
     * representation). The componentDidMount() method of child components is invoked before that of parent components.
     *
     * If you want to integrate with other JavaScript frameworks, set timers using setTimeout or setInterval, or send
     * AJAX requests, perform those operations in this method.
     */
    componentDidMount(): void {
        // nothing
    }

    /**
     * Invoked immediately before rendering when new props or state are being received. This method is not called for
     * the initial render.
     *
     * Use this as an opportunity to perform preparation before an update occurs.
     */
    componentWillUpdate(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                        nextState: Readonly<ReactComponentStateType>,
                        nextContext: any): void {
        // nothing
    }

    /**
     * Invoked immediately after the component's updates are flushed to the DOM. This method is not called for the
     * initial render.
     *
     * Use this as an opportunity to operate on the DOM when the component has been updated.
     */
    componentDidUpdate(prevProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                       prevState: Readonly<ReactComponentStateType>,
                       prevContext: any): void {
        // nothing
    }

    /**
     * Invoked immediately before a component is unmounted from the DOM.
     *
     * Perform any necessary cleanup in this method, such as invalidating timers or cleaning up any DOM elements that
     * were created in componentDidMount.
     */
    componentWillUnmount(): void {
        // nothing
    }

    setState<K extends keyof ReactComponentStateType>(
        state: Pick<ReactComponentStateType, K>,
        callback?: () => any): void {
        if (process.env.NODE_ENV !== "production") {
            // take state setting into our own hands so we can also publish the raw skeletos DB node for debugging.

            let actualState: ReactComponentStateType = state as any;
            if (_.isFunction(state)) {
                actualState = state(this.state, this.props);
            }

            const treeNode: ITreeNode = this.props.skeletosState.cursor.getTreeNode();
            const stateToSet: object = _.extend({}, actualState, {
                __dbNode: treeNode
            });

            super.setState(stateToSet as any, callback);
        } else {
            super.setState(state as any, callback);
        }
    }

    /**
     * Override this method when you have supplied extra props that you want compared as part of shouldComponentUpdate.
     *
     * By default, it returns true as it assumes you have not supplied any extra props.
     *
     * Note: DO NOT do a deep equals check or even a shallow equals check on this object because it contains more
     * object properties than the ones you have supplied in ExtraPropsType. It is best to compare each property that
     * you have defined in ExtraPropsType separately.
     *
     * @param nextProps
     * @param currentProps
     * @returns {boolean}
     */
    protected areExtraPropsIdentical(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                                     currentProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>): boolean {
        return true;
    }

    /**
     * Override this method when you have supplied local React state that you want compared as part of
     * shouldComponentUpdate.
     *
     * By default, it returns true as it assumes you have not supplied any ReactComponentStateType.
     *
     * @param nextProps
     * @param currentProps
     * @returns {boolean}
     */
    protected isLocalStateIdentical(nextState: ReactComponentStateType,
                                    currentState: ReactComponentStateType): boolean {
        return true;
    }

    /**
     * Convenience method that returns the application state from the props.
     *
     * @returns {any}
     */
    protected get skeletosState(): SkeletosStateType {
        if (this.props && this.props.skeletosState) {
            return this.props.skeletosState;
        } else {
            return null;
        }
    }

    /**
     * Check if we were supplied modifiable app state. App state should only be modifiable within actions and commands,
     * not within components.
     *
     * @param nextProps
     */
    private checkForReadOnly(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>): void {
        // DefinePlugin removes this as dead code in production
        if (process.env.NODE_ENV !== "production") {
            if (nextProps && nextProps.skeletosState && !nextProps.skeletosState.isReadOnly) {
                throw new Error("You cannot supply a non-Readonly (i.e. Modifiable) state to a component. Please make " +
                    "the state was constructed with a read-only cursor (i.e. a cursor that does not have a transaction " +
                    "associated with it).");
            }
        }
    }
}

/**
 * Interface to be used by the AbstractSkeletosComponent. It is not expected for subclasses to extend this.
 */
export interface ISkeletosProps<StateType extends AbstractSkeletosState> {
    /**
     * The skeletos state is the subclass of AbstractSkeletosState that is supplied to this component.
     */
    skeletosState: StateType;

    /**
     * A key is a ID that is assigned to the component to make it unique among the siblings. The key helps in efficient
     * compare-merge of DOM nodes by React. If your constructing your component within an array, then definitely supply
     * a key (in fact, React will warn you if you don't).
     *
     * See following links for more info:
     * 1. https://fb.me/react-warning-keys
     * 2. http://blog.arkency.com/2014/10/react-dot-js-and-dynamic-children-why-the-keys-are-important/
     */
    key?: React.Key;

    /**
     * Children of the component.
     */
    children?: React.ReactNode;

    /**
     * After building your component, you may find yourself wanting to "reach out" and invoke methods on component
     * instances returned from render(). In most cases, this should be unnecessary because the reactive data flow always
     * ensures that the most recent props are sent to each child that is output from render(). However, there are a few
     * cases where it still might be necessary or beneficial, so React provides an escape hatch known as refs. These
     * refs (references) are especially useful when you need to find the DOM markup rendered by a component
     * (for instance, to position it absolutely).
     *
     * Read more here:
     * https://facebook.github.io/react/docs/more-about-refs.html
     */
    ref?: string | ((instance: AbstractSkeletosComponent<StateType, any, any>) => any);
}