var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var illustratorSchema = new Schema({
  name: String
});

module.exports = mongoose.model('Illustrator', illustratorSchema);
