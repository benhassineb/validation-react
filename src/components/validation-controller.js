
export class ValidationController {
    constructor(validator) {
        this.validator = validator;
        /**
         * Validation results that have been rendered by the controller.
         */
        this.results = [];
        /**
         * Validation errors that have been rendered by the controller.
         */
        this.errors = [];
        /**
         *  Whether the controller is currently validating.
         */
        this.validating = false;

        // Objects that have been added to the controller instance (entity-style validation).
        this.objects = new Map();
        /**
         * The trigger that will invoke automatic validation of a property used in a binding.
         */
        // this.validateTrigger = validateTrigger.blur;
        // Promise that resolves when validation has completed.
        this.finishValidating = Promise.resolve();
    }



    addObject(object, rules) {
        this.objects.set(object, rules);
    }

    removeObject(object) {
        this.objects.delete(object);
    }

    /**
     * Validates and renders results.
     * @param instruction Optional. Instructions on what to validate. If undefined, all
     * objects and bindings will be validated.
     */
    validate(instruction) {
        // Get a function that will process the validation instruction.
        let execute;
        if (instruction) {
            // tslint:disable-next-line:prefer-const
            let { object, propertyName, rules } = instruction;
            // if rules were not specified, check the object map.
            rules = rules || this.objects.get(object);
            // property specified?
            if (instruction.propertyName === undefined) {
                // validate the specified object.
                execute = () => this.validator.validateObject(object, rules);
            }
            else {
                // validate the specified property.
                execute = () => this.validator.validateProperty(object, propertyName, rules);
            }
        }
        else {
            // validate all objects.
            execute = () => {
                const promises = [];
                for (const [object, rules] of Array.from(this.objects)) {
                    promises.push(this.validator.validateObject(object, rules));
                }
                return Promise.all(promises).then(resultSets => resultSets.reduce((a, b) => a.concat(b), []));
            };
        }
        // Wait for any existing validation to finish, execute the instruction
        this.validating = true;
        const returnPromise = this.finishValidating
            .then(execute)
            .then((newResults) => {
                if (returnPromise === this.finishValidating) {
                    this.validating = false;
                }
                const result = {
                    instruction,
                    valid: newResults.find(x => !x.valid) === undefined,
                    results: newResults
                };
                return result;
            })
            .catch(exception => {
                // recover, to enable subsequent calls to validate()
                this.validating = false;
                this.finishValidating = Promise.resolve();
                return Promise.reject(exception);
            });
        this.finishValidating = returnPromise;
        return returnPromise;
    }



}
