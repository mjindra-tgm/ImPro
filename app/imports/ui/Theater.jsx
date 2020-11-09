import React, {Component} from 'react';
import Section from './Section';
import ListSection from './ListSection';

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
        return (<div className ="col-s-12 col-m-8 col-8">
        {game && game.story && <Section  team={self.team} name={game.story.name} childCss="desc theaterBorder">{game.story.desc}</Section>}
        {self.role && <Section  team={self.team} name={self.role.name} childCss="desc theaterBorder">{self.role.desc}</Section>}
        {self.role && <ListSection  team={self.team} name="Eigenschaften" childCss="desc theaterBorder" >{self.role.characteristics}</ListSection>}
        {self.role && self.command && <Section team={self.team} name="Aktion" childCss="desc theaterBorder" >{self.command}</Section>}
        {(state == "lobby") && <Section  team={self.team} name="Spielbeschreibung" childCss="desc theaterBorder">{desc}</Section>}</div>);
    }

}

export default Theater;
