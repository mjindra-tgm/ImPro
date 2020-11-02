export const ImagesCollection = new Mongo.Collection('images');


    Meteor.methods({
        'images.randomImage'() {
            let images = ImagesCollection.find({}).fetch();
            let image = images[Math.floor(Math.random() * images.length)];
            return image;
        }
    })
