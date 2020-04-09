import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import {ChatsCollection} from '../api/chats'

class Chat extends Component{
  constructor (props) {
    super(props)
      this.state = {
        message:""
    }
  }

  sendMessage(){
    Meteor.call('chats.message.send',{roomToken: this.props.roomToken, playerId: this.props.playerId, message: this.state.message, team: this.props.team});
    this.setState({message:""})
  }

  renderMessage(message){
    let css = "message";
    let pName = this.props.players[message.playerId].name;
    if(message.playerId == this.props.playerId){
      css = "mymessage";
      pName = false;
    }
    return(
      <div class={css}><div class = "chatname">{pName}</div>{message.text}</div>
    );
  }

  render(){
    console.log(this.props);
    return (
      <Column>
      <div class = "chat">
          {this.props.messages.map((message) => {
            return this.renderMessage(message);
          })}
        </div>
      <Row>Message:<input type="text" value = {this.state.message} onChange={(e) => {this.setState({message:e.target.value})}}></input></Row>
      <button onClick={() => {this.sendMessage()}}>Send</button>
      </Column>
    );
  }
}

export default withTracker(({roomToken,team}) => {
  const handle = Meteor.subscribe('chats');

  return {
    listLoading: !handle.ready(),
    messages: ChatsCollection.find({roomToken: roomToken,team: team}).fetch(),
  };
})(Chat);
