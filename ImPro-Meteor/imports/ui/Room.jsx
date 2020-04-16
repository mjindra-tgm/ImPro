import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../api/rooms';
import Chat from './Chat';
import Section from './Section';

class Room extends Component{
  constructor (props) {
    super(props)
    this.state = {
      minutes: 6,
      seconds: 0
    }
  }

  startGame(){
    Meteor.call('room.game.start',{roomToken: this.props.room.token});
  }

  endGame(){
    Meteor.call('room.game.end',{roomToken: this.props.room.token});
  }

  randomTopic(){
    Meteor.call('room.game.randomTopic',{roomToken: this.props.room.token});
  }

  nextImage(){
    Meteor.call('room.game.nextImage',{roomToken: this.props.room.token});
  }

  startWatch(){
    Meteor.call('room.game.startWatch',{roomToken: this.props.room.token, minutes: this.state.minutes, seconds: this.state.seconds});
  }

  zero(num){
    if(num < 10)
      return "0"+num;
    return num;
  }


  render(){
    let desc = (<div><div class="listelement"><b>ImPRO ist ein Improvisationsspiel in dem es darum geht mit seinen Freunden über absurde Themen zu diskutieren.</b></div>Hierbei werden alle Spieler in zwei Teams unterteilt:
     <br/><div class="pro listelement">Pro(Blau)</div> und <div class="con listelement">Kontra(Rot)</div>.<br/> Wer in welchem Team ist seht ihr an den Farben in denen ihre Spielernamen angezeigt werden. 
     In jeder Runde gibt es pro Team verantwortliche <div class="listelement">Sprecher</div> außer in der "Offenen Diskussion". Die anderen Teammitglieder sind dazu angehalten dem Sprecher über den <div class="listelement">Team-Chat</div>
     gute Argumente zu liefern. Der Sprecher hat einen <div class="listelement">Redeplan</div> in dem er sich seine besten Argumente bei Bedarf zusammenschreiben kann.</div>);
    if (!this.props.room){
      return <div>Loading room</div>;
    }
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];
    let isLeader = false;
    let imageTag = (<div><img src={game.image} class="image"></img><button class={self.team} onClick = {() => { this.nextImage() }}>Nächstes Bild</button></div>);
    
    if(game&&game.leaders){
      if(game.leaders.includes(self.id))
        isLeader = true;
    }

    let cssChatPlan = "col-s-12 col-m-6 col-6";
    if(game.image){
      cssChatPlan = "col-s-12 col-m-4 col-3";
    }

    return (
      <div className="container">
        <div> Raum:<div class = {self.team +" header"}>{this.props.room.token}</div> Name:<div class={self.team+" header"}>{self.name}</div></div>
        <div className = "col-s-4 col-4">
          {game.leaders&&game.leaders!=[]&&<Section parentCss={true} childCss={true} team={self.team} name="Sprecher" content={Object.values(game.leaders)} players={players}></Section>}
          <Section Section parentCss={true} childCss={true} team={self.team} name="Spieler" content={Object.values(players)}></Section>
        </div>

        {game && game.topic && <Section parentCss="col-s-8 col-4" team={self.team} name={game.topic.name} content={game.topic.desc}></Section>}
        {game && game.mode && <Section parentCss="col-s-12 col-4" team={self.team} name={game.mode.name} content={game.mode.desc}></Section>}
        {(state == "lobby") && <Section parentCss="col-s-8 col-6 col-8" team={self.team} name="Spielbeschreibung" content={desc}></Section>}


        <div class ="col-s-12 col-12">
        {self.team && <Chat parentCss={cssChatPlan} roomToken={this.props.room.token} team = {players[this.props.playerId].team} playerId = {this.props.playerId} players={players}/>}
        {game && game.image && <Section parentCss="col-s-12 col-m-4 col-6" team={self.team} name="Bild" content={imageTag}></Section>}
        {isLeader && <Section parentCss={cssChatPlan} team={self.team} name="Redeplan" content={<textarea></textarea>}></Section>}
        </div>
        
        <div class="col-s-12 col-12">
        {game.timer && <div> 
        {this.zero(game.timer.minutes)}:{this.zero(game.timer.seconds)}
        {!game.timer.locked && isLeader &&<div><button class={self.team} onClick = {() => { this.startWatch() }}>Uhr starten</button>
        <input type = "number" defaultValue="6" onChange={(e) => {this.setState({minutes:e.target.value})}}></input>
        <input type = "number" defaultValue="0" onChange={(e) => {this.setState({seconds:e.target.value})}}></input></div>}
        </div>}

        {(state == "lobby") && <button className={self.team} onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {(state == "endOfRound") && <button className={self.team} onClick = {() => { this.endGame() }}>Spiel beenden</button>}
        {!(state == "lobby" || state == "endOfRound") && <button className={self.team} onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
        <button className={self.team} onClick={() => { this.props.leaveRoom() }}>Raum verlassen</button>
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
