import React, {Component} from 'react';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { ClientStorage } from 'meteor/ostrio:cstorage';
import { nanoid } from 'nanoid'
import Room  from './Room';
import {Modes} from '../api/Modes';

class App extends Component{


  constructor (props) {
    super(props)
    this.state = {
      name: '',
      roomToken: this.roomSession(),
      roomInput: '',
      mode: '',
      mixTeams: true,
      rounds: 0,
    }

    for(let i of Modes){
      this.state[i.name] = i.randomFactor;
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
    let propabilities = Modes.slice();
    if(gamemode == "discussion"){
      for(let i of propabilities){
        i.randomFactor = parseInt(this.state[i.name]);
      }
    }
    let settings = {
      mixTeams: this.state.mixTeams,
      rounds: this.state.rounds
    }
    Meteor.call('rooms.create', {playerId: this.userSession(), name: this.state.name, gamemode: gamemode, settings: settings, propabilities: propabilities}, (e,id) => {
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
    let content;
    switch(this.state.mode){

      case "create":
        content = (
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Modus</div>
              <button className="LoginButton" onClick={() => { this.setState({mode: "createSettings"}) }}>Diskussion</button>
              <button className="LoginButton" onClick={() => { this.createRoom("theater") }}>Theater</button>
              
            </div>
            <button className="LoginBackButton" onClick={() => { this.setState({mode: null}) }}></button>
          </div>
        ); break;

      case "createSettings":
        content = (
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Settings:</div>
              {/* Teams mischen */}
              <div className="loginCheckboxParent toggle"> Teams durchmischen <input defaultChecked={this.state.mixTeams} id="mixTeams" type="checkbox" value = "mixTeams" onChange={(e) => {this.setState({mixTeams: e.target.checked})}}></input><label htmlFor="mixTeams">Toggle</label></div>
              {/* Rundeneinstellungen */}
              <div className="loginCheckboxParent toggle"> Runden automatische ermitteln <input defaultChecked={true} id="autoRounds" type="checkbox" value = "autoRounds" onChange={(e) => {this.setState({rounds: e.target.checked ? 0 : 1})}}></input><label htmlFor="autoRounds">Toggle</label></div>
              {this.state.rounds > 0 && <div class="loginSliderParent"> <input type="range" className="slider" min="1" max="15" defaultValue = {1} onChange={(e) => {this.setState({rounds: e.target.value})}}></input>
              <div className="bubbleParent"><div className="sliderBubble" style={{left : (this.state.rounds-1)/14*100+"%"}}>{this.state.rounds}</div></div></div>}
              {/* Wahrscheinlichkeitseinstellungen */}
              <div className="loginCheckboxParent toggle"> manuelle Wahrscheinlichkeiten <input defaultChecked={false} id="manualProbs" type="checkbox" value = "manualProbs" onChange={(e) => {this.setState({manualProbs: e.target.checked})}}></input><label htmlFor="manualProbs">Toggle</label></div>
              {this.state.manualProbs && this.renderModesSelector()}

            <button className="LoginButton" onClick={() => { this.createRoom("discussion") }}>Raum erstellen</button>  
            </div>
            <button className="LoginBackButton" onClick={() => { this.setState({mode: null}) }}></button>
          </div>
        ); break;

      case "join":
        content = (
          <div className="overlay">
            <div className="overlaytext">
              <div className="overlayheader">Room:</div> <input className="LoginInput" placeholder="Room ID" type="text" value = {this.state.roomInput} onChange={(e) => {this.setState({roomInput:e.target.value})}}></input>
            <button className="LoginButton" onClick={() => { this.joinRoom() }}>Raum beitreten</button>  
            </div>
            <button className="LoginBackButton" onClick={() => { this.setState({mode: null}) }}></button>
          </div>
        ); break;
      default:
        return null;
    }

    return content;
  }

  renderModesSelector(){
    let content = Modes.map((i) => {
      return <>{i.name}<div class="loginSliderParent" onMouseEnter = {(e) => {this.setState({[i.name+"_hover"]: true})}} onMouseLeave={(e) => {this.setState({[i.name+"_hover"]: false})}}> <input defaultValue={this.state[i.name]} type="range" className="slider" min="0" max="5" onChange={(e) => {this.setState({[i.name]: e.target.value}) }}></input>
      <div style={{visibility: this.state[i.name+"_hover"] ? "visible":"hidden"}} className="bubbleParent"><div className="sliderBubble" style={{left: this.state[i.name]/5*100+"%",visibility: this.state[i.name+"_hover"]}}>{this.state[i.name] || 0}</div></div></div></>
    });
    return content;
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
