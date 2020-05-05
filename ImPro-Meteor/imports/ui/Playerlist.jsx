import React, {Component} from 'react';

class Playerlist extends Component{

  constructor (props) {
    super(props)
    this.state = {
    }
  }


  render(){
    if(!this.props.players || this.props.players == [] || this.props.players == "")
      return "";

    let content = "";
    let childCss = (this.props.childCss)?this.props.childcss:"desc";
    let parentCss = (this.props.parentCss)?this.props.parentCss:"col-s-8 col-m-8 col-2";

    content = Object.values(this.props.players).map((player) => {
        let leaderCss = "";
        if(this.props.leaders && this.props.leaders.includes(player.id))
            leaderCss = "leader";
    return (<div className={leaderCss +" players "+player.team + " listelement "}>{player.name}{player.role && player.role.name}</div>);
    })

    return(
        <div className = {parentCss}>
            <h1 className ={this.props.team}>{this.props.name}</h1>
            <div className = {childCss}>{content}</div>
        </div>);
  }

}

export default Playerlist;

