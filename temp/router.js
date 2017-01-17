var express = require('express');

var Player = require('../models/player');

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

module.exports = router;
