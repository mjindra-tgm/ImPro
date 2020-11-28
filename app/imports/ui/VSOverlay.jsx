import React, {Component} from 'react';

class VSOverlay extends Component{
  
    constructor (props) {
    super(props)
    this.state = {
        show: true
    }
  }

  show(enabled){
      this.setState({show:enabled});
  }

  render(){
      var conTask = this.props.leadersCon[0].task;
      var proTask = this.props.leadersPro[0].task;
      if(this.props.mode.name == "Bildervortrag"){
          conTask = "Bilder sinnvoll einbinden";
          proTask = "Bilder sinnvoll einbinden";
      }
    return(<>{this.state.show &&
        <div className = "overlay">
            <div className = "vs">
                <div className="vsInner">
                    <div>{this.props.leadersCon[0].name}</div>
                    {!this.props.leadersCon[1] && <div>{conTask}</div>}
                    {this.props.leadersCon[1] && <div>{this.props.leadersCon[1].name}</div>}
                </div>

                <div className="vsInner">
                    <div>{this.props.leadersPro[0].name}</div>
                    {!this.props.leadersPro[1] && <div>{proTask}</div>}
                    {this.props.leadersPro[1] && <div>{this.props.leadersPro[1].name}</div>}
                </div>
                <button className="vsBackButton" onClick={() => { this.setState({show: false}) }}></button>
            </div>
        </div>
    }</>
    );
  }
}
export default VSOverlay