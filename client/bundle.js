(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

 var Game = require('./game'),
     Player = require('./player'),
     Socket = require('./socket');

 var game;

module.exports = App = class App{
  constructor(){
    this.game = false;
    this.ready = false;

    this.setGame(new Game());

    Socket.on('connected', this.onConnected.bind(this));
  }

  setGame(game){
    this.game = game;
  }

  start(){
    if(!this.game.started && this.game.player){
      this.game.start();
    }
  }

  onConnected(id){
    this.game.setPlayer(new Player(id, 0));
    this.start();
  }
}

},{"./game":2,"./player":5,"./socket":6}],2:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Input = require('./input'),
    Stage = require('./stage'),
    Types = require('../../shared/js/types'),
    Socket = require('./socket');

/**
 * The client instance of the game
 *
 * Handles the stage as well
 */
module.exports = Game = class Game{
  constructor(){
    var self = this;
    // Has the game started yet on the client side?
    this.started = false;

    Stage.init();

    // Who is the client's player?
    this.player = false;

    // Recieve messages from server to be processed here
    this.mailbox = [];

    // List of all entities to be drawn
    this.entities = {}

    this.FPS = 60;

    new Socket.on('message', function(message){
      self.mailbox.push(message);
    });
  }

  /**
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    this.render();

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
  }

  readServerMessages(dt){
    // Read every message one at a time
    for(var i=0;i<this.mailbox.length;i++){
      var message = this.mailbox[i];
      if(message.type == Types.Messages.MOVE){
        if(message.id == this.player.id){
          this.player.setPos(message.x, message.y);
          // Preform reconciliation
          var k = 0;
          while (k < this.player.pending_inputs.length){
            var input = this.player.pending_inputs[k];
            // Check if this input has already been processed client side
            if(input.seq <= message.lastProcessedInput){
              // This input has been processed by the server
              // Therefore there is no need to reapply it
              this.player.pending_inputs.splice(k,1);
            }
            else{
              // This input has not been processed by the server yet
              // Reapply it
              this.player.applyInput(input);
              k++;
            }
          }
        }
      }
      this.mailbox.splice(i,1);
    }
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    this.readServerMessages(dt);
    this.player.update(dt);

    var info = "Non-acknowledged inputs: " + this.player.pending_inputs.length;
    player_status.textContent = info;
  }

  render(){
    Stage.removeAllChildren();

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = this.player.x+100;
    circle.y = this.player.y;
    Stage.addChild(circle);

    Stage.update();

    window.requestAnimationFrame(this.render.bind(this));
  }

  draw(x, y, sprite){
    var g = new createjs.Graphics();

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

},{"../../shared/js/types":9,"./input":3,"./socket":6,"./stage":7}],3:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = true;
var UP = false;

Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.up = val;
      break;
    case 83:
      state.down = val;
      break;
    case 65:
      state.left = val;
      break;
    case 68:
      state.right = val;
      break;
  }
}

Input.getMovementVector = function(){
  state = Input.getState();
  vector = {x: 0, y: 0};

  if(state.up) vector.y = -1;
  else if(state.down) vector.y = 1;
  if(state.left) vector.x = -1;
  else if(state.right) vector.x = 1;

  return vector;
}

Input.baseState = function(){
  return {
    up: false,
    down: false,
    left: false,
    right: false
  }
}

Input.getState = function(){
  return STATE;
}

Input.reset = function(){
  STATE = Input.baseState();
}

Input.init = function(){
  STATE = Input.baseState();

  document.onkeydown = function(event){
    console.log('down')
    Input.onKeyEvent(event.keyCode, DOWN);
  }

  document.onkeyup = function(event){
    Input.onKeyEvent(event.keyCode, UP);
  }
}

},{"../../shared/js/types":9}],4:[function(require,module,exports){
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

var Socket = require('./socket');

module.exports = Message = class Message{
  constructor(type, data){
    this.message = {
      type: type,
      data: data
    }
  }

  send(){
    Socket.emit('message', this.message);
  }
}

},{"./socket":6}],5:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Game = require('./game'),
    Message = require('./message');

var stage = new createjs.Stage('canvas');

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

    this.x = this.y = 0;
  }

  /**
   * Apply the given input to the character
   *
   * @param {Object} input  The input to be applied
   */
  applyInput(input){
    // Update the player x and y based on the movement vector
    this.x += input.vector.x*input.pressTime*this.speed;
    this.y += input.vector.y*input.pressTime*this.speed;
  }

  setPos(x, y){
    this.x = x;
    this.y = y;
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
    var g = new createjs.Graphics();
    g.setStrokeStyle(1);
    g.beginStroke("#000000");
    g.beginFill("red");
    g.drawRect(50,this.y,100,100);
  }
}

},{"./game":2,"./message":4}],6:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

module.exports = Socket = class Socket{};
var socket = io();

Socket.emit = function(type, data){
  socket.emit(type, data);
}

Socket.on = function(evnt, callback){
  socket.on(evnt, function(data){
    callback(data);
  });
}

},{}],7:[function(require,module,exports){
module.exports = Stage = {};
var stage;

Stage.addChild = function(child){
  stage.addChild(child);
}

Stage.update = function(){
  stage.update();
}

Stage.removeAllChildren = function(){
  stage.removeAllChildren();
}

Stage.init = function(){
  stage = new createjs.Stage('canvas');
}

},{}],8:[function(require,module,exports){
"use strict"

var App = require('./js/app');

$(document).ready(function(){
  var app = new App();
});

},{"./js/app":1}],9:[function(require,module,exports){
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

},{}]},{},[8]);
