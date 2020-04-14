export const ChatsCollection = new Mongo.Collection('chats');

if(Meteor.isServer){

    Meteor.methods({
        'chats.message.send'({roomToken,playerId,message,team}) {
            console.log(roomToken,playerId,message,team);
            ChatsCollection.insert({playerId:playerId,roomToken:roomToken,sent:new Date(),text:message, team: team});
        },

        'chats.clear'({roomToken}) {
            ChatsCollection.remove({roomToken: roomToken});
        }
    })
}
