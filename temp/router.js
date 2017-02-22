var express = require('express');

var Player = require('../models/player');
var Edition = require('../models/edition');
var Illustrator = require('../models/illustrator');
var Card = require('../models/card');

var router = express.Router();

router.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

router.get('/players', function (req, res) {
  Player.find({}, function (err, players) {
    if (err) throw err;
    res.json(players);
  });
});

router.get('/test', function (req, res) {
  var algo = {};

  Edition.find({}, function (err, editions) {
    if (err) throw err;
    algo.editions = editions;

    Illustrator.find({}, function (err, illustrators) {
      if (err) throw err;
      algo.illustrators = illustrators;

      Card.find({}, function (err, cards) {
        if (err) throw err;
        algo.cards = cards;
        res.json(algo);
      });
    });
  });
});

module.exports = router;
