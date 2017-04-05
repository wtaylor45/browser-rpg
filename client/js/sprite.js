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

    this.animate = animate || false;

    this.direction = Player.Direction.DOWN;

    if(animate){
      this.animations = [];
      this.frame_width = frame_width || 32;
      this.frame_height = frame_height || 64;

      this.frame_duration = 10;

      this.current_tick = 0;

      this.loop = loop || false;

      this.current_animation = -1;
    }

  }

  /**
   * Draw the sprite at its screen x and y
   */
  draw(){
    this.getScreenPosition();
    this.image.x = this.screenX;
    this.image.y = this.screenY;

    if(this.current_animation.running){
      this.current_animation.run();
    }
    else{
      // Draw idle
      this.setIdle();
    }

    stage.addChild(this.image);
  }

  setIdle(){
    this.image.sourceRect = new createjs.Rectangle(
      0,
      this.direction*this.frame_height,
      this.frame_width,
      this.frame_height
    )
  }

  startAnimation(animation){
    if(this.current_animation.type != animation.type
      || !this.current_animation.running){
      this.current_animation = new Animation(this, animation);
      this.current_animation.startAnimation();
      this.current_animation.running = true;
    }
    else if(this.current_animation.type == 'move'){
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

Sprite.PlayerSprites = {
  0: 'sprite_000a.png',
  1: 'sprite_000b.png'
}

Sprite.Animations = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  PUNCH: 4
}

/**
 * Get the bitmap image for the value of the player sprite model
 * @param  {number} val The player sprite #
 * @return {Object} The sprite bitmap object
 */
Sprite.getPlayerSprite = function(val){
  return new createjs.Bitmap('client/assets/players/'+Sprite.PlayerSprites[val]);
}


class Animation{
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

  startAnimation(){
    this.running = true;

    this.current_tick = 0;
    this.current_frame = 1;
    this.run();
  }

  run(){
    if(this.running){
      var rect;

      if(this.current_tick % this.duration == 0){
        if(this.current_frame >= this.num_frames){
          this.current_frame = 0;
        }

        var frame = this.current_frame*this.frame_width;

        // Crop the spritesheet to the correct frame
        this.sprite.image.sourceRect = new createjs.Rectangle(
          frame,
          this.row*this.frame_height,
          this.frame_width,
          this.frame_height
        )

        if(this.current_frame == 0) this.end();

        this.current_frame++;
      }

      this.current_tick++;
    }
  }

  end(){
    console.log('ending')
    this.running = false;
  }
}
