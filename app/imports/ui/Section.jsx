import React, {Component} from 'react';

class Section extends Component{

  constructor (props) {
    super(props)
    this.state = {
      collapsed: false
    }
  }


  render(){

    let childCss = (this.props.childCss)?this.props.childCss:"desc";
    let parentCss = (this.props.parentCss)?this.props.parentCss:"col-s-12 col-m-6 col-6";
    if(this.state.collapsed)
      childCss += " collapsed";
    return(
      <div className = {parentCss}>
          <h1 className ={this.props.team + "Header"} onClick = {() => {this.setState({collapsed: !this.state.collapsed})}}>{this.props.name}</h1>
          <div className = {childCss}>{this.props.children}</div>
      </div>);
  }

}

export default Section;
