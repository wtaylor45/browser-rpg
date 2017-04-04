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

    if(animate){
      this.current_frame = 0;
      this.frame_width = frame_width || 32;
      this.frame_height = frame_height || 64;
      this.frames = frames || 4;

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

    if(this.current_animation >= 0){
      this.animation();
    }
    else{
      this.setFrame(1)
    }

    stage.addChild(this.image);
  }

  animation(){
    if(this.current_tick % this.frame_duration == 0){

      var frame_index = this.getNextFrameIndex();
      this.setFrame(frame_index);
    }

    if(this.current_frame >= this.frames){
      this.current_animation = -1;
      return;
    }

    this.current_tick++;
  }

  setFrame(frame){
    this.image.sourceRect = new createjs.Rectangle(
      frame * this.frame_width,
      0,
      this.frame_width,
      this.frame_height
    )
  }

  setAnimation(animation){
    if(this.current_animation != animation){
      this.current_animation = animation;
      this.current_tick = 0;
      this.current_frame = 0
    }
  }

  getNextFrameIndex(){
    var frame = this.current_frame + this.current_animation*this.frames;
    this.current_frame++;
    if(this.current_frame == this.frames && this.loop) this.current_frame = 0;

    return frame;
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
  UP: 1,
  DOWN: 0,
  LEFT: 2,
  RIGHT: 3
}

/**
 * Get the bitmap image for the value of the player sprite model
 * @param  {number} val The player sprite #
 * @return {Object} The sprite bitmap object
 */
Sprite.getPlayerSprite = function(val){
  return new createjs.Bitmap('client/assets/players/'+Sprite.PlayerSprites[val]);
}
