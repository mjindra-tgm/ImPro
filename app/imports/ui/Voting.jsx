import React, { Component } from 'react';
import { DiscussionVoting } from '../api/VoteSystem';

class Voting extends Component {

  constructor(props) {
    super(props)
    this.state = {
    }
  }

  nextVote(vote) {
    var points = this.props.game.points;
    points = Object.keys(points[vote]);
    let values = {};
    for (var p of points) {
      values[p] = this.state[p];
    }

    Meteor.call('room.game.vote', { roomToken: this.props.roomToken, playerId: this.props.playerId, values: values });

  }

  renderVotingSliders(votingPoints, vote) {
    const { game, players } = this.props;
    var leaderTask = "gute Teamarbeit";
    if (game.mode.name == "Einzel-Diskussion") {
      var leader = players[game.leaders[0]];
      if (leader.team != vote)
        leader = players[game.leaders[1]];

      leaderTask = leader.task;
    } else if (game.mode.name == "Bildervortrag") {
      leaderTask = "Bilder passend eingebunden";
    }

    let content = votingPoints.map((i) => {
      var title = i == "Aufgabe erfüllt" ? leaderTask : i;
      return <>{title} <div className={vote + "Text stars"}>
        <div onClick={() => { this.setState({ [i]: 1 }) }}>{(this.state[i] >= 1 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
        <div onClick={() => { this.setState({ [i]: 2 }) }}>{(this.state[i] >= 2 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
        <div onClick={() => { this.setState({ [i]: 3 }) }}>{(this.state[i] >= 3 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
        <div onClick={() => { this.setState({ [i]: 4 }) }}>{(this.state[i] >= 4 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
        <div onClick={() => { this.setState({ [i]: 5 }) }}>{(this.state[i] >= 5 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
      </div></>
    });
    return content;
  }

  endVoting() {
    Meteor.call('room.game.endVoting', { roomToken: this.props.roomToken })
  }


  renderPoints(points) {
    const { players } = this.props;
    var divider = Object.keys(players).length;
    var proPointsAbs = 0;
    var conPointsAbs = 0;

    var proPoints = Object.keys(points["pro"]).map((p) => {
      proPointsAbs += points["pro"][p];
      var percent = parseInt((points["pro"][p] / (5 * divider)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="pro votingPoints" style={{ width: percent }}>{p + ": " + percent}</div></div>);
    });

    var conPoints = Object.keys(points["con"]).map((p) => {
      conPointsAbs += points["con"][p];
      var percent = parseInt((points["con"][p] / (5 * divider)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="con votingPoints" style={{ width: percent }}>{p + ": " + percent}</div></div>);
    });

    var proPercentAbs = parseInt((proPointsAbs / (5 * divider * 4)) * 100) + "%";
    var conPercentAbs = parseInt((conPointsAbs / (5 * divider * 4)) * 100) + "%";
    return (<div className="ranking">
      <div className="proRankingChild">
        Team Pro
        {proPoints}
        <div className="votingPointsParent"><div className="pro votingPoints" style={{ width: proPercentAbs }}><b>{"Gesamt: " + proPercentAbs}</b></div></div>
      </div>

      <div className="conRankingChild">
        Team Kontra
        {conPoints}
        <div className="votingPointsParent"><div className="con votingPoints" style={{ width: conPercentAbs }}><b>{"Gesamt: " + conPercentAbs}</b></div></div>
      </div>
    </div>)
  }

  renderSelfPoints(self) {
    const { players } = this.props;
    var points = self.points;
    if (!points)
      return null;
    var selfPoints = Object.keys(points).map((pointCategory) => {
      var percent = parseInt((points[pointCategory] / (this.props.game.currentRound * 5)) * 100) + "%";
      return (<div className="votingPointsParent"><div className={self.team + " votingPoints"} style={{ width: percent }}>{pointCategory + ": " + percent}</div></div>);
    });

    return (<div className="ranking">
      <div className={self.team + "RankingChild"}>
        Eigene Wertung
        {selfPoints}
      </div>
    </div>)
  }

  renderPlayerTitles() {
    var content = DiscussionVoting.map((p) => {
      var sorted = Object.keys(this.props.players).sort((a, b) => {
        var a = this.props.players[a];
        var b = this.props.players[b];
        if (!a.points) return 1;
        if (!b.points) return -1;
        if (a.points[p.name] < b.points[p.name]) {
          return 1;
        } else {
          return -1;
        }
      });
      var player = this.props.players[sorted[0]];
      return (
        <div className={"players " + player.team + " listelement "}> <div style={{ fontWeight: "bold" }}>{player.name}</div> <br />{p.title}</div>
      );
    });

    return content;
  }

  renderPlayerPoints() {
    var playerPoints = {};
    const { players } = this.props;
    for (var player of Object.values(players)) {
      playerPoints[player.id] = 0;

      for (var type in player.points) {
        playerPoints[player.id] += player.points[type];
      }
    }
    var sorted = Object.keys(playerPoints).sort((a, b) => {
      return playerPoints[b] - playerPoints[a];
    })
    var divider = this.props.game.currentRound//Object.keys(players[Object.keys(players)[0]].points).length;
    var result = sorted.map((p) => {
      var percent = parseInt((playerPoints[p] / divider)) + "%";
      return (<div className="votingPointsParent"><div className={players[p].team + " votingPoints"} style={{ width: percent }}>{players[p].name + ": " + percent}</div></div>);
    });

    return (<div className="ranking">
      <div className={players[sorted[0]].team + "RankingChild"}>
        Bestenliste
        {result}
      </div>
    </div>)
  }


  render() {

    var points = this.props.game.points;
    var teamPoints = null;
    var voteModes = ["pro", "con", "finished"];
    var self = this.props.players[this.props.playerId];
    var vote = self.vote || 0;
    var selfRating = null;
    var playerTitles = null;
    var playerPoints = null;
    vote = voteModes[vote];
    if (self.vote != 2) {
      teamPoints = this.renderVotingSliders(Object.keys(points[vote]), vote);
    } else {
      if (this.props.state == "lastRanking") {
        selfRating = this.renderSelfPoints(self);
        playerTitles = <div className="ranking"> {this.renderPlayerTitles()} </div>;
        //playerPoints = this.renderPlayerPoints();
      } else {
        teamPoints = this.renderPoints(points);
      }
    }

    return (
      <div className="voting col-m-6 col-s-12 col-5">
        <div className={"votingHeader " + vote}>{vote.toUpperCase()}</div>
        <br />
        {playerTitles}
        {playerPoints}
        {selfRating}
        {teamPoints}
        {self.vote != 2 && <button className={vote} onClick={() => { this.nextVote(vote) }}>Weiter</button>}
      </div>
    );
  }
}
export default Voting