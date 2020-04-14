import { Meteor } from 'meteor/meteor';
import { RoomsCollection } from '/imports/api/rooms';
import { ChatsCollection } from '/imports/api/chats';
import { ImagesCollection } from '/imports/api/images';

const fs = require('fs');


Meteor.startup(function(){
    function base64_encode(file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return "data:image/jpeg;base64," + new Buffer(bitmap).toString('base64');
    }
    
    function callback(params) {
        console.log("test");
        /*
            files.forEach((file) => {
                var bitmap = base64_encode(imageFolder+"/"+file);
                images.push({base:bitmap,id:"image"})
            });
        */
       images = {base:"",id:"image"};
        console.log(ImagesCollection.insert(images));
    }
    /*
    ChatsCollection.remove({})
    RoomsCollection.remove({})
      */
    ImagesCollection.remove({})
    let imageFolder = '../../../../../images'
    images = [];
    var files = fs.readdirSync(imageFolder, callback);
    files.forEach((file) => {
        var bitmap = base64_encode(imageFolder+"/"+file);
        ImagesCollection.insert({base:bitmap});
    });
});