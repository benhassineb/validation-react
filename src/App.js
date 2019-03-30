import React, { Component } from 'react';
import './App.css';
import { PersonEditor } from './components/person-editor';
import { ChildParent } from './components/child-parent';

class App extends Component {
  render() {
    return (
      <div className="Container">

        <PersonEditor />
        <div className="mb-3">

        </div>
        <ChildParent />

      </div>
    );
  }
}

export default App;
