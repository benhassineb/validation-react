import React, { Component } from 'react'
export class Vinput extends Component {
    // constructor(props) {
    //     super(props);
    // }

    shouldComponentUpdate(nextProps) {
        let validationResults = (this.props.validationResults || []).filter(result => result.propertyName === this.props.name);
        let nextValidationResults = (nextProps.validationResults || []).filter(result => result.propertyName === nextProps.name);
        return nextValidationResults !== validationResults;
    }

    render() {
        let propertyName = this.props.name;
        let className = [this.props.className];
        let listErrors = [];
        let validationResults = (this.props.validationResults || []).filter(result => result.propertyName === propertyName);
        let wasValidated = validationResults.length > 0;
        let isValid = false;
        if (wasValidated) {
            isValid = validationResults.find(x => !x.valid) === undefined;
            if (isValid) {
                className.push('is-valid');
            }
            else {
                className.push('is-invalid');
                listErrors = validationResults.map((error) => { return { id: error.id, message: error.message } });
            }
        }
        return (
            <div>
                <input
                    type={this.props.type}
                    className={className.join(' ')}
                    value={this.props.value}
                    name={this.props.name}
                    onChange={this.props.onChange}
                    onBlur={this.props.onChange}
                />

                {wasValidated && isValid &&
                    <div className="valid-feedback">
                        Looks good!
                </div>}

                {wasValidated && !isValid && listErrors && listErrors.map((error) =>
                    <div className="invalid-feedback" key={error.message}>
                        {error.message}
                    </div>
                )
                }
            </div>
        )
    }
}

