import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import Room from '../ui/Room';
import {Topics} from './Topics'

export const RoomsCollection = new Mongo.Collection('rooms');

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
          return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 }} );
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
            let team = "PRO";
            if(index < shuffle.length/2)
              team = "CON";
            
            let playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team , lastLeaders: []}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing" }} );
        },

        'room.game.randomTopic'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          let topic = Topics[Math.floor(Math.random() * Topics.length)];
          let lastLeaders = room.game.lastLeaders || [];
          let leaderPro = Object.values(room.players).find(p => (p.team === 'PRO' && !lastLeaders.includes(p.id))).id;
          let leaderCon = Object.values(room.players).find(p => (p.team === 'CON' && !lastLeaders.includes(p.id))).id;
          lastLeaders.push(leaderPro);
          lastLeaders.push(leaderCon);
          RoomsCollection.update({ token: roomToken }, { $set: { game:{topic:topic,leaderPro:leaderPro,leaderCon: leaderCon, lastLeaders:lastLeaders}}})
          if(lastLeaders.length == room.players.length){
            RoomsCollection.update({ token: roomToken }, { $set: { state:"endOfRound"}})
          }
        }
    });

}
