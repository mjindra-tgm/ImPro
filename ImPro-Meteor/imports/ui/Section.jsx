import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import Room  from './Room';

class Section extends Component{

  constructor (props) {
    super(props)
    this.state = {
    }
  }


  render(){

    return(
      <div class = "col-s-8 col-4">
          <h1 class={this.props.team}>{this.props.name}</h1>
          <div class = "desc">{this.props.content}</div>
      </div>);
  }

}

export default Section;
