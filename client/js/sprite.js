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
  constructor(sprite){
    // The path and bitmap of the sprite
    this.image = sprite;

    // X and Y screen coordinates
    this.screenX = 0;
    this.screenY = 0;

    // World x and y
    this.x = 0;
    this.y = 0;
  }

  /**
   * Draw the sprite at its screen x and y
   */
  draw(){
    this.getScreenPosition();
    this.image.x = this.screenX;
    this.image.y = this.screenY;
    stage.addChild(this.image);
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
  0: 'sprite_000a.png'
}

/**
 * Get the bitmap image for the value of the player sprite model
 * @param  {number} val The player sprite #
 * @return {Object} The sprite bitmap object
 */
Sprite.getPlayerSprite = function(val){
  return new createjs.Bitmap('client/assets/players/'+Sprite.PlayerSprites[val]);
}
