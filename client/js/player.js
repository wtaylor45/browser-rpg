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

  /**
   * Apply the given input to the character
   *
   * @param {Object} input  The input to be applied
   */
  applyInput(input){
    // Update the player x and y based on the movement vector
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

    // Start the animation
    this.startAnimation(Player.Actions.MOVE)
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
    var movement_vector = [0,0];

    // The type of input
    var inputType;

    // Check which input is down, act accordingly
    if(up){
      movement_vector[1]--;
      input = {press_time: dt, vector: movement_vector}
      inputType = Message.MessageType.MOVE;
    }
    else if(down){
      movement_vector[1]++;
      input = {press_time: dt, vector: movement_vector}
      inputType = Message.MessageType.MOVE;
    }
    if(left){
      movement_vector[0]--;
      input = {press_time: dt, vector: movement_vector}
      inputType = Message.MessageType.MOVE;
    }
    else if(right){
      movement_vector[0]++;
      input = {press_time: dt, vector: movement_vector}
      inputType = Message.MessageType.MOVE;
    }
    else if(attack1){
      // TODO: make cooldown dependant
      attack1 = false;
      input = {press_time: dt}
      inputType = Message.MessageType.ATTACK;
      this.startAnimation(Player.Actions.ATTACK)
    }

    // If player is not moving
    // TODO: Change this so that other animations can run


    if(input){
      // Send the input package to the server
      input.seq = this.input_seq++;
      var message = new Message(inputType, input)
      message.send();

      if(inputType == Message.MessageType.MOVE){
        // Apply the package to the client now
        this.applyInput(input);

        // Save input to validated later
        this.pending_inputs.push(input);
      }
    }

    if(!right && !down && !left && !up){
      if(this.current_animation.type == 'move'){
        if(this.current_animation.running)
          this.current_animation.end();
      }
    }
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
