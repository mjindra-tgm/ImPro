import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import {Topics} from './Topics'
import {Modes} from './Modes'
import {ImagesCollection} from './images'

export const RoomsCollection = new Mongo.Collection('rooms');
export const ModesCollection = new Mongo.Collection('modes');

function randomMode(){
  let modesFactor = [];
  for(let elem of Modes){
    for(let i = 0; i < elem.randomFactor; i++){
      modesFactor[modesFactor.length] = elem;
    }
  }
  mode = modesFactor[Math.floor(Math.random() * modesFactor.length)];
  return mode;
}

function randomImage() {
  let images = ImagesCollection.find({}).fetch();
  let image = images[Math.floor(Math.random() * images.length)];
  return image.base;
}

if(Meteor.isServer){
    Meteor.methods({
        'rooms.create'(profile, callback) {
            let playerId = profile.playerId;
            let player = {
                id: playerId,
                name: profile.name,
                team: null,
                state: "waiting",
                host: true
            };
            let players = {
              [playerId]: player
            };
            let token = customToken();
            RoomsCollection.insert({token: token, state: "lobby", players: players,game:{}});
            return token;
        },

        'room.leave'({roomToken, playerId}) {
          let playerPath = `players.${playerId}`;
          return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 }});
        },

        'room.join'({roomToken, playerId, name}) {
          let player = {
              id: playerId,
              name: name,
              team: null,
              state: "waiting",
              host: false
          };
          let playerPath = `players.${playerId}`;
          return RoomsCollection.update({ token: roomToken }, { $set: { [playerPath]: player }} );
        },

        'room.game.start'({roomToken}) {
          let room = RoomsCollection.findOne({token: roomToken});
          var shuffle = Object.values(room.players);
          shuffle.sort(() => {
            return .5 - Math.random();
          })
          shuffle.forEach((player,index) => {
            let team = "pro";
            if(index < shuffle.length/2)
              team = "con";
            
            let playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing"}});
          Meteor.call('room.game.randomTopic',{roomToken: roomToken});
        },

        'room.game.end'({roomToken}) {
          let room = RoomsCollection.findOne({token: roomToken});
          Object.values(room.players).forEach((player,index) => {         
            let playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: ""}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { state: "lobby", game:{leaders:[], lastLeaders: []}}});
          Meteor.call('chats.clear',{roomToken});
        },

        'room.game.randomTopic'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          let topic = Topics[Math.floor(Math.random() * Topics.length)];
          let mode = randomMode();
          var shuffle = Object.values(room.players);
          shuffle.sort(() => {
            return .5 - Math.random();
          })
          let lastLeaders = room.game.lastLeaders || [];
          let leaders = [];
          let image = "";
          switch(mode.name){
            case "Partner-Diskussion":
              leaders = [shuffle.find(p => (p.team === 'pro')).id,shuffle.find(p => (p.team === 'con')).id];
              leaders.push(shuffle.find(p => (p.team === 'pro' && p.id != leaders[0])).id,shuffle.find(p => (p.team === 'con' && p.id != leaders[1])).id);
              break;
            
            case "Bildervortrag":
              image = randomImage();

            case "Einzel-Diskussion":
              leaders = [shuffle.find(p => (p.team === 'pro' && !lastLeaders.includes(p.id))).id,shuffle.find(p => (p.team === 'con' && !lastLeaders.includes(p.id))).id];
              lastLeaders.push(leaders[0],leaders[1]);
              break;
          }

          console.log(lastLeaders);
          console.log("image: "+image)
          RoomsCollection.update({ token: roomToken }, { $set: { game:{topic:topic,leaders:leaders, lastLeaders:lastLeaders, mode: mode, image:image}}})
          if(lastLeaders.length == Object.keys(room.players).length || (Object.keys(room.players).length%2!=0&&Object.keys(room.players).length-1==lastLeaders.length))
            RoomsCollection.update({ token: roomToken }, { $set: { state:"endOfRound"}})
        }
    });
}