export class Person {
    constructor(firstName, lastName, email, birthday) {

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.birthday = birthday;
        this.address = new Address();
    }
}

export class Address {
    constructor(country, city, region, zip, street) {

        this.country = country;
        this.region = region;
        this.city = city;
        this.zip = zip;
        this.street = street;
    }
}




export const AddressValidationRules = (validationRules) => validationRules
    .ensure('country').required()
    .ensure('region').required()
    .ensure('city').required()
    .ensure('street').required();


export const PersonValidationRules = (validationRules) => validationRules
    .ensure('firstName').required()
    .ensure('lastName').required()
    .ensure('email').required().then().email()
    .ensure('birthday').displayName('dated').required().then().satisfiesRule('date');





