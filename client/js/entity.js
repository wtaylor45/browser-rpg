/**
 * @author Will Taylor
 * Created on: 4/9/17
 */


module.exports = Entity = class Entity{
  constructor(id, species, width, height){
    this.id = id;
    this.species = species;

    this.x = 0;
    this.y = 0;

    this.direction = down;

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

    if(name in this.animations){
      animation = this.animation[name];
    }

    return animation;
  }

  setAnimation(name, speed, count, endCount){
    var self = this;

    if(this.currentAnimation && this.currentAnimation.name == name){
      return;
    }

    var anim = this.getAnimationByName(name);

    if(anim){
      this.currentAnimation = anim;
      this.currentAnimation.setSpeed(speed);
      this.currentAnimation.setIterations(count);
      this.currentAnimation.(count ? count : 0, endCount, function(){
        //self.idle();
      })
    }
  }
}
