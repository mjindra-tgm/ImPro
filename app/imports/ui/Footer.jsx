import React, {Component} from 'react';
import { Meteor } from 'meteor/meteor';

class Footer extends Component{

  constructor (props) {
    super(props)
    this.state = {
      minutes: 6,
      seconds: 0,
      interval:null,
    }
  }


  startGame(){
    Meteor.call('room.game.start',{roomToken: this.props.room.token});
  }

  endGame(){
    Meteor.call('room.game.end',{roomToken: this.props.room.token});
  }

  
  startWatch(){
    Meteor.call('room.game.startWatch',{roomToken: this.props.room.token, seconds: parseInt(this.state.minutes) * 60 + parseInt(this.state.seconds)});
  }

  stopWatch(){
    Meteor.call('room.game.stopWatch',{roomToken: this.props.room.token});
  }

  randomTopic(){
    const room  = this.props.room;
    switch(room.gamemode){
      case "parlament":
        Meteor.call('room.game.randomTopic',{roomToken: room.token}); break;
      case "theater":
        Meteor.call('room.game.randomStory',{roomToken: room.token}); break;
    }
  }

  zero(num){
    if(num < 10)
      return "0"+num;
    return num;
  }

  componentWillUpdate(){
    if(this.props.timer && this.props.timer.startTimer==true){
      let seconds = this.props.timer.seconds;
      this.state.interval = setInterval(() => {
        seconds --;
        if(seconds>59)
          this.setState({minutesCount: Math.floor(seconds / 60)});
        else
          this.setState({minutesCount: 0});

        this.setState({secondsCount: seconds % 60});
        if(seconds==0){
          clearInterval(this.state.interval);
        }
      }, 1000);
    }
    if(this.props.timer && this.props.timer.stopTimer==true){
      clearInterval(this.state.interval);
    }
  }


  render(){
    const room = this.props.room;
    console.log(room.state);
    return(
      <div className="col-s-12 col-12">
        {<div>
        {this.state.interval && <> {this.zero(this.state.minutesCount)}:{this.zero(this.state.secondsCount)}</>}
        <div> {this.props.host && !this.state.interval &&  <button className = {this.props.team} onClick = {() => { this.startWatch() }}>Uhr starten</button>}
        {this.props.host && this.state.interval && <button className={this.props.team} onClick = {() => { this.stopWatch() }}>Uhr stoppen</button>}

        {this.props.host && <><input className={this.props.team} type = "number" defaultValue="6" onChange={(e) => {this.setState({minutes:e.target.value})}}></input>
        <input type = "number" className={this.props.team}  defaultValue="0" onChange={(e) => {this.setState({seconds:e.target.value})}}></input></>}</div>
        </div>}

        {room.state == "lobby" && <button className={this.props.team} onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {room.state == "endOfRound" && <button className={this.props.team} onClick = {() => { this.endGame() }}>Spiel beenden</button>}
        {!(room.state == "lobby" || room.state == "endOfRound") && <button className={this.props.team} onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
        <button className={this.props.team} onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
      </div>
      );
  }

}

export default Footer;

