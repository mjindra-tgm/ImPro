import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'
import { nanoid } from 'nanoid'
import { RoomsCollection } from '../api/rooms';
import Chat from './Chat';
import Section from './Section';

class Room extends Component{
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  startGame(){
    Meteor.call('room.game.start',{roomToken: this.props.room.token});
  }

  randomTopic(){
    Meteor.call('room.game.randomTopic',{roomToken: this.props.room.token});
  }

  render(){
    if (!this.props.room){
      return <div>Loading room</div>;
    }
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];
    let leaderPro = [];
    let leaderCon = [];
    let startGame = false;
    let isLeader = false;
    if(game&&game.leaderPro){
      for(let leader in game.leaderPro){
        leaderPro[leader] = players[game.leaderPro[leader]].name;
        leaderCon[leader] = players[game.leaderCon[leader]].name;
      }
      if(self.name == leaderCon || self.name == leaderPro)
        isLeader = true;
    }
    if((state == "lobby" || state == "endOfRound"))
      startGame = true;
    
      console.log(state);

    return (
      <div>
        <div class = {self.team+" room"}>{this.props.room.token}</div>
        <div class = "col-4 col-s-4 playerlist">
          <div>
              <h1 class={self.team}>Leader</h1>
              {Object.values(leaderPro).map((leader) => {
                return (<div class="listelement pro"><b>PRO:</b>{leader}</div>);
              })}

              {Object.values(leaderCon).map((leader) => {
                return (<div class="listelement con"><b>CON:</b>{leader}</div>);
              })}
          </div>

          <h1 class={self.team}>Players:</h1>
            {Object.values(players).map((player) => {
              return (<div class={player.team+" listelement"} key={player.id}>{player.name}</div>)
            })}
          </div>
        {game && game.topic && <Section team={self.team} name={game.topic.name} content={game.topic.desc}></Section>}
        {game && game.mode && <Section team={self.team} name={game.mode.name} content={game.mode.desc}></Section>}

        {self.team&&<div>
          <Chat roomToken={this.props.room.token} team = {players[this.props.playerId].team} playerId = {this.props.playerId} players={players}/>
            {isLeader&&<div class = "col-4 col-s-8">
              <h1 class={self.team}>Redeplan</h1>
              <textarea></textarea>
            </div>}
          </div>}
        <div class="col-s-12 col-12">

        {startGame&&<button class={self.team} onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {!startGame&&<button class={self.team} onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
        <button class={self.team} onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
        </div>
      </div>
    );
  }
}

export default withTracker(({token}) => {
  const handle = Meteor.subscribe('rooms');

  return {
    listLoading: !handle.ready(),
    room: RoomsCollection.findOne({token: token}),
  };
})(Room);
