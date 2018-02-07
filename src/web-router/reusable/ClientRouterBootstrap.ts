// import history = require("history");
// import {AbstractRootRouteState} from "../extendible/state/AbstractRootRouteState";
// import {AbstractRouteState, RouteBuilder} from "../";
// import {ErrorUtil, getDefaultLogger, SkeletosTransaction} from "../../core";
// import {ILoadingStateToReset} from "../base/ILoadingStateToReset";
// import {IClientLocationChangeListener} from "./IClientLocationChangeListener";
// import {FireRouteUpdateAction} from "./FireRouteUpdateAction";
// import {IClientPromptLeavePageListener} from "./IClientPromptLeavePageListener";
// import {Action, Location} from "history";
//
// export class ClientRouterBootstrap {
//
//     static initialize(rootRoute: AbstractRootRouteState, onUrlChangeListener?: IClientLocationChangeListener): void {
//         if (typeof window !== "undefined") {
//             new ClientRouterBootstrap(rootRoute);
//         } else {
//             throw new Error("ClientRouterBootstrap can only be initialized on the client side.");
//         }
//     }
//
//     /**
//      *
//      */
//     private currentRootRoute: AbstractRootRouteState;
//     private oldRootRoute: AbstractRootRouteState;
//     private browserHistory: history.History;
//     private currentLocation: history.Location;
//     private onUrlChangeListeners: IClientLocationChangeListener[];
//     private promptLeavePageListeners: IClientPromptLeavePageListener[];
//
//     private constructor(rootRoute: AbstractRootRouteState,
//                         onUrlChangeListeners?: IClientLocationChangeListener[],
//                         promptLeavePageListeners?: IClientPromptLeavePageListener[]) {
//         this.loadHistory();
//
//         this.currentRootRoute =
//             new (rootRoute as any).constructor(rootRoute, new SkeletosTransaction(rootRoute.cursor.db));
//         this.setOldState();
//
//         this.currentRootRoute.cursor.db.addListener(this.onStateChange.bind(this));
//
//         this.onUrlChangeListeners = onUrlChangeListeners;
//         this.promptLeavePageListeners = promptLeavePageListeners;
//
//         if (promptLeavePageListeners) {
//             this.browserHistory.block((location: Location, action: Action): string | false | void => {
//                 return this.getLeavePagePrompt(this.currentRootRoute);
//             });
//         }
//     }
//
//     private fireOnUrlChangeListeners(oldState: AbstractRootRouteState, newState: AbstractRootRouteState): void {
//         const oldUrl: string = RouteBuilder.clone(oldState).buildString();
//         const newUrl: string = RouteBuilder.clone(newState).buildString();
//
//         if (this.onUrlChangeListeners) {
//             for (const urlChangeListener of this.onUrlChangeListeners) {
//                 try {
//                     urlChangeListener(oldState, oldUrl, newState, newUrl);
//                 } catch (e) {
//                     getDefaultLogger().error(
//                         ErrorUtil.customize(e, "An error occurred while calling a URL change listener."));
//                 }
//             }
//         }
//     }
//
//     private getLeavePagePrompt(newState: AbstractRootRouteState): string|false {
//         if (this.promptLeavePageListeners) {
//             for (const leavePageListener of this.promptLeavePageListeners) {
//                 try {
//                     const message: string = leavePageListener(newState);
//                     if (message) {
//                         return message;
//                     }
//                 } catch (e) {
//                     getDefaultLogger().error(
//                         ErrorUtil.customize(e, "An error occurred while calling a leave page listener."));
//                 }
//             }
//         }
//
//         return false;
//     }
//
//     private setOldState(): void {
//         this.oldRootRoute = RouteBuilder.clone(this.currentRootRoute).build();
//     }
//
//     private loadHistory(): void {
//         if (window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF]) {
//             window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF]();
//         }
//
//         const historyOptions: history.BrowserHistoryBuildOptions = {
//             basename: ""
//         };
//
//         this.browserHistory = history.createBrowserHistory(historyOptions);
//
//         window[HISTORY_LISTENER_UNREGISTER_CALLBACK_REF] = this.browserHistory.listen(
//             (location: history.Location) => {
//                 if (window[HISTORY_LISTENER_REF]) {
//                     window[HISTORY_LISTENER_REF](location);
//                 }
//             }
//         );
//     }
//
//     private onStateChange(): void {
//         if (!this.oldRootRoute.changeUrlToReflectCurrentState && this.currentRootRoute.changeUrlToReflectCurrentState) {
//
//         }
//         //
//         //
//         // const newRouteState: RouteContainerState = new RouteContainerState(this._routeContainer, this.transaction);
//         //
//         // if (!newRouteState.isEqualsTo(this._routeContainer)) {
//         //     if (this._routeContainer.changeUrlToReflectCurrentState) {
//         //         this._routeContainer.changeUrlToReflectCurrentState = false;
//         //
//         //         const location: history.Location = this._history.createLocation(newRouteState.syncRouteToUrl(), {});
//         //
//         //         this._history.push(location);
//         //
//         //         // TODO should this be contained in the action itself? Would it be lagging after the action above is
//         //         // executed asynchronously?
//         //         document.title = newRouteState.pageMetadata.title;
//         //     }
//         //
//         //     // use the latest copy
//         //     this._routeContainer = new RouteContainerState(newRouteState, this.transaction);
//         // }
//     }
//
//     private onHistoryChange(location: history.Location): void {
//         const isSameLoc: boolean = location && this.currentLocation &&
//             // ensure the paths are the same
//             this.currentLocation.pathname === location.pathname &&
//             // ensure the query is the same
//             _.isEqual(this.currentLocation.search, location.search);
//
//
//         const routes: AbstractRouteState[] = [this.currentRootRoute];
//         let currentIndex: number = 0;
//         const loadingStatesToReset: ILoadingStateToReset[] = [];
//
//         /**
//          * Go through the entire route hierarchy and determine which routes are currently in a loading state. Save a
//          * reference to that loading state and the current value of its loading count. This value is important because
//          * it's the exact amount that we will decrease the loading count by after all the route actions has completed.
//          */
//         while (currentIndex < routes.length) {
//             const currentRoute: AbstractRouteState = routes[currentIndex];
//             currentIndex++;
//
//             // Record a ref to the loading state and its current loading count value
//             if (currentRoute.loadingCursor.exists() && currentRoute.loading.isLoading()) {
//                 loadingStatesToReset.push({
//                     loadingState: currentRoute.loading,
//                     amountToDecrement: currentRoute.loading.loadingCount
//                 });
//             }
//
//             for (let key in currentRoute) {
//                 if (currentRoute[key] instanceof AbstractRouteState) {
//                     routes.push(currentRoute[key]);
//                 }
//             }
//         }
//
//         if (!isSameLoc) {
//             if (this.onUrlChangeListener) {
//                 this.onUrlChangeListener(this.locationToString(location), this.locationToString(this.currentLocation));
//             }
//
//             this.currentLocation = location;
//
//             setTimeout(() => {
//                 new FireRouteUpdateAction(this.rootRoute, this.oldRootRoute).execute();
//             }, 0);
//
//         } else {
//             // In the event that the route has not changed, we still want to reset the loading state.
//             new ResetLoadingStatesAction(this._routeContainer.cursor.root(), loadingStatesToReset).execute();
//         }
//     }
//
//     private locationToString(location: history.Location) {
//         let loc: string = location.pathname;
//         if (location.search && location.search.length > 0) {
//             loc += "?" + location.search;
//         }
//         if (location.hash && location.hash.length > 0) {
//             loc += "#" + location.hash;
//         }
//
//         return loc;
//     }
// }
//
// declare const window: object;
// const HISTORY_LISTENER_REF: string = "HISTORY_LISTENER_REF";
// const HISTORY_LISTENER_UNREGISTER_CALLBACK_REF: string = "HISTORY_LISTENER_UNREGISTER_CALLBACK_REF";