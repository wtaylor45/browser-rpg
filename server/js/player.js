/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types'),
    Character = require('./character');

module.exports = Player = Character.extend({
  init: function(connection, server){
    this.server = server;
    this.connection = connection;

    this._super(this.connection.id, "player", Types.Entities.PLAYER, 0, 0, 32, 64);

    this.inGame = false;

    // List of NPCs that are aggressive to the player
    this.enemies = {};

    // Listen for and handle messages from this player's client
    this.connection.on('message', function(message){
      if(message.type == Types.Messages.MOVE){
        console.log('moved')
      }
    });

    // When the player disconnects
    this.connection.on('disconnect', function(){
      console.log('Disconnected')
    })
  }
});

/*
function Player(id){
  this.id = id;
  this.x = 0;
  this.y = 0;

  this.width = 32;
  this.height = 64;

  this.maxSpeed = 15;
  this.speed = 10;

  this.inputs = [];
  this.last_input = false;

  this.keyLeft = false;
  this.keyRight = false;
  this.keyUp = false;
  this.keyDown = false;

  this.direction = Player.Direction.DOWN;

  this.last_action = -1;

  this.cooldown = 1000;
  this.attacking = false;

  this.queueInput = function(type, input){
    input.type = type;
    this.inputs.push(input);
  }

  this.applyInput = function(input){
    if(input.type == 'atk'){
      this.attack();
      return;
    }
    this.x += input.vector[0]*input.press_time*this.speed;
    this.y += input.vector[1]*input.press_time*this.speed;

    // Update the direction the player is facing
    if(input.vector[1] == 1){
      this.direction = Player.Direction.DOWN;
    }
    else if(input.vector[1] == -1){
      this.direction = Player.Direction.UP;
    }else if(input.vector[0] == 1){
      this.direction = Player.Direction.LEFT;
    }
    else if(input.vector[0] == -1){
      this.direction = Player.Direction.RIGHT;
    }

    this.last_input = input.seq;
    this.last_action = Player.Actions.MOVE;
  }

  this.attack = function(){
    // TODO: Write attack function
    this.attacking = true;
    this.last_action = Player.Actions.ATTACK;
    var self = this;
    setTimeout(function(){
      self.attacking = false;
    }, this.cooldown);
  }

  this.update = function(dt){
    this.last_action = -1;
    var i = 0;
    while(i<this.inputs.length){
      this.applyInput(this.inputs[i]);
      this.inputs.splice(i,1)
    }

    //if(this.attacking) this.last_action = Player.Actions.ATTACK;
  }

  this.pack = function(){
    var send = {
      x: this.x,
      y: this.y,
      last_input: this.last_input,
      last_action: this.last_action,
      direction: this.direction,
      id: this.id,
      sprite: 1
    }

    return send;
  }
}

Player.Actions = {
  MOVE: 0,
  ATTACK: 1
}

Player.Direction = {
  UP: 1,
  DOWN: 0,
  LEFT: 2,
  RIGHT: 3
}
*/
