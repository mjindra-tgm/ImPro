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
    return(<>{this.state.show &&
        <div className="overlay">
            <div className="vs">
                <div className="vsPro">{this.props.leadersPro[0].name}</div>

                <div className="vsCon">{this.props.leadersCon[0].name}</div>
                <button className="vsBackButton" onClick={() => { this.setState({show: false}) }}></button>
            </div>
        </div>
    }</>
    );
  }
}

export default VSOverlay;