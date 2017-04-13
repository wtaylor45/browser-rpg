var _ = require('underscore')

module.exports = Updater = class Updater{
  constructor(game){
    this.game = game;
    this.lastTime = new Date().getTime();
  }

  update(){
    var currentTime = new Date().getTime();
    var dt = currentTime - this.lastTime;

    this.game.readServerMessages();
    this.updatePlayer(dt);
    this.updateEntities(dt);
  }

  updatePlayer(dt){
    this.game.player.update(dt);
  }

  updateEntities(dt){
    var self = this;
    _.each(this.game.entities, function(entity){
      entity.updateMovement();
      self.updateAnimation(entity, dt);
    });
  }

  updateAnimation(entity, dt){
    var anim = entity.currentAnimation;

    if(anim){
      anim.update(dt);
    }
  }
}
