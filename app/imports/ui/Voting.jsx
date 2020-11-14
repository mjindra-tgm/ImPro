import React, {Component} from 'react';

class Voting extends Component{
  
    constructor (props) {
    super(props)
    this.state = {
    }
  }

  nextVote(vote){
    const {game, players} = this.props;
    var points = game.points;
    points = Object.keys(points[points.length-1][vote]);
    let values = {};
    for(var p of points){
      values[p] = this.state[p];
    }

    if(game.leaders && game.leaders.length == 2){
      var leader = players[game.leaders[0]];
      if(leader.team != vote)
        leader = players[game.leaders[1]];
      values["Aufgabe erfüllt"] = this.state[leader.task];
    }
    Meteor.call('room.game.vote',{roomToken: this.props.roomToken, vote: this.props.players[this.props.playerId].vote, playerId: this.props.playerId, values:values});

  }

  renderVotingSliders(votingPoints, vote){
    let content = votingPoints.map((i) => {
        return <>{i} <div className={vote+"Text stars"}>
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


  renderPoints(points){
    var votedPro = 0;
    var votedCon = 0;
    const {players} = this.props;

    for(var p in players){
      if(players[p].vote == 1){
        votedPro ++;
      }else if(players[p].vote == 2){
        votedPro ++;
        votedCon ++;
      }
    }
    var proPoints = Object.keys(points["pro"]).map((p) => {
      var percent =  parseInt((points["pro"][p] / (5 * votedPro)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="pro votingPoints" style={{width: percent}}>{p+": "+percent}</div></div>);
    });

    var conPoints = Object.keys(points["con"]).map((p) => {
      var percent = parseInt((points["con"][p] / (5 * votedCon)) * 100) + "%";
      return (<div className="votingPointsParent"><div className="con votingPoints" style={{width: percent}}>{p+": "+percent}</div></div>);
    });
    return(<div className="ranking">
      <div className="proRankingChild">
        {proPoints}
      </div>

      <div className="conRankingChild">
        {conPoints}
      </div>
      </div>)
  }

  render(){
      var points = this.props.game.points;
      var content = "";
      var voteModes = ["pro","con","finished"];
      var self = this.props.players[this.props.playerId];
      var vote = self.vote || 0;
      vote = voteModes[vote];
      if(self.voted != 2){
        content = this.renderVotingSliders(Object.keys(points[points.length-1][vote]), vote);
      }else
        content = this.renderPoints(points[points.length-1]);

    return(          
    <div className="voting col-m-5 col-s-12 col-5">
        <div className={"votingHeader " + vote}>{vote.toUpperCase()}</div>
        <br/>
        {content}
        {self.vote != 2 && <button className = {vote} onClick={() => { this.nextVote(vote) }}>Weiter</button>}
        {self.vote == 2 && self.host && <button className = {vote} onClick={() => { this.endVoting() }}>Spiel fortsetzen</button>}
    </div>
    );
  }
}
export default Voting