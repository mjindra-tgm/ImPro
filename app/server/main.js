import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '/imports/api/rooms';
import { ChatsCollection } from '/imports/api/chats';
import { ImagesCollection } from '/imports/api/images';

const fs = require('fs');
const path = require('path');

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return "data:image/jpeg;base64," + new Buffer(bitmap).toString('base64');
}

function callback(params) {
    /*
        files.forEach((file) => {
            var bitmap = base64_encode(imageFolder+"/"+file);
            images.push({base:bitmap,id:"image"})
        });
    */
   images = {base:"",id:"image"};
    ImagesCollection.insert(images);
}

Meteor.startup(function(){
    Meteor.publish('rooms', function roomsPublication() {
        return RoomsCollection.find();
      });

    Meteor.publish('chats', function chatsPublication() {
        return ChatsCollection.find();
    });

    Meteor.publish('images', function imagesPublication() {
        return ImagesCollection.find();
    });

    /*
    ChatsCollection.remove({})
    RoomsCollection.remove({})
      */
    ImagesCollection.remove({})
    let imageFolder = path.join(__meteor_bootstrap__.serverDir, "../web.browser/app/randomimages");
    images = [];
    var files = fs.readdirSync(imageFolder, callback);
    files.forEach((file) => {
        ImagesCollection.insert({base: '/randomimages/' + file});
    });
});
