var validator = require('validator');
var _ = require('lodash');
var mongoose = require('mongoose');

var io = require('./app').io;
var PlayerModel = require('./models/player');

// --------------------------------------------------

var playersHandler = {
  players: [],
  isConnected: function (playerId) {
    return _.find(this.players, {attributes: {playerId: playerId}}) ? true : false;
  },
  get: function (playerId) {
    return _.find(this.players, {attributes: {playerId: playerId}});
  }
};

var Player = function (player_attributes, socket) {
  this.attributes = player_attributes;
  this.socket = socket;
};

// Conectar jugador
Player.prototype.connect = function () {
  console.log(`DEBUG: Conectando jugador ID: ${this.attributes.playerId}`);
  playersHandler.players.push(this);
  io.sockets.emit('APPLICATION_ACTION', 'UPDATE_CPL', null); // Poner LDJ como tercer parametro.
};

// Desconectar jugador
Player.prototype.disconnect = function () {
  console.log(`DEBUG: Desconectando jugador ID: ${this.attributes.playerId}`);
  _.remove(playersHandler.players, {attributes: {playerId: this.attributes.playerId}});
  io.sockets.emit('APPLICATION_ACTION', 'UPDATE_CPL', null); // Poner LDJ como tercer parametro.
};

// --------------------------------------------------

io.on('connection', function (socket) {
  socket.on('ANONYMOUS_ACTION', function (action, data) {
    if (socket.session) {
      socket.emit('response', {
        success: false,
        errorCode: 1
      });
    } else {
      switch (action) {
        case 'LOGIN': {
          PlayerModel.findOne({loginId: new RegExp(`^${data.loginId}$`, 'i')}, function (err, player) {
            if (err) throw err;

            if (player) {
              if (data.password === player.password) {
                if (player.isBanned) {
                  socket.emit('response', {
                    success: false,
                    errorCode: 4
                  });
                } else {
                  if (playersHandler.isConnected(player.playerId)) playersHandler.get(player.playerId).socket.disconnect();
                  // Pulir >
                  var p = new Player({playerId: player.playerId}, socket);
                  p.connect();
                  socket.session = {player: p};
                  // <

                  socket.emit('response', {
                    success: true,
                    algo: 'algo'
                  });
                }
              } else {
                socket.emit('response', {
                  success: false,
                  errorCode: 3
                });
              }
            } else {
              socket.emit('response', {
                success: false,
                errorCode: 2
              });
            }

          });

          break;
        }

        case 'REGISTER': {
          var errorFields = [];

          var loginIdValidationPromise = new Promise(function (resolve, reject) {
            if (validator.isEmpty(data.loginId)) reject(1);
            else {
              if (validator.isAlphanumeric(data.loginId) && validator.isLength(data.loginId, {min: 6, max: 16})) {
                PlayerModel.findOne({loginId: new RegExp(`^${data.loginId}$`, 'i')}, function (err, player) {
                  if (err) throw err;
                  player ? reject(3) : resolve();
                });
              } else reject(2);
            }
          }).catch(function (errorCode) {
            errorFields.push({name: 'loginId', errorCode: errorCode});
          });

          var nameValidationPromise = new Promise(function (resolve, reject) {
            if (validator.isEmpty(data.name)) reject(1);
            else {
              if (validator.matches(data.name, /^[0-9a-zA-Z]+([\s|_]{1}[0-9a-zA-Z]+)?$/) && validator.isLength(data.name, {min: 4, max: 16})) {
                PlayerModel.findOne({name: new RegExp(`^${data.name}$`, 'i')}, function (err, player) {
                  if (err) throw err;
                  player ? reject(3) : resolve();
                });
              } else reject(2);
            }
          }).catch(function (errorCode) {
            errorFields.push({name: 'name', errorCode: errorCode});
          });

          var emailValidationPromise = new Promise(function (resolve, reject) {
            if (validator.isEmpty(data.email)) reject(1);
            else {
              if (validator.isEmail(data.email)) {
                data.email = validator.normalizeEmail(data.email);

                PlayerModel.findOne({email: data.email}, function (err, player) {
                  if (err) throw err;
                  player ? reject(3) : resolve();
                });
              } else reject(2);
            }
          }).catch(function (errorCode) {
            errorFields.push({name: 'email', errorCode: errorCode});
          });

          if (validator.isEmpty(data.password)) errorFields.push({name: 'password', errorCode: 1});
          else {
            if (!validator.isAlphanumeric(data.password) || !validator.isLength(data.password, {min: 6, max: 16})) {
              errorFields.push({name: 'password', errorCode: 2});
            }
          }

          Promise.all([loginIdValidationPromise, nameValidationPromise, emailValidationPromise]).then(function () {
            if (_.isEmpty(errorFields)) {
              var player = new PlayerModel({
                loginId: data.loginId,
                name: data.name,
                email: data.email,
                password: data.password
              });

              player.save(function (err) {
                if (err) throw err;

                socket.emit('response', {
                  success: true,
                  algo: 'algo'
                });
              });
            } else {
              socket.emit('response', {
                success: false,
                errorCode: 2,
                errorFields: errorFields
              });
            }
          });

          break;
        }

        case 'REMOVE_MODEL': { // temp
          PlayerModel.remove(function (err) {
            if (err) throw err;
          });
        }
      }
    }
  });

  socket.on('PLAYER_ACTION', function (action, data) {
    if (socket.session) {
      switch (action) {
        //
      }
    } else {
      socket.emit('response', {
        success: false,
        errorCode: 1
      });
    }
  });

  socket.on('ADMINISTRATOR_ACTION', function (action, data) {
    if (socket.session) {
      if (socket.session.player.permissions === 3) {
        switch (action) {
          //
        }
      } else {
        socket.emit('response', {
          success: false,
          errorCode: 2
        });
      }
    } else {
      socket.emit('response', {
        success: false,
        errorCode: 1
      });
    }
  });

  socket.on('MODERATOR_ACTION', function (action, data) {
    if (socket.session) {
      if (socket.session.player.permissions >= 2) {
        switch (action) {
          //
        }
      } else {
        socket.emit('response', {
          success: false,
          errorCode: 2
        });
      }
    } else {
      socket.emit('response', {
        success: false,
        errorCode: 1
      });
    }
  });

  socket.on('APPLICATION_ACTION', function (action, data) {});

  socket.on('disconnect', function () {
    if (socket.session) {
      socket.session.player.disconnect();
    }
  });
});
