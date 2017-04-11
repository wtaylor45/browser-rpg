/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Character = require('./character'),
    Message = require('./message');

var stage = new createjs.Stage('canvas');

/**
 * Player class, keeps track of player position, movement, etc.
 */
module.exports = Player = class Player extends Character{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, sprite){
    super(id, Types.Entities.PLAYER)

    // Player movement variables
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;

    this.setSprite();
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

    this.setDirection(this.getDirectionFromVector(vector))
    this.walk();
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
    }else{
      this.idle();
    }
  }
}
