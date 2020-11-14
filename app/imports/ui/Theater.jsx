import React, {Component} from 'react';
import Section from './Section';

class Theater extends Component{

    constructor (props) {
        super(props)
        this.state = {
        }
    }


    render(){
        const {game,state, players} = this.props.room;
        let self = players[this.props.playerId];
    
        let desc = (<div><div className="listelement">ImPRO <div className="con listelement">Theater</div> ist ein Improvisationsspiel in dem es darum geht verschiedene Rollen zu spielen.</div></div>);
        console.log(self)
        return (<div className ="col-s-12 col-m-8 col-8">
        {game && game.story && <Section  team={self.team} name={game.story.name} content={game.story.desc} childCss="desc theaterBorder"></Section>}
        {self.role && <Section  team={self.team} name={self.role.name} content={self.role.desc} childCss="desc theaterBorder"></Section>}
        {self.role && <Section  team={self.team} name="Eigenschaften" content={self.role.characteristics} childCss="desc theaterBorder"></Section>}
        {self.role && self.command && <Section team={self.team} name="Aktion" content={self.command} childCss="desc theaterBorder" ></Section>}
        {(state == "lobby") && <Section  team={self.team} name="Spielbeschreibung" content={desc} childCss="desc theaterBorder"></Section>}</div>);
    }

}

export default Theater;
