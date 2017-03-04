'use strict';

const validator = require('validator');
const _ = require('lodash');
const mongoose = require('mongoose');

const io = require('./app').io;
const PlayerModel = require('./models/player');

// ---------- //

const playersHandler = {
  players: [],
  isConnected (playerId) {
    return _.find(this.players, {attributes: {playerId: playerId}}) ? true : false;
  },
  get (playerId) {
    return _.find(this.players, {attributes: {playerId: playerId}});
  }
};

class Player {
  constructor (attributes, socket) {
    this.attributes = attributes;
    this.socket = socket;
  }

  connect () { // Conectar jugador
    console.log(`DEBUG: Conectando jugador ID: ${this.attributes.playerId}`);
    playersHandler.players.push(this);
    io.sockets.emit('application action', 'UPDATE_CPL', _.omit(this.attributes, ['permissions']));
  }

  disconnect () { // Desconectar jugador
    console.log(`DEBUG: Desconectando jugador ID: ${this.attributes.playerId}`);
    _.remove(playersHandler.players, {attributes: {playerId: this.attributes.playerId}});
    io.sockets.emit('application action', 'UPDATE_CPL', _.omit(this.attributes, ['permissions']));
  }
}

// ---------- //

io.on('connection', function (socket) {
  socket.on('anonymous action', function (action, data) {
    if (socket.player) {
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
                  socket.player = new Player(_.pick(player, ['playerId', 'name', 'iconId', 'permissions']), socket);
                  socket.player.connect();

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
          const errorFields = [];

          const loginIdValidationPromise = new Promise(function (resolve, reject) {
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

          const nameValidationPromise = new Promise(function (resolve, reject) {
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

          const emailValidationPromise = new Promise(function (resolve, reject) {
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
              const player = new PlayerModel({
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

  socket.on('player action', function (action, data) {
    if (socket.player) {
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
    if (socket.player) {
      if (socket.player.attributes.permissions === 3) {
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
    if (socket.player) {
      if (socket.player.attributes.permissions >= 2) {
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
    if (socket.player) socket.player.disconnect();
  });
});
