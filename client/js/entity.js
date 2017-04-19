/**
 * @author Will Taylor
 * Created on: 4/9/17
 */

var Types = require('../../shared/js/types'),
    _ = require('underscore'),
    Sprite = require('./sprite'),
    Game = require('./game');

module.exports = Entity = class Entity{
  constructor(id, species, width, height, x, y){
    this.id = id;
    this.species = species;

    this.x = x || 0;
    this.y = y || 0;

    this.direction = Types.Directions.DOWN;

    this.width = width;
    this.height = height;

    this.lastPos = [this.x, this.y];

    this.sprite = null;
    this.animations = null;
    this.currentAnimation = null;
  }

  setPos(x, y){
    this.lastPos = [this.x, this.y];
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
    console.log(this.direction)
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
    this.animations = sprite.createAnimations();
  }

  getSprite(){
    return this.sprite;
  }

  getAnimationByName(name){
    return this.animations[name];
  }

  setAnimation(name, speed, count, endCount){
    var self = this;
    var directionBased = ["walk", "idle"];
    var rowOffset = 0;

    if(_.indexOf(directionBased, name) >= 0){
      name += '_' + this.direction;
    }

    if(this.currentAnimation && this.currentAnimation.name === name){
      return;
    }

    var anim = this.getAnimationByName(name);
    if(anim){
      anim.row = anim.row;
      anim.rowOffset = rowOffset;
      this.currentAnimation = anim;
      this.currentAnimation.setSpeed(speed);
      this.currentAnimation.setIterations(count ? count : 0, endCount || function(){
        self.idle();
      })
    }
  }
}
