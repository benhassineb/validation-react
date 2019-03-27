
import {ValidationRules,} from 'aurelia-validation';


export class Person {
    constructor(firstName, lastName, email, birthday) {

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.birthday = birthday;
    }
}





export const PersonValidationRules = () => ValidationRules
    .ensure('firstName').required()
    .ensure('lastName').required()
    .ensure('email').email().required()
    .ensure('birthday').displayName('dated').required().satisfiesRule('date');





