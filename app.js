'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const Promise = require('bluebird');

exports.io = io;

mongoose.connect('mongodb://test:123@jello.modulusmongo.net:27017/oqix5yJu', function (err) {
  if (err) throw err;

  http.listen(3000, function () {
    console.log('listening on *:3000');
  });
});

autoIncrement.initialize(mongoose.connection);

exports.autoIncrement = autoIncrement;

app.use(express.static('temp')); // temp
app.use('/', require('./temp/router')); // temp
require('./sockets');
