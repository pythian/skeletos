import {AbstractSkeletosState, Id, Primitive} from "../../../../core";

export abstract class AbstractDbItem extends AbstractSkeletosState {

    @Id()
    @Primitive()
    id: string;
}