(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Input = require('./input');
var stage = new createjs.Stage('canvas');

/**
 * The client instance of the game
 *
 * Handles the stage as well
 */
module.exports = Game = class Game{
  constructor(){
    // Has the game started yet on the client side?
    this.started = false;

    // Who is the client's player?
    this.player = false;

    // Recieve messages from server to be processed here
    this.mailbox = [];

    // List of all entities to be drawn
    this.entities = {}

    this.FPS = 60;
  }

  /**
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    //this.render();

    Input.init();

    // ∆t variables
    var lastTime = new Date().getTime();
    var curTime, dt;

    // Keep track of loop iteration
    var iter = 0;

    var self = this;
    setInterval(function(){
      // ∆t calculation
      curTime = new Date().getTime();
      dt = (curTime - lastTime)/100;
      lastTime = curTime;

      // Update every loop
      self.update(dt);

      iter++;
    }, 1000/this.FPS);
  }

  /**
   * Set this games player (the client's player)
   *
   * @param {Object} player The player object that belongs to this client
   */
  setPlayer(player){
    this.player = player;
    console.log(this.player)
  }

  readServerMessages(dt){
    // New list of entities to keep track of
    //
    // Purpose of this is to automatically remove any entities
    // who do not need to be drawn anymore for whatever reason
    var entities = {};

    // Read every message one at a time
    for(var i in this.mailbox){
      var mail = this.mailbox[i];

      // First, go through each player
      for(var j in mail.players){
        var server_player = mail.players[j];

        // Check if the player is this client's player
        if(server_player.id == game.player.id){
          // Update the player's position to where they are according to server
          // This is in essence a correction
          game.player.setPos(server_player.x, server_player.y);

          // Preform reconciliation
          var k = 0;
          while (k < game.player.pending_inputs.length){
            var input = game.player.pending_inputs[k];
            // Check if this input has already been processed client side
            if(input.seq <= server_player.last_input){
              // This input has been processed by the server
              // Therefore there is no need to reapply it
              game.player.pending_inputs.splice(k,1);
            }
            else{
              // This input has not been processed by the server yet
              // Reapply it
              game.player.applyInput(input);
              k++;
            }
          }
        }
        else{
          // Other player

          // We haven't seen this entity before
          // Create a new entity for it
          if(!this.entities[server_player.id]){
            this.entities[server_player.id] = new Entity(server_player.sprite,
              Entity.EntityType.PLAYER);
          }

          // Add this entity to the updated entities list
          entities[server_player.id] = this.entities[server_player.id];

          var entity = entities[server_player.id];

          // Update entity's position
          entity.update(server_player)
        }
      }

      this.entities = entities;

      // Remove mail
      this.mailbox.splice(i,1);
    }
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    //this.readServerMessages(dt);\
    this.player.update(dt);

    var info = "Non-acknowledged inputs: " + this.player.pending_inputs.length;
    player_status.textContent = info;
  }

  render(){
    stage.removeAllChildren();

    this.player.draw();

    for(var i in this.entities){
      this.entities[i].draw();
    }

    stage.update();

    window.requestAnimationFrame(this.render.bind(this));
  }

  draw(x, y, sprite){
    var bitmap = Sprite.getPlayerSprite(sprite)
    bitmap.x = x;
    bitmap.y = y;
    stage.addChild(bitmap)
  }
}
/*
// Input handling
var up = down = left = right = false;
var attack1 = false;
var allowed = true;

Game.keyHandler = function(game){
  document.onkeydown = function(event){
    if(event.keyCode === 68){    //d
      right = true;
    }
    else if(event.keyCode === 83){   //s
      down = true;
    }
    else if(event.keyCode === 65){ //a
      left = true;
    }
    else if(event.keyCode === 87){ // w
      up = true;
    }
    else if(event.keyCode == 49){
      if(!allowed) return;
      attack1 = true;
      allowed = false;
    }
  }

  document.onkeyup = function(event){
    if(event.keyCode === 68){    //d
      right = false;
    }
    else if(event.keyCode === 83){   //s
      down = false;
    }
    else if(event.keyCode === 65){ //a
      left = false;
    }
    else if(event.keyCode === 87){ // w
      up = false;
    }
    else if(event.keyCode == 49){
      // TODO: Make cool down dependant in actor class
      attack1 = false;
      allowed = true;
    }
  }
}
*/
/**
 * Get updates information from the server

socket.on('update', function(mail){
  // Only accept mail if game is created
  game.mailbox.push(mail);
});
*/

},{"./input":2}],2:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = 1;
var UP = 0;

Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.vector.y = -1 * val;
      break;
    case 83:
      state.vector.y = val
      break;
  }
}

