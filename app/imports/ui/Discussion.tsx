import React, { Component, ReactNode } from "react";
import { RoomData } from "../api/rooms";
import Section from "./Section";
import VSOverlay from "./VSOverlay";

type DiscussionProps = {
    room: RoomData;
    playerId: string;
};

class Discussion extends React.Component<DiscussionProps> {
    vsOverlay: React.RefObject<VSOverlay>;
    constructor(props: DiscussionProps) {
        super(props);
        this.vsOverlay = React.createRef();
    }

    displayOverlay(): void {
        this.vsOverlay.current.show(true);
    }

    nextImage(): void {
        Meteor.call("room.game.nextImage", { roomToken: this.props.room.token });
    }

    render(): ReactNode {
        const { game, state, players } = this.props.room;
        let self = players[this.props.playerId];
        let isLeader = false;
        let leadersPro = [];
        let leadersCon = [];

        if (game && game.leaders && game.leaders != []) {
            for (let p of game.leaders) {
                let player = players[p];
                if (player?.team == "pro") leadersPro.push(player);
                else if (player?.team == "con") {
                    leadersCon.push(player);
                }
            }
        }

        if (!game.leaders) game.leaders = [];

        let cssImage = "col-12 col-s-12 col-m-12";
        if (game.leaders.includes(self.id)) {
            isLeader = true;
            cssImage = "col-6 col-s-12 col-m-6";
        }

        let imageTag;
        let cssPlan = "col-12 col-s-12 col-m-12";
        if (game.image) {
            cssPlan = "col-6 col-s-12 col-m-6";
        }

        return (
            <div className="col-s-12 col-m-8 col-8">
                {game && game.topic && (
                    <Section team={self.team} name={game.topic.name} childCss="desc discussionBorder">
                        {game.topic.desc}
                    </Section>
                )}
                {game && game.mode && (
                    <Section team={self.team} name={game.mode.name} childCss="desc discussionBorder">
                        {game.mode.desc}
                        {leadersPro.length > 0 && leadersCon.length > 0 && (
                            <button
                                className={self.team}
                                onClick={() => {
                                    this.displayOverlay();
                                }}
                            >
                                Aufgaben anzeigen
                            </button>
                        )}
                    </Section>
                )}
                {state == "lobby" && (
                    <Section team={self.team} name="Spielbeschreibung" parentCss="col-s-12 col-m-12 col-12" childCss="desc discussionBorder">
                        <div>
                            <div className="listelement">
                                <b>
                                    ImPRO <div className="pro listelement">Diskussion</div> ist ein Improvisationsspiel in dem es darum geht mit seinen Freunden
                                    über absurde Themen zu diskutieren.
                                </b>
                            </div>
                            Hierbei werden alle Spieler in zwei Teams unterteilt:
                            <br />
                            <div className="pro listelement">Pro(Grün)</div> und <div className="con listelement">Kontra(Rot)</div>.<br /> Wer in welchem Team
                            ist seht ihr an den Farben in denen ihre Spielernamen angezeigt werden. In jeder Runde gibt es pro Team verantwortliche{" "}
                            <div className="listelement">Sprecher</div> außer in der "Offenen Diskussion". Die anderen Teammitglieder sind dazu angehalten dem
                            Sprecher über den <div className="listelement">Team-Chat</div>
                            gute Argumente zu liefern. Der Sprecher hat einen <div className="listelement">Redeplan</div> in dem er sich seine besten Argumente
                            bei Bedarf zusammenschreiben kann.
                        </div>
                    </Section>
                )}
                {/* Image und Redeplan*/}
                {game && game.image && (
                    <Section parentCss={cssImage} team={self.team} name="Bild" content={imageTag}>
                        <div style={{ width: "100%" }}>
                            <div style={{ backgroundImage: 'url("' + game.image + '")' }} className="image"></div>
                            <button
                                className={self.team}
                                onClick={() => {
                                    this.nextImage();
                                }}
                            >
                                Nächstes Bild
                            </button>
                        </div>
                    </Section>
                )}
                {isLeader && (
                    <Section parentCss={cssPlan} team={self.team} name="Redeplan">
                        {<textarea></textarea>}
                    </Section>
                )}
                {leadersPro.length > 0 && leadersCon.length > 0 && (
                    <VSOverlay ref={this.vsOverlay} leadersPro={leadersPro} leadersCon={leadersCon} mode={game.mode}></VSOverlay>
                )}{" "}
            </div>
        );
    }
}

export default Discussion;
