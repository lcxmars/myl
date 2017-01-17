var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var deckSchema = new Schema({
  name: String,
  cards: [{type: Schema.Types.ObjectId, ref: 'Card'}]
});

module.exports = mongoose.model('Deck', deckSchema);
