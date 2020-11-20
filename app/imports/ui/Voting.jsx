import React, {Component} from 'react';

class Voting extends Component{
  
    constructor (props) {
    super(props)
    this.state = {
    }
  }

  nextVote(vote){
    var points = this.props.game.points;
    points = Object.keys(points[vote]);
    let values = {};
    for(var p of points){
      values[p] = this.state[p];
    }

    Meteor.call('room.game.vote',{roomToken: this.props.roomToken, playerId: this.props.playerId, values:values});

  }

  renderVotingSliders(votingPoints, vote){
    const {game, players} = this.props;
    var leaderTask = "gute Teamarbeit";
    if(game.mode.name == "Einzel-Diskussion"){
      var leader = players[game.leaders[0]];
      if(leader.team != vote)
        leader = players[game.leaders[1]];

      leaderTask = leader.task;
    }else if(game.mode.name == "Bildervortrag"){
      leaderTask = "Bilder passend eingebunden";
    }

    let content = votingPoints.map((i) => {
      var title = i == "Aufgabe erfüllt" ? leaderTask : i;
      return <>{title} <div className={vote+"Text stars"}>
          <div onClick={()=>{this.setState({[i]:1})}}>{(this.state[i]>=1 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
          <div onClick={()=>{this.setState({[i]:2})}}>{(this.state[i]>=2 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
          <div onClick={()=>{this.setState({[i]:3})}}>{(this.state[i]>=3 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
          <div onClick={()=>{this.setState({[i]:4})}}>{(this.state[i]>=4 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
          <div onClick={()=>{this.setState({[i]:5})}}>{(this.state[i]>=5 && <span role="img" aria-label="star">★</span>) || <span role="img" aria-label="star">☆</span>}</div>
      </div></>
    });
    return content;
  }

  endVoting(){
    Meteor.call('room.game.endVoting',{roomToken: this.props.roomToken})
  }


  renderPoints(points, final = false){
    const {players} = this.props;
    var divider = Object.keys(players).length;

    if(final)
      divider *= this.props.game.currentRound; 

    var proPoints = Object.keys(points["pro"]).map((p) => {
      var percent =  parseInt((points["pro"][p] / (5 * divider)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="pro votingPoints" style={{width: percent}}>{p+": "+percent}</div></div>);
    });

    var conPoints = Object.keys(points["con"]).map((p) => {
      var percent = parseInt((points["con"][p] / (5 * divider)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="con votingPoints" style={{width: percent}}>{p+": "+percent}</div></div>);
    });
    return(<div className="ranking">
      <div className="proRankingChild">
        Team Pro
        {proPoints}
      </div>

      <div className="conRankingChild">
        Team Kontra
        {conPoints}
      </div>
      </div>)
  }

  renderSelfPoints(self){
    const {players} = this.props;
    var divider = Object.keys(players).length * this.props.game.currentRound;
    var points = self.points;

    var selfPoints = Object.keys(points).map((p) => {
      var percent =  parseInt((points[p] / (5 * divider)) * 100) + "%";
      return (<div className="votingPointsParent"><div className={self.team+" votingPoints"} style={{width: percent}}>{p+": "+percent}</div></div>);
    });

    return(<div className="ranking">
      <div className={self.team+"RankingChild"}>
        Eigene Wertung
        {selfPoints}
      </div>
      </div>)
  }


  render(){
      var points = this.props.game.points;
      var content = "";
      var voteModes = ["pro","con","finished"];
      var self = this.props.players[this.props.playerId];
      var vote = self.vote || 0;
      var selfRating = null;
      vote = voteModes[vote];
      console.log(self.points)
      if(self.vote != 2){ 
        content = this.renderVotingSliders(Object.keys(points[vote]), vote);
      }else{
        if(this.props.state == "lastRanking"){
          content = this.renderPoints(this.props.game.finalPoints,true);
          selfRating = this.renderSelfPoints(self);
        }else{
          content = this.renderPoints(points);
        }
      }

    return(          
    <div className="voting col-m-6 col-s-12 col-5">
        <div className={"votingHeader " + vote}>{vote.toUpperCase()}</div>
        <br/>
        {selfRating}
        {content}
        {self.vote != 2 && <button className = {vote} onClick={() => { this.nextVote(vote) }}>Weiter</button>}
    </div>
    );
  }
}
export default Voting