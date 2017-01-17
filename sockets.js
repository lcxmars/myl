var validator = require('validator');
var _ = require('lodash');
var mongoose = require('mongoose');

var io = require('./app').io;
var Player = require('./models/player');

function ConnectedPlayer (player, socket) {
  this.playerId = player.playerId;
  this.name = player.name;
  this.iconId = player.iconId;
  this.permissions = player.permissions;
  this.socket = socket;
}

io.on('connection', function (socket) {
  socket.on('anonymous action', function (action, data) {
    if (socket.session) {
      socket.emit('response', {
        success: false,
        errorCode: 1
      });
    } else {
      switch (action) {
        case 'LOGIN': {
          Player.findOne({loginId: new RegExp(`^${data.loginId}$`, 'i')}, function (err, player) {
            if (err) throw err;

            if (player) {
              if (data.password === player.password) {
                if (player.status.isBanned) {
                  socket.emit('response', {
                    success: false,
                    errorCode: 4
                  });
                } else {
                  _.each(io.sockets.connected, function (socket) {
                    if (socket.session) {
                      if (socket.session.player.playerId === player.playerId) {
                        socket.disconnect();
                        return false;
                      }
                    }
                  });

                  socket.session = {
                    player: new ConnectedPlayer(_.pick(player, ['playerId', 'name', 'iconId', 'permissions']), socket)
                  };

                  io.emit('application action', 'UPDATE_CPL', _.map(io.sockets.connected, function (socket) {
                    if (socket.session) return _.omit(socket.session.player, ['permissions', 'socket']);
                  }));

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
                Player.findOne({loginId: new RegExp(`^${data.loginId}$`, 'i')}, function (err, player) {
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
                Player.findOne({name: new RegExp(`^${data.name}$`, 'i')}, function (err, player) {
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

                Player.findOne({email: data.email}, function (err, player) {
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
              var player = new Player({
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
          Player.remove(function (err) {
            if (err) throw err;
          });
        }
      }
    }
  });

  socket.on('player action', function (action, data) {
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

  socket.on('administrator action', function (action, data) {
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

  socket.on('moderator action', function (action, data) {
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

  socket.on('application action', function (action, data) {});

  socket.on('disconnect', function () {
    if (socket.session) {
      io.emit('application action', 'UPDATE_CPL', _.map(io.sockets.connected, function (socket) {
        if (socket.session) return _.omit(socket.session.player, ['permissions', 'socket']);
      }));
    }
  });
});
