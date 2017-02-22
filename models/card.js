var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var cardSchema = new Schema({
  edition: {
    type: Schema.Types.ObjectId,
    ref: 'Edition'
  },
  type: String,
  strength: Number,
  cost: Number,
  race: String,
  name: String,
  legend: String,
  ability: String,
  frequency: String,
  illustrator: String,
  number: Number
});

module.exports = mongoose.model('Card', cardSchema);
