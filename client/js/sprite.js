/**
 * @author Will Taylor
 * Created on: 4/2/17
 */

/**
 * Sprite class that will handle the drawing of all sprites in game.
 *
 * Intended usage is for entities like player, mobs, etc to extend this class
 */
class Sprite{
  constructor(sprite, animate, frame_width, frame_height, frames, loop){
    // The path and bitmap of the sprite
    this.image = sprite;

    // X and Y screen coordinates
    this.screenX = 0;
    this.screenY = 0;

    // World x and y
    this.x = 0;
    this.y = 0;

    // Does this sprite have animations, default false
    this.animate = animate || false;

    // The direction this sprite is facing
    this.direction = Player.Direction.DOWN;

    // Set up animation variables
    if(animate){
      // The width and height of each frame in the spritesheet
      this.frame_width = frame_width || 32;
      this.frame_height = frame_height || 64;

      // The current animation (does not signify playing or not)
      this.current_animation = -1;
    }

  }

  /**
   * Draw the sprite at its screen x and y
   */
  draw(){
    // Update the screen position of the sprite
    this.getScreenPosition();
    this.image.x = this.screenX;
    this.image.y = this.screenY;

    // Check if an animation is running
    if(this.current_animation.running){
      // Run the next iteration of the animation
      this.current_animation.run();
    }
    else{
      // No animation going, draw idle
      this.setIdle();
    }

    // Add the sprite to the stage
    stage.addChild(this.image);
  }

  /**
   * Switch the sprite to its idle state
   */
  setIdle(){
    this.image.sourceRect = new createjs.Rectangle(
      0,
      this.direction*this.frame_height,
      this.frame_width,
      this.frame_height
    )
  }

  /**
   * Start the given animation by creating a new animation for it.
   *
   * Will only happen if there is no animation running or the current animation
   * is different.
   *
   * For walking, this will change the direction for seamless transition between
   * walking states.
   *
   * @param {Object} animation  The animation to create and start
   */
  startAnimation(animation){
    // Is this animation differnt or is there no currently running animation?
    if(this.current_animation.type != animation.type
      || !this.current_animation.running){

      // Create a new animation using given properties, start it
      this.current_animation = new Animation(this, animation);
      this.current_animation.startAnimation();
      this.current_animation.running = true;
    }
    else if(this.current_animation.type == 'move'){
      // The current animation is a move
      // Update the animation to the correct direction
      this.current_animation.row = this.direction;
    }
  }

  /**
   * Update the screen position of the sprite
   *
   * @param {number} x  The x screen coordinate to set to
   * @param {number} y  The y screen coordinate to set to
   */
  getScreenPosition(){
    this.screenX = this.x;
    this.screenY = this.y;
  }
}

/**
 * Enumeration containing all player sprites
 * @type {string}
 */
Sprite.PlayerSprites = {
  0: 'sprite_000a.png',
  1: 'sprite_000b.png'
}

/**
 * Get the bitmap image for the value of the player sprite model
 * @param  {number} val The player sprite #
 * @return {Object} The sprite bitmap object
 */
Sprite.getPlayerSprite = function(val){
  return new createjs.Bitmap('client/assets/players/'+Sprite.PlayerSprites[val]);
}

/**
 * Animation class to handle the starting, stopping, etc of each animation
 */
class Animation{
  /**
   * Create a new animation
   *
   * @param {Object} sprite The sprite to apply this animation to
   * @param {Object} options  The animation options detailed below
   *
   * Options:
   * type: the animation type
   * row: the row of the spritesheet this animation lies in
   * frame_length: how long each frame lasts
   * num_frames: the number of frames in the animation (default: 4)
   * loop: does the animation loop?
   */
  constructor(sprite, options){
    this.running = false;

    this.sprite = sprite;

    this.type = options.type;

    this.row = options.row + this.sprite.direction

    // in ms
    this.duration = options.frame_length;

    this.num_frames = options.num_frames || 4;

    this.frame_width = this.sprite.frame_width;
    this.frame_height = this.sprite.frame_height;

    this.loop = options.loop || false;

    this.current_frame = 0;
    this.currentTick = 0;
  }

  /**
   * Start the animation
   */
  startAnimation(){
    this.running = true;

    this.current_tick = 0;
    this.current_frame = 1;
    this.run();
  }

  /**
   * An iteration of this animation
   */
  run(){
    // Check if the animation is running
    if(this.running){
      // Check if this iteration will change frame
      // TODO: use delta time to make consistent
      if(this.current_tick % this.duration == 0){
        if(this.current_frame >= this.num_frames){
          this.current_frame = 0;
        }

        // Crop the spritesheet to the correct frame
        this.sprite.image.sourceRect = new createjs.Rectangle(
          this.current_frame*this.frame_width,
          this.row*this.frame_height,
          this.frame_width,
          this.frame_height
        )

        // Check if the animation has started repeating
        // End the animation if the loop option is false
        if(this.current_frame == 0 && !this.loop) this.end();

        this.current_frame++;
      }

      this.current_tick++;
    }
  }

  /**
   * End the animation
   */
  end(){
    this.running = false;
    this.sprite.current_animation = -1
  }
}
