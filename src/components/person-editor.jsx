import React, { Component } from 'react';
import { initValidator } from './validator';
import { Person } from './person';
import { Vinput } from './vinput';

export class PersonEditor extends Component {
  constructor(props) {
    super(props);
    this.validator = initValidator();
    this.state = {
      person: new Person('Boubaker', 'Hen Hassine', 'b.benhassine@hotmail.com', '2019-04-03'),
      validationResults: [],
      personValidationResults: {},
    };
  }

  handleChange = (event) => {
    const target = event.target;
    const inputName = target.name;
    let inputValue = target.value;

    let personCopy = this.state.person;
    personCopy[inputName] = inputValue;
    this.validate(personCopy, inputName).then(newResults => {
      let delta = this.mergeValidationResults(this.state.validationResults, newResults);
      this.setState({
        validationResults: delta,
        person: personCopy
      });
    });
  }


  handleSubmit = () => {
    this.validate(this.state.person).then(newResults => {
      let delta = this.mergeValidationResults(this.state.validationResults, newResults);
      this.setState({ validationResults: delta });
    });
  }

  validate = (obj, propertyName) => {
    let validate = () => this.validator.validateObject(obj);
    if (propertyName) {
      validate = () => this.validator.validateProperty(obj, propertyName);
    }
    return validate();
  }


  mergeValidationResults = (oldResults, newResults) => {
    let results = oldResults.slice(0);
    newResults.forEach(newResult => {
      const newResultIndex = results.findIndex(x => x.rule === newResult.rule && x.object === newResult.object && x.propertyName === newResult.propertyName);
      if (newResultIndex !== -1) {
        results.splice(newResultIndex, 1);
      }
      results.push(newResult);
    });
    return results;
  }


  render() {
    return (<div>
      <form>
        <ul>
          {this.state.validationResults && this.state.validationResults.map((error) =>
            <li key={error.id}>
              {error.message}
            </li>
          )}
        </ul>
        <div className="form-row">
          <div className="col-md-6 mb-3">
            <label  >First name</label>
            <Vinput type="text" className="form-control" name='firstName' value={this.state.person.firstName} onChange={this.handleChange} validationResults={this.state.validationResults} />
          </div>

          <div className="col-md-6 mb-3">
            <label  >Last name</label>
            <Vinput type="text" className="form-control" name='lastName' value={this.state.person.lastName} onChange={this.handleChange} validationResults={this.state.validationResults} />
          </div>

          <div className="col-md-6 mb-3">
            <label>Email</label>
            <Vinput type="text" className={'form-control'} name='email' value={this.state.person.email} onChange={this.handleChange} validationResults={this.state.validationResults} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Birthday</label>
            <Vinput type="date" className="form-control" name='birthday' value={this.state.person.birthday} onChange={this.handleChange} validationResults={this.state.validationResults} />
          </div>
        </div>
      </form>
      <button className="btn btn-primary" onClick={this.handleSubmit}>Submit form</button>
    </div>

    );
  }
}

