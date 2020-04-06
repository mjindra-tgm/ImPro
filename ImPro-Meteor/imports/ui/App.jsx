import React, {Component} from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';



export class App extends Component{
  constructor (props) {
    super(props)
    this.state = {
      name: ""
    }
  }

  renderStartPage(){
    return(
      <Column>
        <input type="text" value = {this.state.name} onChange={(e) => {this.setState({name:e.target.value})}}></input>
        <button onClick={() => {Meteor.call('rooms.create',{name: this.state.name})}}>Raum erstellen</button>
      </Column>
    );
  }

  render(){
    return (
      <div>{this.renderStartPage()}</div>
    );
  }
}

