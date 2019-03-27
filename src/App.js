import React, { Component } from 'react';
import './App.css';
import { PersonEditor } from './components/person-editor';

class App extends Component {
  render() {
    return (
      <div className="Container">

        <PersonEditor />

      </div>
    );
  }
}

export default App;
