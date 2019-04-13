import React, { Component } from 'react';
import { validationControllerInstance } from './validator';
import { Person } from './person';

function InvalidFeedback(props) {
  const errors = props.validationErrors || [];
  const propertyName = props.propertyName;
  const listItems = errors.filter(error => error.propertyName === propertyName).map((error) => { return error.message });
  return (
    <div className="invalid-feedback">
      {listItems}
    </div>
  );
};




export class PersonEditor extends Component {
  constructor(props) {
    super(props);
    this.controller = validationControllerInstance();

    this.state = {
      person: new Person(),
      validationErrors: [],
      controller: this.controller
    };
    // this.controller.addObject(this.state.person);
  }

  handleChange = (el) => {
    let inputName = el.target.name;
    let inputValue = el.target.value;
    let statusCopy = Object.assign({}, this.state);
    statusCopy.person[inputName] = inputValue;
    this.setState(statusCopy);
    this.handleSubmit(null, inputName);
  }


  handleSubmit = (e, propertyName) => {
    console.log(this.state.person);
    let instruction = { object: this.state.person };
    if (propertyName) {
      instruction = { object: this.state.person, propertyName: propertyName }
    }

    this.controller.validate(instruction)
      .then(result => {
        if (result.valid) {
          this.setState({ validationErrors: [] });
        } else {
          let errors = result.results.filter(res => !res.valid);
          this.setState({ validationErrors: errors });
          this.setState({ controller: this.controller });
        }
      });
  }


  validationFeedback = (propertyName) => {

    let result = this.state.validationErrors.filter(error => error.propertyName === propertyName).map((error) =>
      <div className="invalid-feedback" key={error.id}>
        {error.message}
      </div>
    );
    if (result.length === 0) {
      result.push(<div className="valid-feedback" key={0}>
        Looks good!
     </div>)
    }
    console.log(result)
    return result;
  }

  render() {
    console.log(this.state.validationErrors);
    return (<div>

      <form>
        <ul>
          {this.state.validationErrors && this.state.validationErrors.map((error) =>
            <li key={error.id}>
              {error.message}
            </li>
          )}
        </ul>
        <div className="form-row">
          <div className="col-md-6 mb-3">
            <label  >First name</label>
            <input type="text" className="form-control" name='firstName' onChange={this.handleChange} />
            <div className="valid-feedback">
              Looks good!
             </div>
          </div>

          <div className="col-md-6 mb-3">
            <label  >Last name</label>
            <input type="text" className="form-control is-valid" name='lastName' onChange={this.handleChange} />
            {this.validationFeedback('lastName')}
          </div>

          <div className="col-md-6 mb-3">
            <label>Email</label>
            <input type="text" className="form-control is-invalid" name='email' onChange={this.handleChange} />
            <InvalidFeedback validationErrors={this.state.validationErrors} propertyName='email' />
            {/* {this.validationFeedback('email')} */}
          </div>
          <div className="col-md-6 mb-3">
            <label>Birthday</label>
            <input type="text" className="form-control is-invalid" name='birthday' onChange={this.handleChange} />
            <span className="invalid-feedback">
              Looks good!
              </span>
            <span className="invalid-feedback">
              Looks good!
              </span>
          </div>
        </div>
      </form>
      <button className="btn btn-primary" onClick={this.handleSubmit}>Submit form</button>
    </div>

    );
  }
}

