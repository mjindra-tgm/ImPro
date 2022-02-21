import { Mongo } from 'meteor/mongo'
import { nanoid,  customAlphabet, random} from 'nanoid'
const customToken = customAlphabet('1234567890abcdef', 4)
import { Meteor } from 'meteor/meteor'
import {Topics, Stories, Commands} from './Topics'
import {Tasks} from './Tasks'
import {ImagesCollection} from './images'
import {DiscussionVoting} from './VoteSystem';

export const RoomsCollection = new Mongo.Collection('rooms');

function randomMode(propabilities){
  var modesFactor = [];
  for(var elem of propabilities){
    for(var i = 0; i < elem.randomFactor; i++){
      modesFactor[modesFactor.length] = elem;
    }
  }
  mode = modesFactor[Math.floor(Math.random() * modesFactor.length)];
  return mode;
}

function randomTask(){
  return Tasks[Math.floor(Math.random() * Tasks.length)];
}

function randomImage() {
  var images = ImagesCollection.find({}).fetch();
  var image = images[Math.floor(Math.random() * images.length)];
  return image.base;
}

function doCommandInterval(roomToken, story) {
  room = RoomsCollection.findOne({token: roomToken});
  var commandInterval = 300000;
  var randomCommands = Commands.concat();
  randomCommands.sort(() => {
    return .5 - Math.random();
  });
  var commands = story.commands;
  var players = Object.values(room.players);
  var interval = Meteor.setInterval(() => {
    var player = players[Math.floor(Math.random() * players.length)];
    var command = "";
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
    var playerCommandPath = `players.${player.id}.command`;

    if(command != "")
      RoomsCollection.update({ token: roomToken }, { $set: { [playerCommandPath]: command }} );
  }, commandInterval);
  RoomsCollection.update({ token: roomToken }, { $set: { 'commandinterval': interval }} );
}

