import { customAlphabet } from "nanoid";
import { ImagesCollection } from "./images";
import { DiscussionMode } from "./Modes";
import { Tasks } from "./Tasks";
import { Command, Commands, Role, stories, Story, Topic, topics } from "./Topics";
import { DiscussionVoting } from "./VoteSystem";
const customToken = customAlphabet("1234567890abcdef", 4);

export const RoomsCollection: Mongo.Collection<RoomData> = new Mongo.Collection("rooms");

export interface RoomData {
    players: {
        [key: string]: Player;
    };
    gamemode: GameMode;
    game: Game;
    settings: GameModeSettings;
    token: string;
    state: RoomState;
    commandInterval?: number;
}

export type RoomState = "waiting" | "lobby" | "playing" | "voting" | "ranking" | "lastRanking";

export type GameMode = "theater" | "discussion";

export type GameModeSettings = {
    mixTeams: boolean;
    rounds: number;
};

export type Player = {
    id: string;
    name: string;
    host: boolean;
    roundsPlayed: number;
    vote?: number;
    team?: Team;
    task?: string;
    points: Points;
    role?: Role;
};

export type Team = "pro" | "con";

export type Game = {
    timer?: Timer;
    mode?: DiscussionMode;
    currentRound?: number;
    leaders?: Leaders;
    lastLeaders?: Leaders;
    image?: string;
    topic?: Topic;
    story?: Story;
    propabilities?: Object;
    points?: GamePoints;
    finalPoints?: Object;
};

export type Timer = {
    startTimer?: boolean;
    stopTimer?: boolean;
    minutes: number;
    seconds: number;
};

export type Points = {
    [key: string]: number;
};

export type GamePoints = {
    lock?: boolean;
    [key: string]: Points | boolean;
};

export type Leaders = [leaderPro?: string, leaderCon?: string];

function randomMode(propabilities) {
    var modesFactor = [];
    for (var elem of propabilities) {
        for (var i = 0; i < elem.randomFactor; i++) {
            modesFactor[modesFactor.length] = elem;
        }
    }
    const mode = modesFactor[Math.floor(Math.random() * modesFactor.length)];
    return mode;
}

function randomTask() {
    return Tasks[Math.floor(Math.random() * Tasks.length)];
}

function randomImage() {
    var images = ImagesCollection.find({}).fetch();
    var image = images[Math.floor(Math.random() * images.length)];
    return image.base;
}

function doCommandInterval(roomToken, story) {
    const room = RoomsCollection.findOne({ token: roomToken });
    var intervalDelay = 300000;
    var randomCommands = Commands.concat();
    randomCommands.sort(() => {
        return 0.5 - Math.random();
    });
    var commands = story.commands;
    var players = Object.values(room.players);
    console.log("before findCommandIntervall ");
    var interval = Meteor.setInterval(() => {
        console.log("findCommandIntervall ");
        let player: Player = players[Math.floor(Math.random() * players.length)];
        let commandObject: Command;
        let command: string;
        if (commands && commands.length) {
            commandObject = commands.pop();
            player = players.find((p) => {
                return p.role.name == commands.for;
            });
            command = commandObject.desc;
        } else if (randomCommands && randomCommands.length) {
            command = randomCommands.pop();
        }
        var playerCommandPath = `players.${player.id}.command`;

        if (command !== "") RoomsCollection.update({ token: roomToken }, { $set: { [playerCommandPath]: command } });
    }, intervalDelay);
    RoomsCollection.update({ token: roomToken }, { $set: { commandinterval: interval } });
}

