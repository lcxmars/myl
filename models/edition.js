var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var editionSchema = new Schema({
  name: String
});

module.exports = mongoose.model('Edition', editionSchema);
