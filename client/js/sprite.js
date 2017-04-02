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
  constructor(path){
    // The path and bitmap of the sprite
    this.path = path;
    this.image = new createjs.Bitmap(this.path);

    // X and Y screen coordinates
    this.screenX = 0;
    this.screenY = 0;
  }

  /**
   * Draw the sprite at its screen x and y
   */
  draw(){
    stage.addChild(this.image);
  }

  /**
   * Update the screen position of the sprite
   *
   * @param {number} x  The x screen coordinate to set to
   * @param {number} y  The y screen coordinate to set to
   */
  setScreenPosition(x, y){
    this.screenX = x;
    this.screenY = y;
  }
}
