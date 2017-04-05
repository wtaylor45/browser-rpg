/**
 * @author Will Taylor
 * Created on 4/4/17
 */

/**
 * Handles all entities that are not this client's player
 */
class Entity extends Sprite{
  /**
   * Create the entity
   *
   * @param {number} sprite Which sprite model to use
   * @param {EntityType} type What type of entity this is
   */
  constructor(sprite, type){
    switch(type){
      case 0:
        super(Sprite.getPlayerSprite(sprite), true);
        break;
    }

    this.type = type;
  }

  // Set the entity's position
  setPos(x, y){
    this.x = x;
    this.y = y;
  }
}

Entity.EntityType = {
  PLAYER: 0,
  NPC: 1,
  PROJECTILE: 2
}
