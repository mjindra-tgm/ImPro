import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'

export const RoomsCollection = new Mongo.Collection('rooms');

if(Meteor.isServer){

    Meteor.methods({
        'rooms.create'(profile, callback) {
            console.log("Room create");
            let playerId = profile.playerId;
            let player = {
                id: playerId,
                name: profile.name,
                team: null,
                state: "waiting",
                host: true
            };
            let players = {};
            players[playerId] = player;
            let room = RoomsCollection.insert({token: customToken(), state: "lobby", players: players}, (error, id) => {
                console.log("created");
            });
            return room;
        },
    });

}
