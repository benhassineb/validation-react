import 'core-js/proposals/reflect-metadata';
import { TemplatingBindingLanguage, SyntaxInterpreter } from 'aurelia-templating-binding';
import { Parser } from 'aurelia-binding';
import { ViewResources } from 'aurelia-templating';

import {
    ValidationMessageParser,
    PropertyAccessorParser,
    ValidationRules,
    StandardValidator,
    ValidationMessageProvider,
    ValidationController,
    validateTrigger
} from 'aurelia-validation';
import { PersonValidationRules ,Person} from './person';


export const getValidationController = () => {
    const parser = new Parser();
    const templatingBindingLanguage = new TemplatingBindingLanguage(parser, null, new SyntaxInterpreter());
    const messageParser = new ValidationMessageParser(templatingBindingLanguage);
    const propertyParser = new PropertyAccessorParser(parser);
    ValidationRules.initialize(messageParser, propertyParser);
    const validator = new StandardValidator(new ValidationMessageProvider(messageParser), new ViewResources());
    const propertyAccessorParser = propertyParser;
    const validationController = new ValidationController(validator, propertyAccessorParser);
    validationController.validateTrigger = validateTrigger.manual;

    ValidationRules.customRule(
        'date',
        (value, obj) => value === null || value === undefined || value instanceof Date,
        `\${$displayName} must be a Date.`
    );
    PersonValidationRules().on(Person);


    return { validator: validator, controller: validationController };

}
