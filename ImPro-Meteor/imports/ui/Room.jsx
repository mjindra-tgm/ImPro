import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'
import { nanoid } from 'nanoid'
import { RoomsCollection } from '../api/rooms';

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
    const {game} = this.props.room;
    return (
      <Column>
        RoomToken: {this.props.room.token}


        <br/>
        {game && game.topic && game.topic.name}<br/>
        {game && game.topic && game.topic.desc}
        <br/>
        Player:

        <ul>
          {Object.values(this.props.room.players).map((player) => {
            return (<li key={player.id}>{player.name} - {player.id} - {player.team}</li>)
          })}
        </ul>


        <button onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
        <button onClick={() => { this.startGame() }}>Spiel starten</button>
        <button onClick={() => { this.randomTopic() }}>Nächste Runde</button>
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
