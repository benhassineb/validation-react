import 'core-js/proposals/reflect-metadata';
import { PersonValidationRules, Person, AddressValidationRules, Address } from './person';
import { Parser } from './aurelia-binding/parser';
import { ValidationMessageParser, PropertyAccessorParser, ValidationRules, StandardValidator, ValidationMessageProvider } from './aurelia-validation';
import { ValidationController } from './validation-controller';
import { TemplatingBindingLanguage } from './aurelia-binding/templating-binding-language';

export class ViewResources {
    lookupFunctions = null;
};
 
export const initValidator = () => {
    const parser = new Parser();
    const templatingBindingLanguage = new TemplatingBindingLanguage(parser);
    const messageParser = new ValidationMessageParser(templatingBindingLanguage);

    const propertyParser = new PropertyAccessorParser(parser);

    ValidationRules.initialize(messageParser, propertyParser);
    const validator = new StandardValidator(new ValidationMessageProvider(messageParser), new ViewResources());

    initValidationRules(ValidationRules);

    return validator;

}

export const validationControllerInstance = () => {
    return new ValidationController(initValidator());
}
export const initCustomRules = (validationRules) => {
    validationRules.customRule(
        'date',
        (value, obj) => value === null || value === undefined || value instanceof Date,
        `\${$displayName} must be a Date.`
    );
}

export const initValidationRules = (validationRules) => {
    initCustomRules(validationRules);
    PersonValidationRules(validationRules).on(Person);
    AddressValidationRules(validationRules).on(Address);
}


