import React, {Component} from 'react';

class Header extends Component{

  constructor (props) {
    super(props)
    this.state = {
    }
  }

  startGame(){
    Meteor.call('room.game.start',{roomToken: this.props.roomToken});
  }

  endGame(){
    Meteor.call('room.game.end',{roomToken: this.props.roomToken});
  }

  randomTopic(){
    Meteor.call('room.game.randomTopic',{roomToken: this.props.roomToken});
  }

  zero(num){
    if(num < 10)
      return "0"+num;
    return num;
  }


  render(){

    return(
      <div className = "header"> 
        Raum:<div className = {this.props.self.team +" headerelement"}>{this.props.roomToken}</div> 
        Name:<div className={this.props.self.team+" headerelement"}>{this.props.self.name}</div>
        Gamemode:<div className={this.props.self.team+" headerelement"}>{this.props.gamemode}</div>
    </div>
      );
  }

}

export default Header;

