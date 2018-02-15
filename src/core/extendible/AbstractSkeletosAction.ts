// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************
import _ = require("lodash");
import {LoadingState} from "../reusable/states/LoadingState";
import {ErrorState} from "../reusable/states/ErrorState";
import {SkeletosTransaction} from "../base/SkeletosTransaction";
import {SkeletosCursor} from "../base/SkeletosCursor";
import {ISkeletosCommand} from "./ISkeletosCommand";
import {AbstractSkeletosState} from "./AbstractSkeletosState";
import {AbstractProgressAction} from "./AbstractProgressAction";

/**
 * A Skeletos action is the place where you would modify any Skeletos state. For example, you can
 * modify state based on some user interaction, or you can modify state as a result of retrieving data from the server.
 * You can even modify state "in anticipation" of modification calls to the server before the calls are returned (a
 * technique known as optimistic updates).
 *
 * 1. An action is composed of multiple commands. The action can execute these commands in parallel, sequentially or
 * in some defined order. Under the covers, the action uses async.auto(..) to determine the pipeline of commands
 * that need to be executed. See getCommands(..).
 *
 * 2. Each action gets a unique SkeletosTransaction which it uses to perform all state modifications under. Whenever
 * an error occurs as part of the action's commands, this transaction is rolled back.
 *
 * 3. Every action can have some loading or error state that you can set. When set, the action will set loading in
 * loading state at the beginning of the action, and will unset loading in the loading state at the end of the action.
 * Additionally, if error state is set, the action will use error state to post details of the errorMessage.
 */
export abstract class AbstractSkeletosAction<RootStateType extends AbstractSkeletosState=AbstractSkeletosState>
    extends AbstractProgressAction {

    protected _loadingState: LoadingState;
    protected _errorState: ErrorState;

    private _transaction: SkeletosTransaction;
    private _rootCursor: SkeletosCursor;

    /**
     * Creates a new action.
     *
     * If you have attributes/variables that you want to initialize, do it in the
     * AbstractSkeletosAction#doBeforeExecute(). That function is a good chance to initialize variables instead of
     * initializing variables in the constructor. The problem with initializing variables in the constructor is that if
     * this action is encapsulated within another action, then you may not currently have all the data to initialize
     * variables with.
     *
     * @param dbOrTransaction Supply the database on top of which you want to performance the action or the transaction
     * you want to use. If you supply a database, a new transaction will be created for you.
     * @param loadingState
     * @param errorState
     */
    constructor(rootCursor: SkeletosCursor, loadingState?: LoadingState, errorState?: ErrorState) {
        super();

        this._rootCursor = rootCursor;

        // this action may be being called from another action, in which case, we want
        // to reuse any transaction that has already been set
        if (rootCursor.transaction) {
            this._transaction = rootCursor.transaction;
        } else {
            this._transaction = new SkeletosTransaction(this._actionName, rootCursor.db);
        }

        if (loadingState) {
            this._loadingState = new LoadingState(loadingState, this._transaction);
        }

        if (errorState) {
            this._errorState = new ErrorState(errorState,  new SkeletosTransaction(this._actionName + " error", rootCursor.db));
        }
    }

    /**
     * This method gets called right before the action is executed. It is a good chance to initialize variables instead
     * of initializing variables in the constructor. The problem with initializing variables in the constructor is that
     * if this action is encapsulated within another action, then you may not currently have all the data to initialize
     * variables with. For example, you may not have the proper SkeletosTransaction to reconstruct the SkeletosStates
     * with.
     *
     * For this reason, this overridden method goes through each field of type AbstractSkeletosState and makes sure
     * that it is constructed with the transaction this action was supplied with.
     *
     * This action also shows the loading action.
     *
     * Make sure you call super.doBeforExecute(..) in your subclass overridden method.
     */
    protected doBeforeExecute(): void {
        _.forEach(this, (value: any, key: string) => {
            if (value instanceof AbstractSkeletosState) {
                value = new (value as any).constructor(value, this.transaction);
                this[key] = value;
            }
        });

        this.showLoading(this.getLoadingMessage());
    }

    /**
     * Gets the root cursor of the database we are operating on.
     *
     * For example, if you need to get a new RootStateWeb, you can do:
     *      `const rootState: RootStateWeb = new RootStateWeb(this.rootCursor(), ... );`
     *
     * @returns {SkeletosCursor}
     */
    protected get rootCursor(): SkeletosCursor {
        return this._rootCursor;
    }

    /**
     * Returns the Root State as per the supplied stateClass constructor.
     *
     * @param stateClass
     * @returns {any}
     */
    protected getRootState(stateClass: typeof AbstractSkeletosState): RootStateType {
        return new stateClass(this.rootCursor, this.transaction) as any;
    }

    /**
     * Returns a mutable root state that can stay mutated even after there is an error in this action that incurs a
     * rollback for the transaction. Hence why the mutation is "sticky".
     *
     * Use this mutable root state only when you want to modify the root state before you throw an error, and if you
     * want this mutation to not be part of the rollback of this action's transaction.
     *
     * @param {typeof AbstractSkeletosState} stateClass
     * @returns {RootStateType}
     */
    protected getStickyMutableRootState(stateClass: typeof AbstractSkeletosState): RootStateType {
        return new stateClass(this.rootCursor, new SkeletosTransaction(this.rootCursor.db)) as any;
    }

    /**
     * That transaction that is used to track all the modifications.
     */
    protected get transaction(): SkeletosTransaction {
        return this._transaction;
    }

    /**
     * Function that gets called when the action completes either successfully or with an error.
     *
     * @param err
     */
    protected doAfterExecute(err?: Error): void {
        if (err) {
            this.transaction.rollback(err);

            // the rollback should have taken care of resetting any loading props.
            // TODO: another action may have changed the loading props...what do we do? Keep a before/after count?

            if (this._errorState) {
                this._errorState.isErrorShown = true;
                this._errorState.errorTitle = err.name;
                this._errorState.errorMessage = err.message;
                this._errorState.stack = err.stack;

                // tslint:disable-next-line:no-string-literal
                this._errorState.details = err["details"];
            }
        } else {
            if (this._errorState) {
                this._errorState.isErrorShown = false;
                this._errorState.errorTitle = null;
                this._errorState.errorMessage = null;
                this._errorState.stack = null;
                this._errorState.details = null;
            }

            if (this._loadingState && this._loadingState.loadingCount > 0) {
                this._loadingState.loadingCount--;
            }
        }
    }

    /**
     * Override this to provide a custom loading message. The message will be inserted into loadingState if it was
     * defined.
     *
     * @returns {string}
     */
    protected getLoadingMessage(): string {
        return "";
    }

    /**
     * When specifying the command map in getCommands(..), use this function to wrap another action within this action.
     *
     * @param action
     */
    protected callAnotherAction(action: AbstractSkeletosAction): ISkeletosCommand {
        // share the same transaction
        action._transaction = this._transaction;
        action._errorState = this._errorState;
        action._loadingState = this._loadingState;

        return super.callAnotherAction(action);
    }

    /**
     * Display loading errorMessage and increases the loading count.
     *
     * @param message
     * @param executeAsCommand whether this action is being executed as a command of another action
     * @returns {function(ErrorCallback=): void}
     */
    private showLoading(message?: string): void {
        if (this._loadingState) {
            if (!this._loadingState.loadingCount) {
                this._loadingState.loadingCount = 1;
            } else {
                this._loadingState.loadingCount++;
            }
            if (message) {
                this._loadingState.loadingMessage = message;
            }
        }
    }
}