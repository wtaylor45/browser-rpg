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
  constructor(sprite, frame_width, frame_height, frames){
    // The path and bitmap of the sprite
    this.image = sprite;

    // X and Y screen coordinates
    this.screenX = 0;
    this.screenY = 0;

    // World x and y
    this.x = 0;
    this.y = 0;

    this.current_frame = 0;
    this.frame_width = frame_width || 32;
    this.frame_height = frame_height || 64;
    this.frames = frames || 4;

    this.frame_duration = 10;

    this.current_tick = 0;

  }

  /**
   * Draw the sprite at its screen x and y
   */
  draw(){
    this.getScreenPosition();
    this.image.x = this.screenX;
    this.image.y = this.screenY;
    if(this.current_tick % this.frame_duration == 0){
      this.image.sourceRect = new createjs.Rectangle(
        this.current_frame * this.frame_width,
        0,
        this.frame_width,
        this.frame_height
      )
      if(this.current_frame >= this.frames-1)this.current_frame = 0;
      else this.current_frame++;
    }
    stage.addChild(this.image);

    this.current_tick++;
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

/**
 * Get the bitmap image for the value of the player sprite model
 * @param  {number} val The player sprite #
 * @return {Object} The sprite bitmap object
 */
Sprite.getPlayerSprite = function(val){
  return new createjs.Bitmap('client/assets/players/'+Sprite.PlayerSprites[val]);
}
