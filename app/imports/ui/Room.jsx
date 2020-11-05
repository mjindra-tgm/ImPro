import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../api/rooms';
import Gamebar from './Gamebar';
import Footer from './Footer';
import Header from './Header';
import Parlament from './Parlament';
import Theater from './Theater';

class Room extends Component{
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  nextImage(){
    Meteor.call('room.game.nextImage',{roomToken: this.props.room.token});
  }

  renderGame(){
    if (!this.props.room){
      return <div>Loading room</div>;
    }
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];

    let content = "";
    switch(this.props.room.gamemode){
      case "parlament":
        content = <Parlament room={this.props.room} playerId={this.props.playerId}></Parlament>;
        break;
      case "theater":
        content = <Theater room={this.props.room} playerId={this.props.playerId}></Theater>;
        break;
    }

    return (
      <div className={"bg"+this.props.room.gamemode}><div className = "darken container">
        <Header roomToken={this.props.room.token} self={self} gamemode={this.props.room.gamemode}></Header>
        
        {content}

        <Gamebar room={this.props.room} playerId = {self.id} gamemode={this.props.room.gamemode}></Gamebar>

        <Footer team = {self.team} timer = {game.timer} host = {self.host} leaveRoom = {this.props.leaveRoom} room={this.props.room}></Footer>
      </div>
      </div>
    );
  }


  render(){
    return this.renderGame();
  }

}

export default withTracker(({token}) => {
  const handle = Meteor.subscribe('rooms');

  return {
    listLoading: !handle.ready(),
    room: RoomsCollection.findOne({token: token}),
  };
})(Room);
