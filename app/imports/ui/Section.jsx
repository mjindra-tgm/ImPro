import React, {Component} from 'react';

class Section extends Component{

  constructor (props) {
    super(props)
    this.state = {
    }
  }


  render(){
    if(!this.props.content || this.props.content == [] || this.props.content == "")
      return "";

    let content = "";
    let childCss = (this.props.childCss)?this.props.childCss:"desc";
    let parentCss = (this.props.parentCss)?this.props.parentCss:"col-s-8 col-m-8 col-2";
    if(Array.isArray(this.props.content)){
      content = Object.values(this.props.content).map((element) => {
        return (<div className={this.props.team + " listelement"}><span>{element}</span></div>);
      })
    }else{
      content = this.props.content;
    }
    return(
      <div className = {parentCss}>
          <h1 className ={this.props.team + "Header"}>{this.props.name}</h1>
          <div className = {childCss}>{content}</div>
      </div>);
  }

}

export default Section;
