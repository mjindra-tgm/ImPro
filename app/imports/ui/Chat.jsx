import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import {ChatsCollection} from '../api/chats'

class Chat extends Component{
  constructor (props) {
    super(props)
      this.state = {
        message:"",
    }
  }

  sendMessage(){
    if (!this.state.message.trim()){
      return;
    }
    Meteor.call('chats.message.send',{roomToken: this.props.roomToken, playerId: this.props.playerId, message: this.state.message, team: this.props.team});
    this.setState({message:""})
  }

  renderMessage(message){
    let css = "message "+this.props.team;
    let pName = this.props.players[message.playerId].name;
    if(message.playerId == this.props.playerId){
      css = "mymessage";
      pName = false;
    }
    return(
      <div className={css}><div class = {this.props.team + " chatname"}>{pName}</div>{message.text}</div>
    );
  }

  render(){
    return (
        <div className={this.props.parentCss}>
          <h1 className={this.props.team + "Header"}>Team-Chat</h1>
          <div className={this.props.childCss + " chat"}>
              {this.props.messages.map((message) => {
                return this.renderMessage(message);
              })}
          </div>
          <form onSubmit={(event) => {event.preventDefault();}}>
            <Row className="ChatInput">
              <Column style={{ flex: 1 }}>
                <input style={{ padding: '0.5rem', borderRadius: '0px 0px 0px 8px', border: 'none', outline: 'none', '-webkit-appearance': 'none', margin: '0', fontSize: '1rem' }} type="text" value={this.state.message} onChange={(e) => {this.setState({message:e.target.value})}}></input>
              </Column>
              <Column>
                <button className={'ButtonChat ' + this.props.team} onClick={() => {this.sendMessage()}}>Send</button>
              </Column>
            </Row>
          </form>
        </div>
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
