import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '/imports/api/rooms';
import { ChatsCollection } from '/imports/api/chats';


Meteor.startup(function(){
  var globalObject=Meteor.isClient?window:global;
  for(var property in globalObject){
      var object=globalObject[property];
      if(object instanceof Meteor.Collection){
          object.remove({});
      }
  }
});