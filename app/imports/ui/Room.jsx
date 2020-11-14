import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../api/rooms';
import Gamebar from './Gamebar';
import Footer from './Footer';
import Header from './Header';
import Discussion from './Discussion';
import Theater from './Theater';
import Voting from './Voting';

class Room extends Component{
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  renderGame(){
    if (!this.props.room){
      return <div>Loading room</div>;
    }
    console.log(this.props.room)
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];

    let content = "";
    if(state == "voting"){
      content = <Voting roomToken={this.props.room.token} playerId = {self.id} game = {game} players = {players}></Voting>;
    }else{
      switch(this.props.room.gamemode){
        case "discussion":
          content = <Discussion room={this.props.room} playerId={this.props.playerId}></Discussion>;
          break;
        case "theater":
          content = <Theater room={this.props.room} playerId={this.props.playerId}></Theater>;
          break;
      }
    }
      
    return (
      <div className={"bg"+this.props.room.gamemode}><div className = "darken container">
        <Header roomToken={this.props.room.token} self={self} gamemode={this.props.room.gamemode}></Header>
        
        {content}

        {state != "voting" && <Gamebar room={this.props.room} playerId = {self.id} gamemode={this.props.room.gamemode}></Gamebar>}

        <Footer team = {self.team} timer = {game.timer} host = {self.host} leaveRoom = {this.props.leaveRoom} room={this.props.room}></Footer>
      </div>
      </div>);
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
