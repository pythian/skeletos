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
export {LoadingAndErrorState} from "./reusable/LoadingAndErrorState";
export {BooleanState} from "./reusable/BooleanState";
export {DateState} from "./reusable/DateState";
export {ErrorState} from "./extendible/ErrorState";
export {LoadingState} from "./extendible/LoadingState";
export {NoopAction} from "./reusable/NoopAction";
export {NumberState} from "./reusable/NumberState";
export {ISimpleDictionaryReferenceRemoverActionArg, SimpleDictionaryReferenceRemoverAction} from "./reusable/SimpleDictionaryReferenceRemoverAction";
export {ISimpleDictionaryReferenceSetterActionArg, SimpleDictionaryReferenceSetterAction} from "./reusable/SimpleDictionaryReferenceSetterAction";
export {SimpleStateSetterAction, ISimpleStateSetterActionArg} from "./reusable/SimpleStateSetterAction";
export {SkeletosDictionary} from "./reusable/SkeletosDictionary";
export {SkeletosList} from "./reusable/SkeletosList";
export {StringState} from "./reusable/StringState";


// helpers package
export {generateUniqueId} from "./helpers/generateUniqueId";
export * from "./helpers/logging/ConsoleLogger";
export * from "./helpers/logging/DefaultLogger";
export {ELogLevel} from "./helpers/logging/ELogLevel";
export {ErrorWithLevel} from "./helpers/logging/ErrorWithLevel";
export {ILogger} from "./helpers/logging/ILogger";
export {ErrorUtil} from "./helpers/logging/ErrorUtil";


// only to be used by frameworks building on top
export {ITreeNode} from "./base/SkeletosDb";