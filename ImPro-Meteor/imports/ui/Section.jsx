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
    let parentCss = (this.props.parentCss)?this.props.parentCss:"col-s-8 col-m-8 col-2";
    if(Array.isArray(this.props.content)){
      content = this.props.content.map((player) => {
        if(map)
          player = this.props.players[player];
        return (<div className={player.team + " listelement"}>{player.name}</div>);
      })
    }else{
      content = this.props.content;
    }
    return(
      <div className = {parentCss}>
          <h1 className ={this.props.team}>{this.props.name}</h1>
          <div className = {childCss}>{content}</div>
      </div>);
  }

}

export default Section;
