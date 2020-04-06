import { Mongo } from 'meteor/mongo';
import { nanoid } from 'nanoid'
import { Meteor } from 'meteor/meteor';

export const RoomsCollection = new Mongo.Collection('rooms');

Meteor.methods({
    'rooms.create'(profile) {
        console.log("Room create");
        console.log(Meteor.user);
        if(!Meteor.user){
            let a = Accounts.createUser({
                username: nanoid(10),
                profile: {
                    name: profile.name
                }
            });
            console.log("Account:", a);
        }
        return RoomsCollection.insert({token: nanoid(4), state: "lobby", players: [Meteor.userId], host: Meteor.userId});
    },
  });
