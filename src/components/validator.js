import 'core-js/proposals/reflect-metadata';
import { TemplatingBindingLanguage, SyntaxInterpreter } from 'aurelia-templating-binding';
import { Parser } from 'aurelia-binding';
import { ViewResources } from 'aurelia-templating';

import {
    ValidationMessageParser,
    PropertyAccessorParser,
    ValidationRules,
    StandardValidator,
    ValidationMessageProvider
} from 'aurelia-validation';
import { PersonValidationRules, Person, AddressValidationRules, Address } from './person';
import { ValidationController } from './validation-controller';


export const initValidator = () => {
    const parser = new Parser();
    const templatingBindingLanguage = new TemplatingBindingLanguage(parser, null, new SyntaxInterpreter());
    const messageParser = new ValidationMessageParser(templatingBindingLanguage);
    const propertyParser = new PropertyAccessorParser(parser);
    ValidationRules.initialize(messageParser, propertyParser);
    const validator = new StandardValidator(new ValidationMessageProvider(messageParser), new ViewResources());

    initValidationRules();

    return validator;

}

export const validationControllerInstance = () => {
    return new ValidationController(initValidator());
}
export const initCustomRules = () => {
    ValidationRules.customRule(
        'date',
        (value, obj) => value === null || value === undefined || value instanceof Date,
        `\${$displayName} must be a Date.`
    );
}

export const initValidationRules = () => {
    initCustomRules();
    PersonValidationRules().on(Person);
    AddressValidationRules().on(Address);
}


