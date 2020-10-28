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
      roomToken: this.roomSession(),
      roomInput: '',
      mode: '',
      mixTeams: true,
      rounds: 0
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

  createRoom(gamemode) {
    console.log(this.state.mixTeams);
    let settings = {
      mixTeams: this.state.mixTeams,
      rounds: this.state.rounds
    }
    Meteor.call('rooms.create', {playerId: this.userSession(), name: this.state.name, gamemode: gamemode, settings: settings}, (e,id) => {
      if (e){
        alert("Fehler beim Erstellen des Raumes");
        return;
      }
      this.setState({ roomToken: id });
      this.setState({ mode: "room" });
      ClientStorage.set('currentroomToken', id);
    });

  }

  joinRoom() {
    var roomToken = this.state.roomInput.trim();
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
      this.setState({ mode: null });
    });
  }

  renderOverlay(){
    switch(this.state.mode){

      case "create":
        return(
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Modus</div>
              <button className="LoginButton" onClick={() => { this.setState({mode: "createSettings"}) }}>Parlament</button>
              <button className="LoginButton" onClick={() => { this.createRoom("theater") }}>Theater</button>
            </div>
          </div>
        ); break;

      case "createSettings":
        return (
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Settings:</div>
              <div className="loginCheckboxParent toggle"> Teams durchmischen <input defaultChecked={this.state.mixTeams} id="mixTeams" type="checkbox" value = "mixTeams" onChange={(e) => {this.setState({mixTeams: e.target.checked})}}></input><label htmlFor="mixTeams">Toggle</label></div>
            <button className="LoginButton" onClick={() => { this.createRoom("parlament") }}>Raum erstellen</button>  
            </div>
          </div>
        ); break;

      case "join":
        return (
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Room:</div> <input className="LoginInput" placeholder="Room ID" type="text" value = {this.state.roomInput} onChange={(e) => {this.setState({roomInput:e.target.value})}}></input>
            <button className="LoginButton" onClick={() => { this.joinRoom() }}>Raum beitreten</button>  
            </div>
          </div>
        ); break;
      default:
        return "";
    }
  }

  renderStartPage(){
    let overlay = "";
    if(this.state.mode)
      overlay = this.renderOverlay();
    return(
      <div className="Startpage">
        <Column className="Login">
          <Column className="Logo"></Column>
          <Column className="LoginField">
            <Row>
              <input className="LoginInput" placeholder="Name" type="text" value = {this.state.name} onChange={(e) => {this.setState({name:e.target.value})}}></input>
            </Row>
            <Row>
              <button className="LoginButton" onClick={() => {this.setState({mode:"create"})}}>Raum erstellen</button>
              <button className="LoginButton" onClick={() => {this.setState({mode:"join"})}}>Raum beitreten</button>
            </Row>
          </Column>
        </Column>
        {overlay}
      </div>
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
      content
    );
  }

}

export default App
