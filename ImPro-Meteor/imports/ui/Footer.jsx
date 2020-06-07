import React, {Component} from 'react';
import { Meteor } from 'meteor/meteor';

class Footer extends Component{

  constructor (props) {
    super(props)
    this.state = {
      minutes: 6,
      seconds: 0
    }
  }

  startGame(){
    Meteor.call('room.game.start',{roomToken: this.props.roomToken});
  }

  endGame(){
    Meteor.call('room.game.end',{roomToken: this.props.roomToken});
  }

  
  startWatch(){
    Meteor.call('room.game.startWatch',{roomToken: this.props.roomToken, minutes: this.state.minutes, seconds: this.state.seconds});
  }

  stopWatch(){
    Meteor.call('room.game.stopWatch',{roomToken: this.props.roomToken});
  }

  randomTopic(){
    switch(this.props.gamemode){
      case "parlament":
        Meteor.call('room.game.randomTopic',{roomToken: this.props.roomToken}); console.log("parlament"); break;
      case "theater":
        Meteor.call('room.game.randomStory',{roomToken: this.props.roomToken}); console.log("theater"); break;
    }
  }

  zero(num){
    if(num < 10)
      return "0"+num;
    return num;
  }


  render(){

    return(
      <div className="col-s-12 col-12">
        {this.props.timer && <div>
        {this.zero(this.props.timer.minutes)}:{this.zero(this.props.timer.seconds)}
        {!this.props.timer.locked &&<div><button className={this.props.team} onClick = {() => { this.startWatch() }}>Uhr starten</button>
        <button className={this.props.team} onClick = {() => { this.stopWatch() }}>Uhr stoppen</button>
        <input type = "number" defaultValue="6" onChange={(e) => {this.setState({minutes:e.target.value})}}></input>
        <input type = "number" defaultValue="0" onChange={(e) => {this.setState({seconds:e.target.value})}}></input></div>}
        </div>}

        {(this.props.state == "lobby") && <button className={this.props.team} onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {(this.props.state == "endOfRound") && <button className={this.props.team} onClick = {() => { this.endGame() }}>Spiel beenden</button>}
        {!(this.props.state == "lobby" || this.props.state == "endOfRound") && <button className={this.props.team} onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
        <button className={this.props.team} onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
      </div>
      );
  }

}

export default Footer;

