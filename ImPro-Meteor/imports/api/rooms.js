import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'

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
            RoomsCollection.insert({token: token, state: "lobby", players: players});
            return token;
        },
        'room.leave'({roomToken, playerId}) {
          let playerPath = `players.${playerId}`;
          console.log("Leave room", roomToken, playerId);
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
          console.log("roomToken", roomToken);
          console.log("join", player);
          let playerPath = `players.${playerId}`;
          return RoomsCollection.update({ token: roomToken }, { $set: { [playerPath]: player }} );
        },
    });

}
