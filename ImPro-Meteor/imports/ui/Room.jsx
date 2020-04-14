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
      image: ""
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

    if(game&&game.leaders){
      if(game.leaders.includes(self.id))
        isLeader = true;
    }

    console.log(game.image);
    return (
      <div class="col-8 container">
        <div> Raum:<div class = {self.team +" header"}>{this.props.room.token}</div> Name:<div class={self.team+" header"}>{self.name}</div></div>
        <div class = "col-s-4 col-4">
          {game.leaders&&game.leaders!=[]&&<Section parentCss={true} childCss={true} team={self.team} name="Sprecher" content={Object.values(game.leaders)} players={players}></Section>}
          <Section Section parentCss={true} childCss={true} team={self.team} name="Spieler" content={Object.values(players)}></Section>
        </div>

        {game && game.topic && <Section team={self.team} name={game.topic.name} content={game.topic.desc}></Section>}
        {game && game.mode && <Section team={self.team} name={game.mode.name} content={game.mode.desc}></Section>}
        {(state == "lobby") && <Section team={self.team} name="Spielbeschreibung" content={desc}></Section>}

        <div class ="col-s-12 col-12">
        {self.team && <Chat roomToken={this.props.room.token} team = {players[this.props.playerId].team} playerId = {this.props.playerId} players={players}/>}
        {isLeader && <Section parentCss="col-s-8 col-6" team={self.team} name="Redeplan" content={<textarea></textarea>}></Section>}
        </div>

        <div class="col-12 col-s-12">
          <image src={game.image} width="auto" height="auto"></image>
        </div>

        <div class="col-s-12 col-12">

        {(state == "lobby") && <button class={self.team} onClick = {() => { this.startGame() }}>Spiel starten</button>}
        {(state == "endOfRound") && <button class={self.team} onClick = {() => { this.endGame() }}>Spiel beenden</button>}
        {!(state == "lobby" || state == "endOfRound") && <button class={self.team} onClick={() => { this.randomTopic() }}>Nächste Runde</button>}
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