if (Meteor.isServer) {
    Meteor.methods({
        //Raum erstellen
        "rooms.create"(profile, callback) {
            var playerId: string = profile.playerId;
            var player = {
                id: playerId,
                name: profile.name,
                team: undefined,
                state: "waiting",
                host: true,
                roundsPlayed: 0,
                points: {},
            };
            var players = {
                [playerId]: player,
            };
            var token = customToken();
            RoomsCollection.insert({
                token: token,
                state: "lobby",
                players: players,
                game: { propabilities: profile.propabilities },
                gamemode: profile.gamemode,
                settings: profile.settings,
            });
            return token;
        },

        "room.game.changeSettings"({ roomToken, settingsList }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            const settings = room.settings;
            for (const setting in settingsList) {
                settings[setting] = settingsList[setting];
            }
            RoomsCollection.update({ token: roomToken }, { $set: { settings: settings } });
            room = RoomsCollection.findOne({ token: roomToken });
        },

        //Raum verlassen
        "room.leave"({ roomToken, playerId }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            if (Object.keys(room.players).length === 1) {
                return RoomsCollection.remove({ token: roomToken });
            } else {
                var playerPath = `players.${playerId}`;
                if (room.players[playerId].host) {
                    var newHostId = Object.keys(room.players).find((id) => {
                        return id !== playerId;
                    });
                    var newHostPath = `players.${newHostId}.host`;
                    RoomsCollection.update({ token: roomToken }, { $set: { [newHostPath]: true } });
                }
                return RoomsCollection.update({ token: roomToken }, { $unset: { [playerPath]: 1 } });
            }
        },

        //Raum betreten
        "room.join"({ roomToken, playerId, name }) {
            var player = {
                id: playerId,
                roundsPlayed: 0,
                name: name,
                team: undefined,
                state: "waiting",
                host: false,
                points: {},
            };
            var playerPath = `players.${playerId}`;
            return RoomsCollection.update({ token: roomToken }, { $set: { [playerPath]: player } });
        },

        //Spiel starten
        "room.game.start"({ roomToken }) {
            RoomsCollection.update({ token: roomToken }, { $set: { state: "playing", "game.currentRound": 0 } });
            var room = RoomsCollection.findOne({ token: roomToken });
            switch (room.gamemode) {
                case "discussion":
                    //Wenn die Spieler nicht mit jedem Topic gewechselt werden, wird hier erstmals das Team zufallsgeneriert
                    if (!room.settings.mixTeams) {
                        var shuffle = Object.values(room.players);
                        shuffle.sort(() => {
                            return 0.5 - Math.random();
                        });
                        shuffle.forEach((player, index) => {
                            var team: Team = "pro";
                            if (index < shuffle.length / 2) team = "con";

                            const playerTeamPath = `players.${player.id}.team`;
                            RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team } });
                        });
                    }

                    var points = { pro: {}, con: {} };
                    for (const votePoint of DiscussionVoting) {
                        points.pro[votePoint.name] = 0;
                        points.con[votePoint.name] = 0;
                    }

                    RoomsCollection.update({ token: roomToken }, { $set: { "game.points": points } });
                    var room = RoomsCollection.findOne({ token: roomToken });
                    Meteor.call("room.game.randomTopic", { roomToken: roomToken });

                    break;

                case "theater":
                    Meteor.call("room.game.randomStory", { roomToken: roomToken });
                    break;
            }
        },

        //Spiel beenden
        "room.game.end"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            Object.values(room.players).forEach((player, index) => {
                const valuesToSet = {
                    [`players.${player.id}.team`]: "",
                    [`players.${player.id}.roundsPlayed`]: 0,
                };
                RoomsCollection.update({ token: roomToken }, { $set: valuesToSet });
            });
            RoomsCollection.update(
                { token: roomToken },
                { $set: { state: "lobby", game: { leaders: [], lastLeaders: [], propabilities: room.game.propabilities } } },
            );
            room = RoomsCollection.findOne({ token: roomToken });
            Meteor.call("chats.clear", { roomToken });
            Meteor.call("room.resetPlayersGame", { roomToken });
        },

        //Uhr starten
        "room.game.startWatch"({ roomToken, seconds, callback }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            RoomsCollection.update({ token: roomToken }, { $set: { "game.timer.seconds": seconds, "game.timer.startTimer": true } });
            Meteor.setTimeout(() => {
                RoomsCollection.update({ token: roomToken }, { $set: { "game.timer.startTimer": false } });
            }, 50);
        },

        //Uhr stoppen
        "room.game.stopWatch"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            RoomsCollection.update({ token: roomToken }, { $set: { "game.timer.stopTimer": true } });
            Meteor.setTimeout(() => {
                RoomsCollection.update({ token: roomToken }, { $set: { "game.timer.stopTimer": false } });
            }, 50);
        },

        //Zufällige Story(im Theater Modus)
        "room.game.randomStory"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            Meteor.clearInterval(room.commandInterval);
            var story = stories[Math.floor(Math.random() * stories.length)];
            var roles = story.roles;

            var shuffle = Object.values(room.players);
            shuffle.sort(() => {
                return 0.5 - Math.random();
            });
            shuffle.forEach((player, index) => {
                var role = {};
                if (roles.necessary.length) {
                    role = roles.necessary.pop();
                } else {
                    role = roles.optional[Math.floor(Math.random() * roles.optional.length)];
                }
                var playerRolePath = `players.${player.id}.role`;
                RoomsCollection.update({ token: roomToken }, { $set: { [playerRolePath]: role } });
                var playerTeamPath = `players.${player.id}.team`;
                RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: "theater" } });
            });
            RoomsCollection.update({ token: roomToken }, { $set: { game: { timer: { minutes: 10, seconds: 0 }, story: story } } });
            doCommandInterval(roomToken, story);
        },

        //Zufälliges Thema(im Parlament Modus)
        "room.game.randomTopic"({ roomToken }) {
            Meteor.call("room.resetPlayersRound", { roomToken });
            var room = RoomsCollection.findOne({ token: roomToken });
            var players = Object.values(room.players);

            if (room.settings.mixTeams) {
                players.forEach((player, index) => {
                    var team: Team = "pro";
                    if (index < players.length / 2) team = "con";

                    var playerTeamPath = `players.${player.id}.team`;
                    RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team } });
                });
            } else {
                //Ansonsten nur Teams wechseln
                players.forEach((player, index) => {
                    var team: Team = "pro";
                    if (player.team == "pro") {
                        team = "con";
                    }

                    var playerTeamPath = `players.${player.id}.team`;
                    RoomsCollection.update({ token: roomToken }, { $set: { [playerTeamPath]: team } });
                });
            }
            room = RoomsCollection.findOne({ token: roomToken });

            players = Object.values(room.players);
            Meteor.call("chats.clear", { roomToken });
            var topic = topics[Math.floor(Math.random() * topics.length)];
            var mode = randomMode(room.game.propabilities);

            players.sort(() => {
                return 0.5 - Math.random();
            });

            var lastLeaders = room.game.lastLeaders || [];
            var leaders: Leaders = [];
            var image = "";
            var leaderPro;
            var leaderCon;
            var proTask = undefined;
            var conTask = undefined;

            switch (mode.name) {
                case "Partner-Diskussion":
                    //Findet zwei neue Leader
                    leaders = [players.find((p) => p.team === "pro").id, players.find((p) => p.team === "con").id];
                    //Sucht noch zwei zusätzliche Leader die nicht den ersten entsprechen. Wenn das nicht geht nimmt er einfach keine.
                    leaderPro = players.find((p) => p.team === "pro" && p.id != leaders[0]);
                    leaderCon = players.find((p) => p.team === "con" && p.id != leaders[1]);
                    leaderPro && leaderCon && leaders.push(leaderPro.id, leaderCon.id);
                    break;

                case "Bildervortrag":
                    image = randomImage();

                case "Einzel-Diskussion":
                    leaderPro = players.find((p) => p.team === "pro" && !lastLeaders.includes(p.id)) || players.find((p) => p.team === "pro");
                    leaderCon = players.find((p) => p.team === "con" && !lastLeaders.includes(p.id)) || players.find((p) => p.team === "con");
                    leaders = [leaderPro.id, leaderCon.id];
                    proTask = randomTask();
                    conTask = randomTask();

                    if(room.settings.rounds == 0){
                        lastLeaders.push(leaders[0], leaders[1]);
                    }
                    break;
            }

            var rounds = room.game.currentRound + 1;

            RoomsCollection.update(
                { token: roomToken },
                {
                    $set: {
                        game: {
                            timer: { minutes: 6, seconds: 0 },
                            topic: topic,
                            leaders: leaders,
                            lastLeaders: lastLeaders,
                            mode: mode,
                            image: image,
                            currentRound: rounds,
                            propabilities: room.game.propabilities,
                            finalPoints: room.game.finalPoints,
                        },
                        state: "playing",
                    },
                },
            );

            leaderPro &&
                leaderCon &&
                RoomsCollection.update(
                    { token: roomToken },
                    { $set: { [`players.${leaderPro.id}.task`]: proTask, [`players.${leaderCon.id}.task`]: conTask } },
                );
        },

        //Nächstes zufälliges Bild laden
        "room.game.nextImage"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            var image = randomImage();
            RoomsCollection.update({ token: roomToken }, { $set: { "game.image": image } });
        },

        "room.game.startVoting"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            var points = { pro: {}, con: {} };
            var players = Object.values(room.players);
            for (const votePoint of DiscussionVoting) {
                points.pro[votePoint.name] = 0;
                points.con[votePoint.name] = 0;
            }

            const setValues = {
                state: "voting",
                "game.points": points,
            };
            for (const leader of room.game.leaders) {
                setValues["players." + leader + ".roundsPlayed"] = room.players[leader].roundsPlayed + 1;
            }
            RoomsCollection.update({ token: roomToken }, { $set: setValues });
        },

        "room.game.endVoting"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            const lastLeaders = room.game.lastLeaders;
            //TODO Finale Voting (vote der Player zusammenzählen, Punkte zusammenzählen, BestPlayerPicks)

            // Überprüft zuerst, ob Runden beim Start eingestellt wurden, wenn das der Fall ist, springt er zur letzten Überprüfung(ob die Anzahl der Runden schon gespielt wurde)
            // Ansonsten wird gecheckt, ob die Anzahl der bisherigen Diskussionsleiter der Anzahl der Spieler entspricht (damit jeder einmal drankommt)
            // Ansonsten überprüft er ob die Zahl ungerade ist und die Anzahl der bisherigen Leiter der Anzahl der Spieler -1 entspricht.
            if (
                (!room.settings.rounds &&
                    (lastLeaders.length == Object.keys(room.players).length ||
                        (Object.keys(room.players).length % 2 != 0 && Object.keys(room.players).length - 1 == lastLeaders.length))) ||
                room.game.currentRound == room.settings.rounds
            ) {
                RoomsCollection.update({ token: roomToken }, { $set: { state: "lastRanking" } });
            } else {
                RoomsCollection.update({ token: roomToken }, { $set: { state: "ranking" } });
            }
        },

        "room.game.vote"({ roomToken, playerId, values }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            var voteModes = ["pro", "con"];
            var vote = room.players[playerId].vote;
            var team = voteModes[vote];
            var currentPoints = room.game.points[team];
            if (room.game.points.lock) {
                console.log("vote is locked");
                setTimeout(Meteor.call("room.game.vote", { roomToken, playerId, values }), 500);
            } else {
                //Zugriff auf Punkte sperren um race conditions zu vermeiden
                RoomsCollection.update({ token: roomToken }, { $set: { "game.points.lock": true } });
                var name = "";
                for (const type in DiscussionVoting) {
                    name = DiscussionVoting[type].name;
                    if (values[name]) {
                        currentPoints[name] += values[name];
                    } else {
                        currentPoints[name] += 3;
                    }
                }

                if (room.game.leaders.length > 0) {
                    var players = Object.values(room.players);
                    var leader = players.find((p) => p.team === team && room.game.leaders.includes(p.id));
                    if (leader) {
                        var leaderPoints = leader.points;
                        for (const type in DiscussionVoting) {
                            name = DiscussionVoting[type].name;
                            if (values[name]) {
                                leaderPoints[name] = leaderPoints[name] ? leaderPoints[name] + values[name] : values[name];
                            } else {
                                leaderPoints[name] = leaderPoints[name] ? leaderPoints[name] + 3 : 3;
                            }
                        }
                        RoomsCollection.update({ token: roomToken }, { $set: { [`players.${leader.id}.points`]: leaderPoints } });
                    }
                }

                RoomsCollection.update(
                    { token: roomToken },
                    { $set: { [`game.points.${team}`]: currentPoints, [`players.${playerId}.vote`]: ++vote, "game.points.lock": false } },
                );

                var voteCount = 1;
                for (var player of Object.values(room.players)) {
                    voteCount += player.vote;
                }
                if (voteCount == Object.keys(room.players).length * 2) {
                    Meteor.call("room.game.endVoting", { roomToken: roomToken });
                }
            }
        },

        "room.resetPlayersRound"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            const players = room.players;
            for (const player in players) {
                players[player]["task"] = undefined;
                players[player]["vote"] = 0;
            }
            RoomsCollection.update({ token: roomToken }, { $set: { players: players } });
        },

        "room.resetPlayersGame"({ roomToken }) {
            var room = RoomsCollection.findOne({ token: roomToken });
            const players = room.players;
            for (const player in players) {
                players[player]["points"] = {};
            }
            RoomsCollection.update({ token: roomToken }, { $set: { players: players } });
        },
    });
}
