import React, { Component } from 'react'

export class Playground extends Component {
    constructor(props) {
        super(props);
        this.state = {
            counter: 0
        }
    }
    handleOnClick = () => {
        let counter = this.state.counter;
        if (counter % 2 === 0) {
            counter++;
        }
        this.setState({
            counter: counter
        });
    }

    render() {
        return (
            <div>
                <button type="button" class="btn btn-primary" onClick={this.handleOnClick}>Click</button>
                <P counter={this.state.counter}></P>
            </div>
        )
    }
}


export default class P extends Component {
    constructor(props) {
        super(props);
    }
    shouldComponentUpdate(nextProps) {
        let result = nextProps.counter !== this.props.counter;
        console.log(result);
        return result;
    }

    render() {
        return (
            <p>{this.props.counter}</p>
        )
    }
}

