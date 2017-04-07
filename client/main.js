"use strict"

var Game = require('./js/game'),
    Player = require('./js/player'),
    Message = require('./js/message');

var socket = io();
var game;

Message.socket = socket;

socket.on('connected', function(id){
  game = new Game();

  game.setPlayer(new Player(id, 0));
  game.start();
});
