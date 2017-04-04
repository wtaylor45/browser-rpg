/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

/**
 * Player class, keeps track of player position, movement, etc.
 */
class Player extends Entity{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, sprite){
    // Create the player's entity
    super(sprite, Entity.EntityType.PLAYER);

    this.id = id;

    // Player movement variables
    this.MAX_SPEED = 15;
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;
  }

  applyInput(input){
    this.x += input.vector[0]*input.press_time*this.speed;
    this.y += input.vector[1]*input.press_time*this.speed;

    if(input.vector[1] == 1){
      this.setAnimation(Sprite.Animations.DOWN)
    }
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    // Check which commands were issued, package it
    var input;
    var movement_vector = [0,0];
    if(up){
      movement_vector[1]--;
      input = {press_time: dt, vector: movement_vector}
    }
    else if(down){
      movement_vector[1]++;
      input = {press_time: dt, vector: movement_vector}
    }
    if(left){
      movement_vector[0]--;
      input = {press_time: dt, vector: movement_vector}
    }
    else if(right){
      movement_vector[0]++;
      input = {press_time: dt, vector: movement_vector}
    }

    // If player is not moving
    // TODO: Change this so that other animations can run
    if(!right && !down && !left && !up) this.current_animation = -1

    if(input){
      // Send the input package to the server
      input.seq = this.input_seq++;
      var message = new Message(Message.MessageType.MOVE, input)
      message.send();

      // Apply the package to the client now
      this.applyInput(input);

      // Save input to validated later
      this.pending_inputs.push(input);
    }
  }
}