if(Meteor.isServer){
    Meteor.methods({

        //Raum erstellen
        'rooms.create'(profile, callback) {
            var playerId = profile.playerId;
            var player = {
                id: playerId,
                name: profile.name,
                team: null,
                state: "waiting",
                host: true
            };
            var players = {
              [playerId]: player
            };
            var token = customToken();
            RoomsCollection.insert({token: token, state: "lobby", players: players, game:{propabilities: profile.propabilities}, gamemode: profile.gamemode ,settings: profile.settings});
            return token;
        },

        'room.game.changeSettings'({roomToken,settingsList}){
          var room = RoomsCollection.findOne({token: roomToken});
          settings = room.settings;
          for(setting in settingsList){
            settings[setting] = settingsList[setting];
          }
          RoomsCollection.update({ token: roomToken }, { $set: { settings: settings }});
          room = RoomsCollection.findOne({token: roomToken});
        },

        //Raum verlassen
        'room.leave'({roomToken, playerId}) {
          var room = RoomsCollection.findOne({token: roomToken});
          if(Object.keys(room.players).length === 1){
            return RoomsCollection.remove({ token: roomToken });
          }else{
            var playerPath = `players.${playerId}`;
            if(room.players[playerId].host){
              console.log(room.players)
              var newHostId = Object.keys(room.players).find((id)=>{
                return id !== playerId;
              });
              var newHostPath = `players.${newHostId}.host`;
              RoomsCollection.update({ token: roomToken }, { $set: { [newHostPath]: true}});
            }
            return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 }});
          }

        },

        //Raum betreten
        'room.join'({roomToken, playerId, name}) {
          var player = {
              id: playerId,
              name: name,
              team: null,
              state: "waiting",
              host: false
          };
          var playerPath = `players.${playerId}`;
          return RoomsCollection.update({ token: roomToken }, { $set: { [playerPath]: player }} );
        },

        //Spiel starten
        'room.game.start'({roomToken}) {
          RoomsCollection.update({ token: roomToken }, { $set: { state: "playing", 'game.currentRound':0}});
          var room = RoomsCollection.findOne({token: roomToken});
          switch(room.gamemode){
            case "discussion":
              //Wenn die Spieler nicht mit jedem Topic gewechselt werden, wird hier erstmals das Team zufallsgeneriert
              if(!room.settings.mixTeams){
                var shuffle = Object.values(room.players);
                shuffle.sort(() => {
                  return .5 - Math.random();
                })
                shuffle.forEach((player,index) => {
                  var team = "pro";
                  if(index < shuffle.length/2)
                    team = "con";
                  
                  var playerTeamPath = `players.${player.id}.team`;
                  RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
                });
              }

              var points = {pro:{},con:{}};
              for(votePoint of DiscussionVoting){
                points.pro[votePoint.name] = 0;
                points.con[votePoint.name] = 0;
              }

              RoomsCollection.update({ token: roomToken }, { $set: {'game.points':points},});
              var room = RoomsCollection.findOne({token: roomToken});
              console.log(room.game)
              Meteor.call('room.game.randomTopic',{roomToken: roomToken});

              break;

            case "theater":
              Meteor.call('room.game.randomStory',{roomToken: roomToken});
              break;
          } 
        },

        //Spiel beenden
        'room.game.end'({roomToken}) {
          var room = RoomsCollection.findOne({token: roomToken});
          Object.values(room.players).forEach((player,index) => {         
            var playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: ""}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { state: "lobby" ,game:{leaders:[], lastLeaders: [], propabilities: room.game.propabilities}}});
          room = RoomsCollection.findOne({token: roomToken});
          Meteor.call('chats.clear',{roomToken});
          Meteor.call('room.resetPlayersGame',{roomToken});
        },

        //Uhr starten
        'room.game.startWatch'({roomToken, seconds,callback}){
          var room = RoomsCollection.findOne({token: roomToken});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.seconds':seconds,'game.timer.startTimer':true}});
          Meteor.setTimeout(()=>{
            RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.startTimer':false}});
          },50);
        },

        //Uhr stoppen
        'room.game.stopWatch'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.stopTimer':true}});
          Meteor.setTimeout(()=>{
            RoomsCollection.update({ token: roomToken }, { $set: {'game.timer.stopTimer':false}});
          },50);
        },

        //Zufällige Story(im Theater Modus)
        'room.game.randomStory'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          Meteor.clearInterval(room.commandInterval)
          var story = Stories[Math.floor(Math.random() * Stories.length)];
          var roles = story.roles;

          var shuffle = Object.values(room.players);
          shuffle.sort(() => {
            return .5 - Math.random();
          })
          shuffle.forEach((player,index) => {
            var role = {};
            if(roles.necessary.length){
              role = roles.necessary.pop();
            }else{
              role = roles.optional[Math.floor(Math.random() * roles.optional.length)];
            }    
            var playerRolePath = `players.${player.id}.role`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerRolePath]: role}} );
            var playerTeamPath = `players.${player.id}.team`;
            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: 'theater'}} );
          });
          RoomsCollection.update({ token: roomToken }, { $set: { game:{timer:{minutes:10,seconds:0}, story:story}}});
          doCommandInterval(roomToken, story);
        },

        //Zufälliges Thema(im Parlament Modus)
        'room.game.randomTopic'({roomToken}){
          Meteor.call('room.resetPlayersRound',{roomToken});
          var room = RoomsCollection.findOne({token: roomToken});
          var shuffle = Object.values(room.players);

          //Spieler durchmischen
          shuffle.sort(() => {
            return .5 - Math.random();
          });

          if(room.settings.mixTeams){
            shuffle.forEach((player,index) => {
              var team = "pro";
              if(index < shuffle.length/2)
                team = "con";
              
              var playerTeamPath = `players.${player.id}.team`;
              RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
            });
          }else{ //Ansonsten nur Teams wechseln
            shuffle.forEach((player,index) => {
              var team = "pro";
              if(player.team == "pro"){
                team = "con";
              }
              
              var playerTeamPath = `players.${player.id}.team`;
              RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team}} );
            });
          }
          room = RoomsCollection.findOne({token: roomToken});
          
          shuffle = Object.values(room.players);

          //Spieler durchmischen
          shuffle.sort(() => {
            return .5 - Math.random();
          });


          Meteor.call('chats.clear',{roomToken});
          var topic = Topics[Math.floor(Math.random() * Topics.length)];
          var mode = randomMode(room.game.propabilities);
          shuffle.sort(() => {
            return .5 - Math.random();
          })

          var lastLeaders = room.game.lastLeaders || [];
          var leaders = [];
          var image = "";
          var leaderPro;
          var leaderCon;
          var proTask = null;
          var conTask = null;

          switch(mode.name){
            case "Partner-Diskussion":
              //Findet zwei neue Leader
              leaders = [shuffle.find(p => (p.team === 'pro')).id,shuffle.find(p => (p.team === 'con')).id];
              //Sucht noch zwei zusätzliche Leader die nicht den ersten entsprechen. Wenn das nicht geht nimmt er einfach keine.
              leaderPro = shuffle.find(p => (p.team === 'pro' && p.id != leaders[0])) || null;
              leaderCon = shuffle.find(p => (p.team === 'con' && p.id != leaders[1])) || null;
              leaderPro && leaderCon && leaders.push(leaderPro.id, leaderCon.id);
              break;
            
            case "Bildervortrag":
              image = randomImage();

            case "Einzel-Diskussion":
              leaderPro = shuffle.find(p => (p.team === 'pro' && !lastLeaders.includes(p.id))) || shuffle.find(p => (p.team === 'pro'));
              leaderCon = shuffle.find(p => (p.team === 'con' && !lastLeaders.includes(p.id))) || shuffle.find(p => (p.team === 'con'));
              leaders = [
                leaderPro.id,
                leaderCon.id
              ];
              proTask = randomTask();
              conTask = randomTask();
         
              room.settings.rounds == 0 && lastLeaders.push(leaders[0],leaders[1]);
              break;
          }

          var rounds = room.game.currentRound + 1; 

          RoomsCollection.update({ token: roomToken }, { $set: 
            {
              game:{
                timer: {minutes:6,seconds:0},
                topic:topic,
                leaders:leaders, 
                lastLeaders:lastLeaders, 
                mode: mode, 
                image:image, 
                currentRound: rounds, 
                propabilities: room.game.propabilities,
                finalPoints: room.game.finalPoints
              },
              state: "playing"
            }});
              
          leaderPro && leaderCon && RoomsCollection.update({ token: roomToken }, { $set: { [`players.${leaderPro.id}.task`]: proTask, [`players.${leaderCon.id}.task`]: conTask}});
        },

        //Nächstes zufälliges Bild laden
        'room.game.nextImage'({roomToken}) {
          var room = RoomsCollection.findOne({token: roomToken});
          var image = randomImage();
          RoomsCollection.update({ token: roomToken }, { $set: {'game.image':image}})
        },

        'room.game.startVoting'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          var points = {pro:{},con:{}};
          var players = Object.values(room.players);
          for(votePoint of DiscussionVoting){
            points.pro[votePoint.name] = 0;
            points.con[votePoint.name] = 0;
          }

          if(room.game.leaders && room.game.leaders.length == 2){
            var leaderPro = players.find(p => (p.team === 'pro' && room.game.leaders.includes(p.id)));
            var leaderCon = players.find(p => (p.team === 'con' && room.game.leaders.includes(p.id)));
          }
          RoomsCollection.update({ token: roomToken }, { $set: {state:"voting", 'game.points': points}});
        },

        'room.game.endVoting'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          lastLeaders = room.game.lastLeaders;
          console.log(room.game.points)
          console.log(room.game.finalPoints)
          //TODO Finale Voting (vote der Player zusammenzählen, Punkte zusammenzählen, BestPlayerPicks)
          
          // Überprüft zuerst, ob Runden beim Start eingestellt wurden, wenn das der Fall ist, springt er zur letzten Überprüfung(ob die Anzahl der Runden schon gespielt wurde)
          // Ansonsten wird gecheckt, ob die Anzahl der bisherigen Diskussionsleiter der Anzahl der Spieler entspricht (damit jeder einmal drankommt)
          // Ansonsten überprüft er ob die Zahl ungerade ist und die Anzahl der bisherigen Leiter der Anzahl der Spieler -1 entspricht.
          if(  (!room.settings.rounds && 
            ( (lastLeaders.length == Object.keys(room.players).length) || (Object.keys(room.players).length % 2 != 0 && Object.keys(room.players).length-1 == lastLeaders.length) )  ) 
            || room.game.currentRound == room.settings.rounds ) {

            RoomsCollection.update({ token: roomToken }, { $set: { state:"lastRanking"}});

          }else{
            RoomsCollection.update({ token: roomToken }, { $set: {state:"ranking"}})
          }
        },


        'room.game.vote'({roomToken, playerId, values}){
          var room = RoomsCollection.findOne({token: roomToken});
          var voteModes = ["pro","con"];      
          var vote = room.players[playerId].vote;
          var team = voteModes[vote];
          var currentPoints = room.game.points[team];
          if(false && room.game.points.lock){
            console.log("vote is locked");
            setTimeout(Meteor.call('room.game.vote',{roomToken,playerId,values}),500);
          }else{
            //Zugriff auf Punkte sperren um race conditions zu vermeiden
            RoomsCollection.update({ token: roomToken }, { $set: { 'game.points.lock' : true}});
              var name = "";
              for(type in DiscussionVoting){
                  name = DiscussionVoting[type].name
                  if(values[name]){
                    currentPoints[name] += values[name];
                  }else{
                    currentPoints[name] += 3;
                  }
              }

              if(room.game.leaders.length == 2){
                var players = Object.values(room.players);
                var leader = players.find(p => (p.team === team && room.game.leaders.includes(p.id))) || {points:{}};
                var leaderPoints = leader.points || {};
                for(type in DiscussionVoting){
                    name = DiscussionVoting[type].name
                    if(values[name])
                      leaderPoints[name] = leaderPoints[name] ? leaderPoints[name] + values[name] : values[name];
                    else
                      leaderPoints[name] = leaderPoints[name] ? leaderPoints[name] + 3 : 3;
                }
                RoomsCollection.update({ token: roomToken }, { $set: { [`players.${leader.id}.points`]: leaderPoints}});
              }

            RoomsCollection.update({ token: roomToken }, { $set: { [`game.points.${team}`]: currentPoints, [`players.${playerId}.vote`]: ++vote, 'game.points.lock' : false}});

            var voteCount = 1;
            for(var player of Object.values(room.players)){
              voteCount += player.vote;
            }
            if(voteCount == Object.keys(room.players).length * 2){
              Meteor.call('room.game.endVoting',{roomToken: roomToken});
            }
          }

        },


        'room.resetPlayersRound'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          players = room.players;
          for(player in players){
            players[player]['task'] = null;
            players[player]["vote"] = 0;
          }
          RoomsCollection.update({ token: roomToken }, { $set: {players: players}});
        },

        'room.resetPlayersGame'({roomToken}){
          var room = RoomsCollection.findOne({token: roomToken});
          players = room.players;
          for(player in players){
            players[player]['points'] = null;
          }
          RoomsCollection.update({ token: roomToken }, { $set: {players: players}});
        }

    });
}