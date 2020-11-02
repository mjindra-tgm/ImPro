import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '../api/rooms';
import Section from './Section';
import Gamebar from './Gamebar';
import Footer from './Footer';
import Header from './Header';

class Room extends Component{
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  nextImage(){
    Meteor.call('room.game.nextImage',{roomToken: this.props.room.token});
  }

  renderParlament(){
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];
    let isLeader = false;

    //Spielbeschreibung (Nur am Anfang des Spiels)
    let desc = (<div><div className="listelement"><b>ImPRO <div className="pro listelement">Parlament</div> ist ein Improvisationsspiel in dem es darum geht mit seinen Freunden über absurde Themen zu diskutieren.</b></div>Hierbei werden alle Spieler in zwei Teams unterteilt:
    <br/><div className="pro listelement">Pro(Grün)</div> und <div className="con listelement">Kontra(Rot)</div>.<br/> Wer in welchem Team ist seht ihr an den Farben in denen ihre Spielernamen angezeigt werden.
    In jeder Runde gibt es pro Team verantwortliche <div className="listelement">Sprecher</div> außer in der "Offenen Diskussion". Die anderen Teammitglieder sind dazu angehalten dem Sprecher über den <div className="listelement">Team-Chat</div>
    gute Argumente zu liefern. Der Sprecher hat einen <div className="listelement">Redeplan</div> in dem er sich seine besten Argumente bei Bedarf zusammenschreiben kann.</div>);
    
    let cssImage = "col-12 col-s-12 col-m-12";
    if(game&&game.leaders){
      if(game.leaders.includes(self.id)){
        isLeader = true;
        cssImage = "col-6 col-s-12 col-m-6";
      }
    }

    let imageTag;
    let cssPlan = "col-12 col-s-12 col-m-12";
    if(game.image){
      imageTag = (<div><div style={{ backgroundImage: 'url("' + game.image +'")'}} className="image"></div><button className={self.team} onClick = {() => { this.nextImage() }}>Nächstes Bild</button></div>);
      cssPlan = "col-6 col-s-12 col-m-6"
    }
    if(!game.leaders)
      game.leaders = [];

    return <div className ="col-s-12 col-m-8 col-8">
    {game && game.topic && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name={game.topic.name} content={game.topic.desc} childCss="desc parlamentBorder"></Section>}
    {game && game.mode && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name={game.mode.name} content={game.mode.desc} childCss="desc parlamentBorder"></Section>}
    {(state == "lobby") && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name="Spielbeschreibung" content={desc} childCss="desc parlamentBorder"></Section>}

    {/* Image und Redeplan*/}
    {game && game.image && <Section parentCss={cssImage} team={self.team} name="Bild" content={imageTag}></Section>}
    {isLeader && <Section parentCss = {cssPlan} team={self.team} name="Redeplan" content={<textarea></textarea>}></Section>}</div>;
  }

  renderTheater(){
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];

    let desc = (<div><div className="listelement">ImPRO <div className="con listelement">Theater</div> ist ein Improvisationsspiel in dem es darum geht verschiedene Rollen zu spielen.</div></div>);

    return <div className ="col-s-12 col-m-8 col-8">
    {game && game.story && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name={game.story.name} content={game.story.desc} childCss="desc theaterBorder"></Section>}
    {self.role && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name={self.role.name} content={self.role.desc} childCss="desc theaterBorder"></Section>}
    {self.role && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name="Eigenschaften" content={self.role.characteristics} childCss="desc theaterBorder"></Section>}
    {self.role && self.command && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name="Aktion" content={self.command} childCss="desc theaterBorder" ></Section>}
    {(state == "lobby") && <Section parentCss={"col-6 col-s-12 col-m-6"} team={self.team} name="Spielbeschreibung" content={desc} childCss="desc theaterBorder"></Section>}</div>;
  }



  renderGame(){
    if (!this.props.room){
      return <div>Loading room</div>;
    }
    const {game,state, players} = this.props.room;
    let self = players[this.props.playerId];
    let isLeader = false;
    
    if(game&&game.leaders){
      if(game.leaders.includes(self.id)){
        isLeader = true;
      }
    }

    if(!game.leaders)
      game.leaders = [];

    let content = "";
    switch(this.props.room.gamemode){
      case "parlament":
        content = this.renderParlament();
        break;
      case "theater":
        content = this.renderTheater();
        break;
    }

    return (
      <div className={"bg"+this.props.room.gamemode}><div className = "darken container">
        <Header roomToken={this.props.room.token} self={self} gamemode={this.props.room.gamemode}></Header>
        
        {content}

        <Gamebar room={this.props.room} playerId = {self.id} gamemode={this.props.room.gamemode}></Gamebar>

        <Footer team = {this.props.team} timer = {game.timer} host = {self.host} leaveRoom = {this.props.leaveRoom} room={this.props.room}></Footer>
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
