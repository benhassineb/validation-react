import { AccessMember, AccessScope, LiteralString, Binary, Conditional, LiteralPrimitive, CallMember } from "./aurelia-binding/ast";

function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}
function isNumber(value) {
    return Object.prototype.toString.call(value) === '[object Number]';
}

class PropertyAccessorParser {
    constructor(parser) {
        this.parser = parser;
    }
    parse(property) {
        if (isString(property) || isNumber(property)) {
            return property;
        }
        const accessorText = getAccessorExpression(property.toString());
        const accessor = this.parser.parse(accessorText);
        // eslint-disable-next-line
        if (accessor instanceof AccessScope || accessor instanceof AccessMember && accessor.object instanceof AccessScope) {
            return accessor.name;
        }
        throw new Error(`Invalid property expression: "${accessor}"`);
    }
}
function getAccessorExpression(fn) {
    const classic = /^function\s*\([$_\w\d]+\)\s*\{(?:\s*"use strict";)?\s*(?:[$_\w\d.['"\]+;]+)?\s*return\s+[$_\w\d]+\.([$_\w\d]+)\s*;?\s*\}$/;
    const arrow = /^\(?[$_\w\d]+\)?\s*=>\s*[$_\w\d]+\.([$_\w\d]+)$/;
    const match = classic.exec(fn) || arrow.exec(fn);
    if (match === null) {
        throw new Error(`Unable to parse accessor function:\n${fn}`);
    }
    return match[1];
}




/**
 * Validates objects and properties.
 */
class Validator {
}

/**
 * The result of validating an individual validation rule.
 */
class ValidateResult {
    /**
     * @param rule The rule associated with the result. Validator implementation specific.
     * @param object The object that was validated.
     * @param propertyName The name of the property that was validated.
     * @param error The error, if the result is a validation error.
     */
    constructor(rule, object, propertyName, valid, message = null) {
        this.rule = rule;
        this.object = object;
        this.propertyName = propertyName;
        this.valid = valid;
        this.message = message;
        this.id = ValidateResult.nextId++;
    }
    toString() {
        return this.valid ? 'Valid.' : this.message;
    }
}
ValidateResult.nextId = 0;




/**
 * Sets, unsets and retrieves rules on an object or constructor function.
 */
class Rules {
    /**
     * Applies the rules to a target.
     */
    static set(target, rules) {
        if (target instanceof Function) {
            target = target.prototype;
        }
        Object.defineProperty(target, Rules.key, { enumerable: false, configurable: false, writable: true, value: rules });
    }
    /**
     * Removes rules from a target.
     */
    static unset(target) {
        if (target instanceof Function) {
            target = target.prototype;
        }
        target[Rules.key] = null;
    }
    /**
     * Retrieves the target's rules.
     */
    static get(target) {
        return target[Rules.key] || null;
    }
}
/**
 * The name of the property that stores the rules.
 */
Rules.key = '__rules__';

class ExpressionVisitor {
    visitChain(chain) {
        this.visitArgs(chain.expressions);
    }
    visitBindingBehavior(behavior) {
        behavior.expression.accept(this);
        this.visitArgs(behavior.args);
    }
    visitValueConverter(converter) {
        converter.expression.accept(this);
        this.visitArgs(converter.args);
    }
    visitAssign(assign) {
        assign.target.accept(this);
        assign.value.accept(this);
    }
    visitConditional(conditional) {
        conditional.condition.accept(this);
        conditional.yes.accept(this);
        conditional.no.accept(this);
    }
    visitAccessThis(access) {
        // eslint-disable-next-line
        access.ancestor = access.ancestor;
    }
    visitAccessScope(access) {
        // eslint-disable-next-line
        access.name = access.name;
    }
    visitAccessMember(access) {
        access.object.accept(this);
    }
    visitAccessKeyed(access) {
        access.object.accept(this);
        access.key.accept(this);
    }
    visitCallScope(call) {
        this.visitArgs(call.args);
    }
    visitCallFunction(call) {
        call.func.accept(this);
        this.visitArgs(call.args);
    }
    visitCallMember(call) {
        call.object.accept(this);
        this.visitArgs(call.args);
    }
    visitPrefix(prefix) {
        prefix.expression.accept(this);
    }
    visitBinary(binary) {
        binary.left.accept(this);
        binary.right.accept(this);
    }
    visitLiteralPrimitive(literal) {
        // eslint-disable-next-line
        literal.value = literal.value;
    }
    visitLiteralArray(literal) {
        this.visitArgs(literal.elements);
    }
    visitLiteralObject(literal) {
        this.visitArgs(literal.values);
    }
    visitLiteralString(literal) {
        // eslint-disable-next-line
        literal.value = literal.value;
    }
    visitArgs(args) {
        for (let i = 0; i < args.length; i++) {
            args[i].accept(this);
        }
    }
}

class ValidationMessageParser {
    constructor(bindinqLanguage) {
        this.bindinqLanguage = bindinqLanguage;
        this.emptyStringExpression = new LiteralString('');
        this.nullExpression = new LiteralPrimitive(null);
        this.undefinedExpression = new LiteralPrimitive(undefined);
        this.cache = {};
    }
    parse(message) {
        if (this.cache[message] !== undefined) {
            return this.cache[message];
        }
        const parts = this.bindinqLanguage.parseInterpolation(null, message);
        if (parts === null) {
            return new LiteralString(message);
        }
        let expression = new LiteralString(parts[0]);
        for (let i = 1; i < parts.length; i += 2) {
            expression = new Binary('+', expression, new Binary('+', this.coalesce(parts[i]), new LiteralString(parts[i + 1])));
        }
        MessageExpressionValidator.validate(expression, message);
        this.cache[message] = expression;
        return expression;
    }
    coalesce(part) {
        // part === null || part === undefined ? '' : part
        return new Conditional(new Binary('||', new Binary('===', part, this.nullExpression), new Binary('===', part, this.undefinedExpression)), this.emptyStringExpression, new CallMember(part, 'toString', []));
    }
}
class MessageExpressionValidator extends ExpressionVisitor {
    constructor(originalMessage) {
        super();
        this.originalMessage = originalMessage;
    }
    static validate(expression, originalMessage) {
        const visitor = new MessageExpressionValidator(originalMessage);
        expression.accept(visitor);
    }
    visitAccessScope(access) {
        if (access.ancestor !== 0) {
            throw new Error('$parent is not permitted in validation message expressions.');
        }
        if (['displayName', 'propertyName', 'value', 'object', 'config', 'getDisplayName'].indexOf(access.name) !== -1) {
            let errorMessage = `Did you mean to use "$${access.name}" instead of "${access.name}" in this validation message template: "${this.originalMessage}"?`;
            console.log(errorMessage);
        }
    }
}

/**
 * Dictionary of validation messages. [messageKey]: messageExpression
 */
const validationMessages = {
    /**
     * The default validation message. Used with rules that have no standard message.
     */
    default: `\${$displayName} is invalid.`,
    required: `\${$displayName} is required.`,
    matches: `\${$displayName} is not correctly formatted.`,
    email: `\${$displayName} is not a valid email.`,
    minLength: `\${$displayName} must be at least \${$config.length} character\${$config.length === 1 ? '' : 's'}.`,
    maxLength: `\${$displayName} cannot be longer than \${$config.length} character\${$config.length === 1 ? '' : 's'}.`,
    minItems: `\${$displayName} must contain at least \${$config.count} item\${$config.count === 1 ? '' : 's'}.`,
    maxItems: `\${$displayName} cannot contain more than \${$config.count} item\${$config.count === 1 ? '' : 's'}.`,
    min: `\${$displayName} must be at least \${$config.constraint}.`,
    max: `\${$displayName} must be at most \${$config.constraint}.`,
    range: `\${$displayName} must be between or equal to \${$config.min} and \${$config.max}.`,
    between: `\${$displayName} must be between but not equal to \${$config.min} and \${$config.max}.`,
    equals: `\${$displayName} must be \${$config.expectedValue}.`,
};
/**
 * Retrieves validation messages and property display names.
 */
class ValidationMessageProvider {
    constructor(parser) {
        this.parser = parser;
    }
    /**
     * Returns a message binding expression that corresponds to the key.
     * @param key The message key.
     */
    getMessage(key) {
        let message;
        if (key in validationMessages) {
            message = validationMessages[key];
        }
        else {
            message = validationMessages['default'];
        }
        return this.parser.parse(message);
    }
    /**
     * Formulates a property display name using the property name and the configured
     * displayName (if provided).
     * Override this with your own custom logic.
     * @param propertyName The property name.
     */
    getDisplayName(propertyName, displayName) {
        if (displayName !== null && displayName !== undefined) {
            return (displayName instanceof Function) ? displayName() : displayName;
        }
        // split on upper-case letters.
        const words = propertyName.toString().split(/(?=[A-Z])/).join(' ');
        // capitalize first letter.
        return words.charAt(0).toUpperCase() + words.slice(1);
    }
}

/**
 * Validates.
 * Responsible for validating objects and properties.
 */
class StandardValidator extends Validator {
    constructor(messageProvider, resources) {
        super();
        this.messageProvider = messageProvider;
        this.lookupFunctions = resources.lookupFunctions;
        this.getDisplayName = messageProvider.getDisplayName.bind(messageProvider);
    }
    /**
     * Validates the specified property.
     * @param object The object to validate.
     * @param propertyName The name of the property to validate.
     * @param rules Optional. If unspecified, the rules will be looked up using the metadata
     * for the object created by ValidationRules....on(class/object)
     */
    validateProperty(object, propertyName, rules) {
        return this.validate(object, propertyName, rules || null);
    }
    /**
     * Validates all rules for specified object and it's properties.
     * @param object The object to validate.
     * @param rules Optional. If unspecified, the rules will be looked up using the metadata
     * for the object created by ValidationRules....on(class/object)
     */
    validateObject(object, rules) {
        return this.validate(object, null, rules || null);
    }
    /**
     * Determines whether a rule exists in a set of rules.
     * @param rules The rules to search.
     * @parem rule The rule to find.
     */
    ruleExists(rules, rule) {
        let i = rules.length;
        while (i--) {
            if (rules[i].indexOf(rule) !== -1) {
                return true;
            }
        }
        return false;
    }
    getMessage(rule, object, value) {
        const expression = rule.message || this.messageProvider.getMessage(rule.messageKey);
        let { name: propertyName, displayName } = rule.property;
        if (propertyName !== null) {
            displayName = this.messageProvider.getDisplayName(propertyName, displayName);
        }
        const overrideContext = {
            $displayName: displayName,
            $propertyName: propertyName,
            $value: value,
            $object: object,
            $config: rule.config,
            // returns the name of a given property, given just the property name (irrespective of the property's displayName)
            // split on capital letters, first letter ensured to be capitalized
            $getDisplayName: this.getDisplayName
        };
        return expression.evaluate({ bindingContext: object, overrideContext }, this.lookupFunctions);
    }
    validateRuleSequence(object, propertyName, ruleSequence, sequence, results) {
        // are we validating all properties or a single property?
        const validateAllProperties = propertyName === null || propertyName === undefined;
        const rules = ruleSequence[sequence];
        let allValid = true;
        // validate each rule.
        const promises = [];
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            // is the rule related to the property we're validating.
            // eslint-disable-next-line
            if (!validateAllProperties && rule.property.name != propertyName) {
                continue;
            }
            // is this a conditional rule? is the condition met?
            if (rule.when && !rule.when(object)) {
                continue;
            }
            // validate.
            const value = rule.property.name === null ? object : object[rule.property.name];
            let promiseOrBoolean = rule.condition(value, object);
            if (!(promiseOrBoolean instanceof Promise)) {
                promiseOrBoolean = Promise.resolve(promiseOrBoolean);
            }
            // eslint-disable-next-line
            promises.push(promiseOrBoolean.then(valid => {
                const message = valid ? null : this.getMessage(rule, object, value);
                results.push(new ValidateResult(rule, object, rule.property.name, valid, message));
                allValid = allValid && valid;
                return valid;
            }));
        }
        return Promise.all(promises)
            .then(() => {
                sequence++;
                if (allValid && sequence < ruleSequence.length) {
                    return this.validateRuleSequence(object, propertyName, ruleSequence, sequence, results);
                }
                return results;
            });
    }
    validate(object, propertyName, rules) {
        // rules specified?
        if (!rules) {
            // no. attempt to locate the rules.
            rules = Rules.get(object);
        }
        // any rules?
        if (!rules || rules.length === 0) {
            return Promise.resolve([]);
        }
        return this.validateRuleSequence(object, propertyName, rules, 0, []);
    }
}

/**
 * Part of the fluent rule API. Enables customizing property rules.
 */
class FluentRuleCustomizer {
    constructor(property, condition, config = {}, fluentEnsure, fluentRules, parsers) {
        this.fluentEnsure = fluentEnsure;
        this.fluentRules = fluentRules;
        this.parsers = parsers;
        this.rule = {
            property,
            condition,
            config,
            when: null,
            messageKey: 'default',
            message: null,
            sequence: fluentRules.sequence
        };
        this.fluentEnsure._addRule(this.rule);
    }
    /**
     * Validate subsequent rules after previously declared rules have
     * been validated successfully. Use to postpone validation of costly
     * rules until less expensive rules pass validation.
     */
    then() {
        this.fluentRules.sequence++;
        return this;
    }
    /**
     * Specifies the key to use when looking up the rule's validation message.
     */
    withMessageKey(key) {
        this.rule.messageKey = key;
        this.rule.message = null;
        return this;
    }
    /**
     * Specifies rule's validation message.
     */
    withMessage(message) {
        this.rule.messageKey = 'custom';
        this.rule.message = this.parsers.message.parse(message);
        return this;
    }
    /**
     * Specifies a condition that must be met before attempting to validate the rule.
     * @param condition A function that accepts the object as a parameter and returns true
     * or false whether the rule should be evaluated.
     */
    when(condition) {
        this.rule.when = condition;
        return this;
    }
    /**
     * Tags the rule instance, enabling the rule to be found easily
     * using ValidationRules.taggedRules(rules, tag)
     */
    tag(tag) {
        this.rule.tag = tag;
        return this;
    }
    ///// FluentEnsure APIs /////
    /**
     * Target a property with validation rules.
     * @param property The property to target. Can be the property name or a property accessor function.
     */
    ensure(subject) {
        return this.fluentEnsure.ensure(subject);
    }
    /**
     * Targets an object with validation rules.
     */
    ensureObject() {
        return this.fluentEnsure.ensureObject();
    }
    /**
     * Rules that have been defined using the fluent API.
     */
    get rules() {
        return this.fluentEnsure.rules;
    }
    /**
     * Applies the rules to a class or object, making them discoverable by the StandardValidator.
     * @param target A class or object.
     */
    on(target) {
        return this.fluentEnsure.on(target);
    }
    ///////// FluentRules APIs /////////
    /**
     * Applies an ad-hoc rule function to the ensured property or object.
     * @param condition The function to validate the rule.
     * Will be called with two arguments, the property value and the object.
     * Should return a boolean or a Promise that resolves to a boolean.
     */
    satisfies(condition, config) {
        return this.fluentRules.satisfies(condition, config);
    }
    /**
     * Applies a rule by name.
     * @param name The name of the custom or standard rule.
     * @param args The rule's arguments.
     */
    satisfiesRule(name, ...args) {
        return this.fluentRules.satisfiesRule(name, ...args);
    }
    /**
     * Applies the "required" rule to the property.
     * The value cannot be null, undefined or whitespace.
     */
    required() {
        return this.fluentRules.required();
    }
    /**
     * Applies the "matches" rule to the property.
     * Value must match the specified regular expression.
     * null, undefined and empty-string values are considered valid.
     */
    matches(regex) {
        return this.fluentRules.matches(regex);
    }
    /**
     * Applies the "email" rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    email() {
        return this.fluentRules.email();
    }
    /**
     * Applies the "minLength" STRING validation rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    minLength(length) {
        return this.fluentRules.minLength(length);
    }
    /**
     * Applies the "maxLength" STRING validation rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    maxLength(length) {
        return this.fluentRules.maxLength(length);
    }
    /**
     * Applies the "minItems" ARRAY validation rule to the property.
     * null and undefined values are considered valid.
     */
    minItems(count) {
        return this.fluentRules.minItems(count);
    }
    /**
     * Applies the "maxItems" ARRAY validation rule to the property.
     * null and undefined values are considered valid.
     */
    maxItems(count) {
        return this.fluentRules.maxItems(count);
    }
    /**
     * Applies the "min" NUMBER validation rule to the property.
     * Value must be greater than or equal to the specified constraint.
     * null and undefined values are considered valid.
     */
    min(value) {
        return this.fluentRules.min(value);
    }
    /**
     * Applies the "max" NUMBER validation rule to the property.
     * Value must be less than or equal to the specified constraint.
     * null and undefined values are considered valid.
     */
    max(value) {
        return this.fluentRules.max(value);
    }
    /**
     * Applies the "range" NUMBER validation rule to the property.
     * Value must be between or equal to the specified min and max.
     * null and undefined values are considered valid.
     */
    range(min, max) {
        return this.fluentRules.range(min, max);
    }
    /**
     * Applies the "between" NUMBER validation rule to the property.
     * Value must be between but not equal to the specified min and max.
     * null and undefined values are considered valid.
     */
    between(min, max) {
        return this.fluentRules.between(min, max);
    }
    /**
     * Applies the "equals" validation rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    equals(expectedValue) {
        return this.fluentRules.equals(expectedValue);
    }
}
/**
 * Part of the fluent rule API. Enables applying rules to properties and objects.
 */
class FluentRules {
    constructor(fluentEnsure, parsers, property) {
        this.fluentEnsure = fluentEnsure;
        this.parsers = parsers;
        this.property = property;
        /**
         * Current rule sequence number. Used to postpone evaluation of rules until rules
         * with lower sequence number have successfully validated. The "then" fluent API method
         * manages this property, there's usually no need to set it directly.
         */
        this.sequence = 0;
    }
    /**
     * Sets the display name of the ensured property.
     */
    displayName(name) {
        this.property.displayName = name;
        return this;
    }
    /**
     * Applies an ad-hoc rule function to the ensured property or object.
     * @param condition The function to validate the rule.
     * Will be called with two arguments, the property value and the object.
     * Should return a boolean or a Promise that resolves to a boolean.
     */
    satisfies(condition, config) {
        return new FluentRuleCustomizer(this.property, condition, config, this.fluentEnsure, this, this.parsers);
    }
    /**
     * Applies a rule by name.
     * @param name The name of the custom or standard rule.
     * @param args The rule's arguments.
     */
    satisfiesRule(name, ...args) {
        let rule = FluentRules.customRules[name];
        if (!rule) {
            // standard rule?
            rule = this[name];
            if (rule instanceof Function) {
                return rule.call(this, ...args);
            }
            throw new Error(`Rule with name "${name}" does not exist.`);
        }
        const config = rule.argsToConfig ? rule.argsToConfig(...args) : undefined;
        return this.satisfies((value, obj) => rule.condition.call(this, value, obj, ...args), config)
            .withMessageKey(name);
    }
    /**
     * Applies the "required" rule to the property.
     * The value cannot be null, undefined or whitespace.
     */
    required() {
        return this.satisfies(value => value !== null
            && value !== undefined
            && !(isString(value) && !/\S/.test(value))).withMessageKey('required');
    }
    /**
     * Applies the "matches" rule to the property.
     * Value must match the specified regular expression.
     * null, undefined and empty-string values are considered valid.
     */
    matches(regex) {
        return this.satisfies(value => value === null || value === undefined || value.length === 0 || regex.test(value))
            .withMessageKey('matches');
    }
    /**
     * Applies the "email" rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    email() {
        // regex from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
        // eslint-disable-next-line
        return this.matches(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
            .withMessageKey('email');
    }
    /**
     * Applies the "minLength" STRING validation rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    minLength(length) {
        return this.satisfies((value) => value === null || value === undefined || value.length === 0 || value.length >= length, { length })
            .withMessageKey('minLength');
    }
    /**
     * Applies the "maxLength" STRING validation rule to the property.
     * null, undefined and empty-string values are considered valid.
     */
    maxLength(length) {
        return this.satisfies((value) => value === null || value === undefined || value.length === 0 || value.length <= length, { length })
            .withMessageKey('maxLength');
    }
    /**
     * Applies the "minItems" ARRAY validation rule to the property.
     * null and undefined values are considered valid.
     */
    minItems(count) {
        return this.satisfies((value) => value === null || value === undefined || value.length >= count, { count })
            .withMessageKey('minItems');
    }
    /**
     * Applies the "maxItems" ARRAY validation rule to the property.
     * null and undefined values are considered valid.
     */
    maxItems(count) {
        return this.satisfies((value) => value === null || value === undefined || value.length <= count, { count })
            .withMessageKey('maxItems');
    }
    /**
     * Applies the "min" NUMBER validation rule to the property.
     * Value must be greater than or equal to the specified constraint.
     * null and undefined values are considered valid.
     */
    min(constraint) {
        return this.satisfies((value) => value === null || value === undefined || value >= constraint, { constraint })
            .withMessageKey('min');
    }
    /**
     * Applies the "max" NUMBER validation rule to the property.
     * Value must be less than or equal to the specified constraint.
     * null and undefined values are considered valid.
     */
    max(constraint) {
        return this.satisfies((value) => value === null || value === undefined || value <= constraint, { constraint })
            .withMessageKey('max');
    }
    /**
     * Applies the "range" NUMBER validation rule to the property.
     * Value must be between or equal to the specified min and max.
     * null and undefined values are considered valid.
     */
    range(min, max) {
        return this.satisfies((value) => value === null || value === undefined || (value >= min && value <= max), { min, max })
            .withMessageKey('range');
    }
    /**
     * Applies the "between" NUMBER validation rule to the property.
     * Value must be between but not equal to the specified min and max.
     * null and undefined values are considered valid.
     */
    between(min, max) {
        return this.satisfies((value) => value === null || value === undefined || (value > min && value < max), { min, max })
            .withMessageKey('between');
    }
    /**
     * Applies the "equals" validation rule to the property.
     * null and undefined values are considered valid.
     */
    equals(expectedValue) {
        return this.satisfies(value => value === null || value === undefined || value === '' || value === expectedValue, { expectedValue })
            .withMessageKey('equals');
    }
}
FluentRules.customRules = {};
/**
 * Part of the fluent rule API. Enables targeting properties and objects with rules.
 */
class FluentEnsure {
    constructor(parsers) {
        this.parsers = parsers;
        /**
         * Rules that have been defined using the fluent API.
         */
        this.rules = [];
    }
    /**
     * Target a property with validation rules.
     * @param property The property to target. Can be the property name or a property accessor
     * function.
     */
    ensure(property) {
        this.assertInitialized();
        const name = this.parsers.property.parse(property);
        const fluentRules = new FluentRules(this, this.parsers, { name, displayName: null });
        return this.mergeRules(fluentRules, name);
    }
    /**
     * Targets an object with validation rules.
     */
    ensureObject() {
        this.assertInitialized();
        const fluentRules = new FluentRules(this, this.parsers, { name: null, displayName: null });
        return this.mergeRules(fluentRules, null);
    }
    /**
     * Applies the rules to a class or object, making them discoverable by the StandardValidator.
     * @param target A class or object.
     */
    on(target) {
        Rules.set(target, this.rules);
        return this;
    }
    /**
     * Adds a rule definition to the sequenced ruleset.
     * @internal
     */
    _addRule(rule) {
        while (this.rules.length < rule.sequence + 1) {
            this.rules.push([]);
        }
        this.rules[rule.sequence].push(rule);
    }
    assertInitialized() {
        if (this.parsers) {
            return;
        }
        throw new Error(`Did you forget to add ".plugin('aurelia-validation')" to your main.js?`);
    }
    mergeRules(fluentRules, propertyName) {
        // eslint-disable-next-line
        const existingRules = this.rules.find(r => r.length > 0 && r[0].property.name == propertyName);
        if (existingRules) {
            const rule = existingRules[existingRules.length - 1];
            fluentRules.sequence = rule.sequence;
            if (rule.property.displayName !== null) {
                fluentRules = fluentRules.displayName(rule.property.displayName);
            }
        }
        return fluentRules;
    }
}
/**
 * Fluent rule definition API.
 */
class ValidationRules {
    static initialize(messageParser, propertyParser) {
        this.parsers = {
            message: messageParser,
            property: propertyParser
        };
    }
    /**
     * Target a property with validation rules.
     * @param property The property to target. Can be the property name or a property accessor function.
     */
    static ensure(property) {
        return new FluentEnsure(ValidationRules.parsers).ensure(property);
    }
    /**
     * Targets an object with validation rules.
     */
    static ensureObject() {
        return new FluentEnsure(ValidationRules.parsers).ensureObject();
    }
    /**
     * Defines a custom rule.
     * @param name The name of the custom rule. Also serves as the message key.
     * @param condition The rule function.
     * @param message The message expression
     * @param argsToConfig A function that maps the rule's arguments to a "config"
     * object that can be used when evaluating the message expression.
     */
    static customRule(name, condition, message, argsToConfig) {
        validationMessages[name] = message;
        FluentRules.customRules[name] = { condition, argsToConfig };
    }
    /**
     * Returns rules with the matching tag.
     * @param rules The rules to search.
     * @param tag The tag to search for.
     */
    static taggedRules(rules, tag) {
        return rules.map(x => x.filter(r => r.tag === tag));
    }
    /**
     * Returns rules that have no tag.
     * @param rules The rules to search.
     */
    static untaggedRules(rules) {
        return rules.map(x => x.filter(r => r.tag === undefined));
    }
    /**
     * Removes the rules from a class or object.
     * @param target A class or object.
     */
    static off(target) {
        Rules.unset(target);
    }
}



export { ValidationMessageParser, PropertyAccessorParser, ValidationRules, StandardValidator, ValidationMessageProvider }