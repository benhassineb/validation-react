import React from 'react'

export const Vinput = (props) => {
    let className = [props.className];
    let listErrors = [];
    let validationResults = (props.validationResults || []).filter(result => result.propertyName === props.name);
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
    return <div>
        <input
            type={props.type}
            className={className.join(' ')}
            value={props.value}
            name={props.name}
            onChange={props.onChange}
            onBlur={props.onChange}
        />

        {wasValidated && isValid &&
            <div className="valid-feedback">
                Looks good!
            </div>}

        {wasValidated && !isValid && listErrors && listErrors.map((error) =>
            <div className="invalid-feedback" key={error.message}>
                {error.message}
            </div>
        )}
    </div>;
}

