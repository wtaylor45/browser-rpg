/**
 * @author Will Taylor
 * Created on: 4/9/17
 */

var Types = require('../../shared/js/types'),
    _ = require('underscore');

module.exports = Entity = class Entity{
  constructor(id, species, width, height){
    this.id = id;
    this.species = species;

    this.x = 0;
    this.y = 0;

    this.direction = Types.Directions.DOWN;

    this.width = width;
    this.height = height;

    this.sprite = null;
    this.animations = null;
    this.currentAnimation = null;
  }

  setPos(x, y){
    this.x = x;
    this.y = y;
  }

  getDirectionFromVector(vector){
    if(vector.y == 1) return Types.Directions.DOWN;
    if(vector.y == -1) return Types.Directions.UP;
    if(vector.x == 1) return Types.Directions.RIGHT;
    if(vector.x == -1) return Types.Directions.LEFT;
  }

  setDirection(direction){
    this.direction =  direction;
  }

  setSprite(sprite){
    if(!sprite){
      console.log('Missing a sprite.');
      return;
    }

    // This sprite is already the sprite
    if(this.sprite && this.sprite.name == sprite.name){
      return;
    }

    this.sprite = sprite;
  }

  getSprite(){
    return this.sprite;
  }

  getAnimationByName(name){
    var animation;

    if(_.indexOf(this.animations, name) >= 0){
      animation = this.animation[name];
    }

    return animation;
  }

  setAnimation(name, speed, count, endCount){
    var self = this;
    var directionBased = ["walk", "idle"];
    var rowOffset = 0;

    if(this.currentAnimation && this.currentAnimation.name == name){
      return;
    }

    if(_.indexOf(this.directionBased, name) >= 0){
      rowOffset = this.direction;
    }

    var anim = this.getAnimationByName(name);

    if(anim){
      anim.row += rowOffset;
      this.currentAnimation = anim;
      this.currentAnimation.setSpeed(speed);
      this.currentAnimation.setIterations(count ? count : 0, endCount, function(){
        self.idle();
      })
    }
  }
}
