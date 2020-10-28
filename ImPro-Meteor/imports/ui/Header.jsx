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
        <div className="headerelement">Raum:<div className = {this.props.self.team +" headerbox"}>{this.props.roomToken}</div> </div>
        <div className="headerelement">Name:<div className={this.props.self.team+" headerbox"}>{this.props.self.name}</div></div>
        <div className="headerelement">Gamemode:<div className={this.props.self.team+" headerbox"}>{this.props.gamemode}</div></div>
    </div>
      );
  }

}

export default Header;

