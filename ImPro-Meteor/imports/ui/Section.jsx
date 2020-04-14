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
    if(!this.props.content || this.props.content == [] || this.props.content == "")
      return "";

    let map = false;
    if(this.props.players)
      map = true;
    let content = "";
    let childCss = (this.props.childCss)?this.props.childcss:"desc";
    let parentCss = (this.props.parentCss)?this.props.parentCss:"col-s-6 col-4";
    if(Array.isArray(this.props.content)){
      content = this.props.content.map((player) => {
        if(map)
          player = this.props.players[player];
        return (<div class={player.team + " listelement"}>{player.name}</div>);
      })
    }else{
      content = this.props.content;
    }
    return(
      <div class = {parentCss}>
          <h1 class={this.props.team}>{this.props.name}</h1>
          <div class = {childCss}>{content}</div>
      </div>);
  }

}

export default Section;
