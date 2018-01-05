// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import {AbstractSkeletosComponent, ISkeletosProps} from "./AbstractSkeletosComponent";
import {AbstractSkeletosState} from "../../core/extendible/AbstractSkeletosState";

/**
 * A simple subclass of AbstractSkeletosComponent that:
 *
 * 1. Does not have any React Component State (i.e. is a functionally stateless component).
 *
 * 2. Does not have any extra Props.
 */
export abstract class SimpleSkeletosComponent<StateType extends AbstractSkeletosState>
    extends AbstractSkeletosComponent<StateType, {}, {}> {

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
    componentWillReceiveProps(nextProps: ISkeletosProps<StateType>,
                              nextContext: any): void {
        super.componentWillReceiveProps(nextProps, nextContext);
        this.setState({}); // empty state
    }

    /**
     * Invoked once, both on the client and server, immediately before the initial rendering occurs.
     * If you call setState within this method, render() will see the updated state and will be executed only once
     * despite the state change.
     */
    componentWillMount(): void {
        super.componentWillMount();
        this.setState({}); // empty state
    }
}