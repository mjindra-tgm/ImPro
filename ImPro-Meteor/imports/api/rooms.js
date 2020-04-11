import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import Room from '../ui/Room';
import {Topics} from './Topics'
import {Modes} from './Modes'

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
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing", game:{lastLeaders: []}}});
          Meteor.call('room.game.randomTopic',{roomToken: roomToken});
        },

        'room.game.randomTopic'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          let topic = Topics[Math.floor(Math.random() * Topics.length)];
          let mode = randomMode();
          console.log(mode);
          let lastLeaders = room.game.lastLeaders || [];
          let leaderPro = [Object.values(room.players).find(p => (p.team === 'pro' && !lastLeaders.includes(p.id))).id];
          let leaderCon = [Object.values(room.players).find(p => (p.team === 'con' && !lastLeaders.includes(p.id))).id];
          lastLeaders.push(leaderPro);
          lastLeaders.push(leaderCon);
          RoomsCollection.update({ token: roomToken }, { $set: { game:{topic:topic,leaderPro:leaderPro,leaderCon: leaderCon, lastLeaders:lastLeaders, mode: mode}}})
          if(lastLeaders.length == Object.keys(room.players).length)
            RoomsCollection.update({ token: roomToken }, { $set: { state:"endOfRound"}})
        }
    });
}