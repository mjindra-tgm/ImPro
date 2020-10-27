import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet, random} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import {Topics, Stories, Commands} from './Topics'
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

function doCommandInterval(roomToken, story) {
  room = RoomsCollection.findOne({token: roomToken});
  let commandInterval = 300000;
  let randomCommands = Commands.concat();
  randomCommands.sort(() => {
    return .5 - Math.random();
  });
  let commands = story.commands;
  let players = Object.values(room.players);
  let interval = Meteor.setInterval(() => {
    let player = players[Math.floor(Math.random() * players.length)];
    let command = "";
    if(commands && commands.length){
      command = commands.pop();
      if(command.for){
        player = players.find((p) => {
          return p.role.name == commands.for; 
        });
      }
    }else if(randomCommands && randomCommands.length){
      command = randomCommands.pop();
    }
    let playerCommandPath = `players.${player.id}.command`;

    if(command != "")
      RoomsCollection.update({ token: roomToken }, { $set: { [playerCommandPath]: command }} );
  }, commandInterval);
  RoomsCollection.update({ token: roomToken }, { $set: { 'commandinterval': interval }} );
}

if(Meteor.isServer){
    Meteor.methods({

        //Raum erstellen
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
            console.log(profile.settings);
            let token = customToken();
            RoomsCollection.insert({token: token, state: "lobby", players: players, game:{}, gamemode: profile.gamemode ,settings: profile.settings});
            return token;
        },

        //Raum verlassen
        'room.leave'({roomToken, playerId}) {
          let playerPath = `players.${playerId}`;
          return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 }});
        },

        //Raum betreten
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

        //Spiel starten
        'room.game.start'({roomToken}) {
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing"}});
          let room = RoomsCollection.findOne({token: roomToken});
          switch(room.gamemode){
            case "parlament":
              Meteor.call('room.game.randomTopic',{roomToken: roomToken});

              //Wenn die Spieler nicht mit jedem Topic gewechselt werden, wird hier erstmals das Team zufallsgeneriert
              if(!room.settings.mixPlayers){
                var shuffle = Object.values(room.players);
                shuffle.sort(() => {
                  return .5 - Math.random();
                })
                console.log("mixed on start")
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
              }

              break;
            case "theater":
              Meteor.call('room.game.randomStory',{roomToken: roomToken});
              break;
          } 
        },

        //Spiel beenden
        'room.game.end'({roomToken}) {
          let room = RoomsCollection.findOne({token: roomToken});
          Object.values(room.players).forEach((player,index) => {         
            let playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: ""}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { state: "lobby", game:{leaders:[], lastLeaders: []}}});
          Meteor.call('chats.clear',{roomToken});
        },

        //Nächstes zufälliges Bild laden
        'room.game.nextImage'({roomToken}) {
          let room = RoomsCollection.findOne({token: roomToken});
          let image = randomImage();
          RoomsCollection.update({ token: roomToken }, { $set: {'game.image':image}})
        },

        //Uhr starten
        'room.game.startWatch'({roomToken, seconds,callback}){
          let room = RoomsCollection.findOne({token: roomToken});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.seconds':seconds,'game.timer.startTimer':true}});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.startTimer':false}});
        },

        //Uhr stoppen
        'room.game.stopWatch'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.stopTimer':true}});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.stopTimer':false}});
        },

        //Zufällige Story(im Theater Modus)
        'room.game.randomStory'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          Meteor.clearInterval(room.commandInterval)
          let story = Stories[Math.floor(Math.random() * Stories.length)];
          let roles = story.roles;

          var shuffle = Object.values(room.players);
          shuffle.sort(() => {
            return .5 - Math.random();
          })
          shuffle.forEach((player,index) => {
            let role = {};
            if(roles.necessary.length){
              role = roles.necessary.pop();
            }else{
              role = roles.optional[Math.floor(Math.random() * roles.optional.length)];
            }    
            let playerRolePath = `players.${player.id}.role`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerRolePath]: role}} );
            let playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: 'theater'}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { game:{timer:{minutes:10,seconds:0}, story:story}}});
          doCommandInterval(roomToken, story);
        },

        //Zufälliges Thema(im Parlament Modus)
        'room.game.randomTopic'({roomToken}){
          let room = RoomsCollection.findOne({token: roomToken});
          var shuffle = Object.values(room.players);

          //Spieler durchmischen
          if(room.settings.mixPlayers){
            console.log("mixed on topic")
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
          }

          Meteor.call('chats.clear',{roomToken});
          room = RoomsCollection.findOne({token: roomToken});
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

          RoomsCollection.update({ token: roomToken }, { $set: { game:{timer:{minutes:6,seconds:0},topic:topic,leaders:leaders, lastLeaders:lastLeaders, mode: mode, image:image}}})
          if(lastLeaders.length == Object.keys(room.players).length || (Object.keys(room.players).length%2!=0&&Object.keys(room.players).length-1==lastLeaders.length))
            RoomsCollection.update({ token: roomToken }, { $set: { state:"endOfRound"}})
        }
    });
}