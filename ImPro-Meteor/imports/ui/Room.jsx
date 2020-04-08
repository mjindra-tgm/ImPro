import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'
import { nanoid } from 'nanoid'
import { RoomsCollection } from '../api/rooms';
import Chat from './Chat';

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
    console.log(this.props.room);
    const {game,state, players} = this.props.room;
    let leaderPro = "";
    let leaderCon = "";
    if(game&&game.leaderPro){
      leaderPro = players[game.leaderPro].name;
      leaderCon = players[game.leaderCon].name;
    }


    return (
      <Column>
        RoomToken: {this.props.room.token}


        <br/>
        {game && game.topic && game.topic.name}<br/>
        {game && game.topic && game.topic.desc}<br/>
        <h1>Leader</h1>
        <b>PRO:</b>{leaderPro}<b>CON:</b>{leaderCon}
        <br/>
        <br/>
        <h1>Player:</h1>
        <ul>
          {Object.values(players).map((player) => {
            return (<li key={player.id}>{player.name} - {player.team}</li>)
          })}
        </ul>

        {(state == "lobby" || state == "endOfRound") && <button onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {state != "lobby" && state != "endOfRound"&& <button onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
        <button onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
        <Chat roomToken={this.props.room.token} team = {players[this.props.playerId].team} playerId = {this.props.playerId} players={players}/>
      </Column>
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
