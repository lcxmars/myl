var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var Promise = require('bluebird');

exports.io = io;

mongoose.connect('mongodb://test:123@jello.modulusmongo.net:27017/oqix5yJu', function (err) {
  if (err) throw err;

  http.listen(3000, function () {
    console.log('listening on *:3000');
  });
});

autoIncrement.initialize(mongoose.connection);

exports.autoIncrement = autoIncrement;

app.use('/', require('./temp/router')); // temp
require('./sockets');
