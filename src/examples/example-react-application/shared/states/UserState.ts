import {Primitive, StateClass} from "../../../../core";
import {AbstractDbItem} from "./AbstractDbItem";
import {Validate} from "../../../../validate";


@StateClass("UserState")
export class UserState extends AbstractDbItem {

    @Validate((joi) => joi.string().required().alphanum().trim().min(1)
        .max(50)
        .label("First Name")
        .description("User's first name."))
    @Primitive()
    firstName: string;

    @Validate((joi) => joi.string().required().alphanum().trim().min(1)
        .max(50)
        .label("Last Name")
        .description("User's last name."))
    @Primitive()
    lastName: string;

    @Validate((joi) => joi.string().required().alphanum().trim().min(3)
        .max(50)
        .label("Username")
        .description("The user's unique username."))
    @Primitive()
    username: string;

    @Validate((joi) => joi.string().email({}))
    @Primitive()
    email: string;


}