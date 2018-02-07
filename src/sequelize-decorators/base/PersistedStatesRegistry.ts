import {AbstractSkeletosState} from "../../core";

export class PersistedStatesRegistry {

    /**
     * States that are persisted in the database. The key is the name of the table.
     */
    public static persistedStates: _.Dictionary<AbstractSkeletosState> = {};
}