import {AbstractSkeletosComponent, ISkeletosProps} from "./AbstractSkeletosComponent";
import {AbstractSkeletosState, ISkeletosDbListener} from "../../core";

/**
 * The Root component listens to any changes in the Skeletos database and updates accordingly.
 */
export abstract class AbstractRootComponent<SkeletosStateType extends AbstractSkeletosState, ExtraPropsType={}>
    extends AbstractSkeletosComponent<SkeletosStateType, ExtraPropsType, IAppContainerState> {

    private _onDbChange: ISkeletosDbListener;

    componentWillMount(): void {
        super.componentWillMount();

        this.state = {
            numberOfTimesChanged: 0
        };
        this._onDbChange = this.onDbChange.bind(this);
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (process.env.RENDER_ENV !== "server") {
            this.skeletosState.cursor.db.addListener(this._onDbChange);
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        if (process.env.RENDER_ENV !== "server") {
            this.skeletosState.cursor.db.removeListener(this._onDbChange);
        }
    }

    componentWillReceiveProps(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                              nextContext: any): void {
        super.componentWillReceiveProps(nextProps, nextContext);
        if (process.env.RENDER_ENV !== "server") {
            this.skeletosState.cursor.db.removeListener(this._onDbChange);
            nextProps.skeletosState.cursor.db.addListener(this._onDbChange);
        }
    }

    shouldComponentUpdate(nextProps: Readonly<ISkeletosProps<SkeletosStateType> & ExtraPropsType>,
                          nextState: IAppContainerState,
                          nextContext: any): boolean {
        /**
         * If we are in development mode, then we expect the ClientBootstrap.tsx to hot-reload this component, in which case,
         * we also want to update the root component (remember that hot-reload doesn't change state, so our state
         * hash will be the same leading the super.shouldComponentUpdate() to always return false here...which is not
         * what we want for hot-reload).
         */
        if (process.env.NODE_ENV !== "production") {
            return true;
        } else {
            return super.shouldComponentUpdate(nextProps, nextState, nextState);
        }
    }

    abstract render(): JSX.Element;

    /**
     * Overridden
     *
     * @param nextState
     * @param currentState
     * @returns {boolean}
     */
    protected isLocalStateIdentical(nextState: IAppContainerState,
                                    currentState: IAppContainerState): boolean {
        return nextState.numberOfTimesChanged === currentState.numberOfTimesChanged;
    }

    private onDbChange(): void {
        this.setState({
            numberOfTimesChanged: this.state.numberOfTimesChanged + 1
        });
    }
}



/**
 * Just a dummy state so that we can update the root component whenever the database supplied as props changes.
 */
export interface IAppContainerState {
    numberOfTimesChanged: number;
}