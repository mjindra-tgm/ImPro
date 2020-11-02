import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet, random} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import {Topics, Stories, Commands} from './Topics'
import {Modes} from './Modes'
import {ImagesCollection} from './images'

export const RoomsCollection = new Mongo.Collection('rooms');

function randomMode(propabilities){
  let modesFactor = [];
  for(let elem of propabilities){
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
            let token = customToken();
            RoomsCollection.insert({token: token, state: "lobby", players: players, game:{propabilities: profile.propabilities}, gamemode: profile.gamemode ,settings: profile.settings});
            return token;
        },

        'room.game.changeSettings'({roomToken,settingsList}){
          let room = RoomsCollection.findOne({token: roomToken});
          settings = room.settings;
          for(setting in settingsList){
            settings[setting] = settingsList[setting];
          }
          RoomsCollection.update({ token: roomToken }, { $set: { settings: settings }});
          room = RoomsCollection.findOne({token: roomToken});
          console.log(room.settings);
        },

        //Raum verlassen
        'room.leave'({roomToken, playerId}) {
          let room = RoomsCollection.findOne({token: roomToken});
          if(Object.keys(room.players).length == 1){
            return RoomsCollection.remove({ token: roomToken });
          }else{
            let playerPath = `players.${playerId}`;
            return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 }});
          }

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
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing", 'game.currentRound':0}});
          let room = RoomsCollection.findOne({token: roomToken});
          switch(room.gamemode){
            case "parlament":
              Meteor.call('room.game.randomTopic',{roomToken: roomToken});

              //Wenn die Spieler nicht mit jedem Topic gewechselt werden, wird hier erstmals das Team zufallsgeneriert
              if(!room.settings.mixTeams){
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
          RoomsCollection.update({ token: roomToken }, { $set: { state: "lobby", game:{leaders:[], lastLeaders: [], propabilities: room.game.propabilities}}});
          room = RoomsCollection.findOne({token: roomToken});
          console.log(room.game.propabilities) 
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
          shuffle.sort(() => {
            return .5 - Math.random();
          });

          if(room.settings.mixTeams){
            shuffle.forEach((player,index) => {
              let team = "pro";
              if(index < shuffle.length/2)
                team = "con";
              
              let playerTeamPath = `players.${player.id}.team`;
              RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
            });
          }else{ //Ansonsten nur Teams wechseln
            shuffle.forEach((player,index) => {
              let team = "pro";
              if(player.team == "pro"){
                team = "con";
              }
              
              let playerTeamPath = `players.${player.id}.team`;
              RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
            });
          }

          Meteor.call('chats.clear',{roomToken});
          room = RoomsCollection.findOne({token: roomToken});
          let topic = Topics[Math.floor(Math.random() * Topics.length)];
          let mode = randomMode(room.game.propabilities);
          var shuffle = Object.values(room.players);
          shuffle.sort(() => {
            return .5 - Math.random();
          })
          let lastLeaders = room.game.lastLeaders || [];
          let leaders = [];
          let image = "";
          let leaderPro;
          let leaderCon;

          switch(mode.name){
            case "Partner-Diskussion":
              //Findet zwei neue Leader
              leaders = [shuffle.find(p => (p.team === 'pro')).id,shuffle.find(p => (p.team === 'con')).id];
              //Sucht noch zwei zusätzliche Leader die nicht den ersten entsprechen. Wenn das nicht geht nimmt er einfach keine.
              leaderPro = shuffle.find(p => (p.team === 'pro' && p.id != leaders[0])) || {id:""};
              leaderCon = shuffle.find(p => (p.team === 'con' && p.id != leaders[1])) || {id:""}
              leaders.push(leaderPro.id, leaderCon.id);
              break;
            
            case "Bildervortrag":
              image = randomImage();

            case "Einzel-Diskussion":
              leaderPro = shuffle.find(p => (p.team === 'pro' && !lastLeaders.includes(p.id))) || shuffle.find(p => (p.team === 'pro'))
              leaderCon = shuffle.find(p => (p.team === 'con' && !lastLeaders.includes(p.id))) || shuffle.find(p => (p.team === 'con'));
              leaders = [
                leaderPro.id,
                leaderCon.id
              ];
              
              room.settings.rounds == 0 && lastLeaders.push(leaders[0],leaders[1]);
              break;
          }
          console.log(room.game.currentRound);
          let rounds = ++room.game.currentRound; 
          console.log(rounds)
          if((!room.settings.rounds && ((lastLeaders.length == Object.keys(room.players).length) || 
            (Object.keys(room.players).length % 2 != 0 && Object.keys(room.players).length-1 == lastLeaders.length))) 
            || rounds == room.settings.rounds ) {
            RoomsCollection.update({ token: roomToken }, { $set: { state:"endOfRound"}});
          }
          RoomsCollection.update({ token: roomToken }, { $set: { game:{timer:{minutes:6,seconds:0},topic:topic,leaders:leaders, lastLeaders:lastLeaders, mode: mode, image:image, currentRound: rounds, propabilities: room.game.propabilities}}})

        }
    });
}