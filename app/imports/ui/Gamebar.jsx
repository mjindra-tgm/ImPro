import React, {Component} from 'react';
import Playerlist from './Playerlist';
import Chat from './Chat';

class Gamebar extends Component{

  constructor (props) {
    super(props)
    this.state = {
    }
  }


  render(){
    const {game, players} = this.props.room;
    let self = players[this.props.playerId];

    return(
      <div className = "col-s-12 col-m-4 col-4">
        {players&&<Playerlist parentCss="col-s-12 col-m-12 col-12" leaders={game.leaders} team={self.team} name="Spieler" players={players} childCss={this.props.gamemode + "Border desc"}></Playerlist>}
        {self.team && <div style={{marginTop:"2rem"}}><Chat parentCss="col-s-12 col-m-12 col-12" roomToken={this.props.room.token} team = {players[self.id].team} playerId = {self.id} players={players} childCss={this.props.gamemode + "Border desc"}/></div>}
      </div>);
  }

}

export default Gamebar;

