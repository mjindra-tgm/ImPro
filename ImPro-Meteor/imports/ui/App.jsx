import React, {Component} from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Column, Row } from 'simple-flexbox';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session'
import { nanoid } from 'nanoid'
import { RoomsCollection } from '../api/rooms';

/** 
const rooms = useTracker(() => {
  return RoomsCollection.find().fetch();
});
*/

class App extends Component{

  constructor (props) {
    super(props)
    this.state = {
      name: ""
    }
  }

  renderStartPage(){
    return(
      <Column>
        <input type="text" value = {this.state.name} onChange={(e) => {this.setState({name:e.target.value})}}></input>
        <button onClick={() => {Meteor.call('rooms.create',{playerId: Meteor.userId, name: this.state.name}, (e,id) => {
          alert(id);
        })}}>Raum erstellen</button>
      </Column>
    );
  }

  render(){
    console.log(this.props);
    return (
      <div>{this.renderStartPage()}</div>
    );
  }

}

export default withTracker((id) => {
  // Do all your reactive data access in this function.
  // Note that this subscription will get cleaned up when your component is unmounted
  const handle = Meteor.subscribe('rooms');

  return {
    listLoading: !handle.ready(),
    room: RoomsCollection.find(id),
  };
})(App);


//export default App