var mongoose = require('mongoose');

var autoIncrement = require('../app').autoIncrement;

var Schema = mongoose.Schema;

var playerSchema = new Schema({
  loginId: {
    type: String,
    lowercase: true
  },
  name: String,
  email: String,
  password: String,
  iconId: Number,
  blockedPlayers: [{type: Schema.Types.ObjectId, ref: 'Player'}],
  friends: {
    pending: [{type: Schema.Types.ObjectId, ref: 'Player'}],
    request: [{type: Schema.Types.ObjectId, ref: 'Player'}],
    mutual: [{type: Schema.Types.ObjectId, ref: 'Player'}]
  },
  isNew: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  permissions: {
    type: Number,
    default: 1
  },
  settings: {
    allowFriendRequest: {
      type: Boolean,
      default: true
    }
  },
  inventory: {
    cards: [{type: Schema.Types.ObjectId, ref: 'Card'}],
    decks: [{type: Schema.Types.ObjectId, ref: 'Deck'}]
  }
});

playerSchema.plugin(autoIncrement.plugin, {
  model: 'Player',
  field: 'playerId',
  startAt: 1
});

module.exports = mongoose.model('Player', playerSchema);
