/**
 * @author Will Taylor
 * Created on: 4/2/17
 */

/**
 * Player class, keeps track of player position, movement, etc.
 */
class Player extends Sprite{

  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(path){
    super(path)

    // The world coordinates of the player
    this.worldX = 0;
    this.worldY = 0;
  }

  update(){
    super.draw();
  }
}
