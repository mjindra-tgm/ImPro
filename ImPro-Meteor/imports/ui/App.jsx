import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { ClientStorage } from 'meteor/ostrio:cstorage';
import { nanoid } from 'nanoid'
import Room  from './Room';

class App extends Component{

  constructor (props) {
    super(props)
    this.state = {
      name: '',
      roomToken: this.roomSession()
    }
  }

  roomSession(){
    return ClientStorage.get('currentroomToken') || null;
  }

  userSession(){
    let userId = ClientStorage.get('userId');
    if (userId){
      return userId;
    }else{
      userId = nanoid(32);
      ClientStorage.set('userId', userId);
      return userId;
    }
  }

  createRoom() {
    Meteor.call('rooms.create',{ playerId: this.userSession(), name: this.state.name}, (e,id) => {
      if (e){
        alert("Fehler beim Erstellen des Raumes");
        return;
      }
      this.setState({ roomToken: id });
      ClientStorage.set('currentroomToken', id);
    });
  }

  joinRoom() {
    var roomToken = prompt("Bitte gebe deinen Raum Token ein").trim();
    if (roomToken.length != 4){
      //// TODO: Handle validation
      return;
    }
    roomToken = roomToken.toLowerCase();
    Meteor.call('room.join', { roomToken: roomToken, playerId: this.userSession(), name: this.state.name }, (e, success) => {
      if (e || success != 1){
        alert("Falsche Raum ID");
        return;
      }
      this.setState({ roomToken: roomToken });
      ClientStorage.set('currentroomToken', roomToken);
    });
  }

  leaveRoom() {
    Meteor.call('room.leave', { roomToken: this.state.roomToken, playerId: this.userSession() }, (e, success) => {
      if (e || success != 1){
        alert("Fehler beim Verlassen des Raumes");
        return;
      }
      ClientStorage.remove('currentroomToken');
      this.setState({ roomToken: null });
    });
  }

  renderStartPage(){
    return(
      <Column>
        <Column>
          Name:
          <input type="text" value = {this.state.name} onChange={(e) => {this.setState({name:e.target.value})}}></input>
        </Column>
          <Row>
            <Row>
              <button onClick={() => { this.createRoom() }}>Raum erstellen</button>
            </Row>
            <Row>
              <button onClick={() => { this.joinRoom() }}>Raum beitreten</button>
          </Row>
        </Row>
      </Column>
    );
  }

  render(){
    let content = "Loading";
    if (this.state.roomToken) {
      content = (<Room playerId = {this.userSession()} token={this.state.roomToken} leaveRoom={() => { this.leaveRoom() }} />)
    }else{
      content = this.renderStartPage();
    }

    return (
      <div>{content}</div>
    );
  }

}

export default App
