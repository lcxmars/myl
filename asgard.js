var mongoose = require('mongoose');

var Edition = require('./models/edition');
var Illustrator = require('./models/illustrator');
var Card = require('./models/card');

console.log('Connecting DB...');

mongoose.connect('mongodb://test:123@jello.modulusmongo.net:27017/oqix5yJu', function (err) {
  if (err) throw err;
  console.log('Done');
  console.log('Creating edition...');

  Edition.create({name: 'Asgard'}, function (err, edition) {
    if (err) throw err;
    console.log('Done');
    console.log('Creating illustrator...');

    Illustrator.create({name: 'Nombre de prueba'}, function (err, illustrator) {
      if (err) throw err;
      console.log('Done');
      console.log('Creating cards...');

      Card.create([
        {},
        {},
      ], function (err, cards) {
        if (err) throw err;
        console.log('Done');
      });
    });
  });
});