Input.getMovementVector = function(){
  return Input.getState().vector;
}

Input.baseState = function(){
  return {
    vector: {x: 0, y: 0}
  }
}

Input.getState = function(){
  return STATE;
}

Input.reset = function(){
  STATE = Input.baseState;
}

Input.init = function(){
  STATE = Input.baseState();

  $(document).keydown(function(event){
    Input.onKeyEvent(event.keyCode, DOWN);
  });

  $(document).keyup(function(event){
    Input.onKeyEvent(event.keyCode, UP);
  });
}

},{"../../shared/js/types":6}],3:[function(require,module,exports){
/**
 * @author Will Taylor
 *
 * Message Format:
 * {
 *   'type': [type],
 *   'data': {
 *     [data]
 *   }
 * }
 */

module.exports = Message = class Message{
  constructor(type, data){
    this.message = {
      type: type,
      data: data
    }
  }

  send(){
    Message.socket.emit('message', this.message);
  }
}

},{}],4:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Game = require('./game'),
    Message = require('./message');

/**
 * Player class, keeps track of player position, movement, etc.
 */
module.exports = Player = class Player{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, sprite){
    // Create the player's entity
    //this.sprite = new Sprite(Sprite.getPlayerSprite(sprite), false);
    this.id = id;

    // Player movement variables
    this.MAX_SPEED = 15;
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;
  }

  /**
   * Apply the given input to the character
   *
   * @param {Object} input  The input to be applied
   */
  applyInput(input){
    // Update the player x and y based on the movement vector
    this.x += input.vector[0]*input.press_time*this.speed;
    this.y += input.vector[1]*input.press_time*this.speed;
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    // Check which commands were issued, package it
    var input;

    // The vector defining which direction we are moving in
    var movementVector = Input.getMovementVector();

    // The type of input
    var inputType;

    // If there is movement vector will not be [0,0]
    if(movementVector.x != 0 || movementVector.y != 0){
      input = {pressTime: dt, vector: movementVector}
    }

    if(input){
      // Send the input package to the server
      input.seq = this.input_seq++;

      var message = new Message(Types.Messages.MOVE, input);
      message.send();

      this.applyInput(input);

      // Save input to validated later
      this.pending_inputs.push(input);
    }
  }

  draw(){
    //this.sprite.draw();
  }
}

Player.Direction = {
  UP: 1,
  DOWN: 0,
  LEFT: 2,
  RIGHT: 3
}

Player.Actions = {
  MOVE: {type: 'move', row: 0, num_frames:4, frame_length: 10, loop: true},
  ATTACK: {type: 'attack', row: 4, num_frames:4, frame_length: 10}
}

},{"./game":1,"./message":3}],5:[function(require,module,exports){
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

},{"./js/game":1,"./js/message":3,"./js/player":4}],6:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/6/17
 *
 * Heavily based on Mozilla's BrowserQuest
 */

/**
 * Enumeration of enumerations.
 * Contains details such as message types, directions, etc.
 * @type {Object}
 */
Types = {
  Messages: {
    LOGIN: 0,
    LOGOUT: 1,
    MOVE: 2,
    SPAWN: 3,
    ATTACK: 4
  },

  Entities: {
    PLAYER: 0
  },

  Directions: {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
  }
}

if(!(typeof exports === 'undefined')){
  module.exports = Types;
}

},{}]},{},[5]);
