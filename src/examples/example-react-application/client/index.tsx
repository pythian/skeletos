import {ExampleAppClientRenderAction} from "./ExampleAppClientRenderAction";

const HOT_MODULE_REF: string = "hot";
declare const module: any;

let action: ExampleAppClientRenderAction;

if (module && module[HOT_MODULE_REF]) {
    module[HOT_MODULE_REF].accept(
        () => {
            action = new ExampleAppClientRenderAction();
            action.execute();
        }
    );

    module[HOT_MODULE_REF].dispose(
        () => {
            action.onBeforeHotModuleReload();
        }
    );
}

action = new ExampleAppClientRenderAction();
action.execute();