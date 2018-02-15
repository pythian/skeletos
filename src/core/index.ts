// *******************************************************************************
// © The Pythian Group Inc., 2017
// All Rights Reserved.
// *******************************************************************************

import {defineProcessEnv} from "./helpers/bootstrap";

defineProcessEnv();

// base package
export {SkeletosCursor} from "./base/SkeletosCursor";
export {SkeletosDb, ISkeletosDbListener, SkeletosDbSetterOptions, TreeNodeValueType} from "./base/SkeletosDb";
export {SkeletosTransaction} from "./base/SkeletosTransaction";


// decorators package
export {ClassTypeInfo} from "./decorators/helpers/ClassTypeInfo";
export {MetadataRegistry} from "./decorators/helpers/MetadataRegistry";
export {PropTypeInfo, EPropType} from "./decorators/helpers/PropTypeInfo";
export {Cursor} from "./decorators/Cursor";
export {Dictionary} from "./decorators/Dictionary";
export {DictionaryRef} from "./decorators/DictionaryRef";
export {Id, IS_ID_PROP_KEY, ID_PROP_KEY} from "./decorators/Id";
export {List} from "./decorators/List";
export {ListRef} from "./decorators/ListRef";
export {Primitive} from "./decorators/Primitive";
export {PrimitiveRef} from "./decorators/PrimitiveRef";
export {State} from "./decorators/State";
export {StateClass, IStateClassMetaDataOptions, STATE_META_DATA_KEY} from "./decorators/StateClass";
export {StateRef} from "./decorators/StateRef";


// extendible package
export {AbstractAction} from "./extendible/AbstractAction";
export {AbstractProgressAction} from "./extendible/AbstractProgressAction";
export {AbstractSkeletosAction} from "./extendible/AbstractSkeletosAction";
export {SimpleSkeletosAction} from "./extendible/SimpleSkeletosAction";
export {AbstractSkeletosPromiseAction} from "./extendible/AbstractSkeletosPromiseAction";
export {SimpleSkeletosPromiseAction} from "./extendible/SimpleSkeletosPromiseAction";
export {AbstractPromiseAction} from "./extendible/AbstractPromiseAction";
export {AbstractSkeletosState} from "./extendible/AbstractSkeletosState";
export {ISkeletosCommand} from "./extendible/ISkeletosCommand";


// reusable package
export {ResetLoadingStatesAction, ILoadingStateToReset} from "./reusable/actions/ResetLoadingStatesAction";
export {ISimpleDictionaryReferenceRemoverActionArg, SimpleDictionaryReferenceRemoverAction} from "./reusable/actions/SimpleDictionaryReferenceRemoverAction";
export {ISimpleDictionaryReferenceSetterActionArg, SimpleDictionaryReferenceSetterAction} from "./reusable/actions/SimpleDictionaryReferenceSetterAction";
export {SimpleStateSetterAction, ISimpleStateSetterActionArg} from "./reusable/actions/SimpleStateSetterAction";

export {BooleanState} from "./reusable/states/BooleanState";
export {DateState} from "./reusable/states/DateState";
export {ErrorState} from "./reusable/states/ErrorState";
export {LoadingAndErrorState} from "./reusable/states/LoadingAndErrorState";
export {LoadingState} from "./reusable/states/LoadingState";
export {NoopAction} from "./reusable/states/NoopAction";
export {NumberState} from "./reusable/states/NumberState";
export {SkeletosDictionary} from "./reusable/states/SkeletosDictionary";
export {SkeletosList} from "./reusable/states/SkeletosList";
export {StringState} from "./reusable/states/StringState";


// helpers package
export {generateUniqueId} from "./helpers/generateUniqueId";
export {ProcessEnvUtils} from "./helpers/ProcessEnvUtils";
export {UrlUtils} from "./helpers/UrlUtils";
export * from "./helpers/logging/ConsoleLogger";
export * from "./helpers/logging/DefaultLogger";
export {ELogLevel} from "./helpers/logging/ELogLevel";
export {ErrorWithLevel} from "./helpers/logging/ErrorWithLevel";
export {ILogger} from "./helpers/logging/ILogger";
export {ErrorUtil} from "./helpers/logging/ErrorUtil";


// only to be used by frameworks building on top
export {ITreeNode} from "./base/SkeletosDb";