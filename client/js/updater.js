var _ = require('underscore')

module.exports = Updater = class Updater{
  constructor(game){
    this.game = game;
    this.lastTime = new Date().getTime();
  }

  update(){
    var currentTime = new Date().getTime();
    var dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.game.readServerMessages();
    this.updateEntities(dt);
    if(this.game.renderer.camera)
      this.game.renderer.camera.update();
  }

  updatePlayer(dt){
    var player = this.game.player;
    player.update(dt);
  }

  updateEntities(dt){
    var self = this;
    _.each(this.game.entities, function(entity){
      if(entity instanceof Character) self.updateCharacter(entity, dt);
      self.updateAnimation(entity, dt);
    });
  }

  updateCharacter(entity, dt){
    if(entity == this.game.player) this.updatePlayer(dt);
    entity.updateMovement();
    entity.lastPos = [entity.x, entity.y];
  }

  updateAnimation(entity, dt){
    var anim = entity.currentAnimation;

    if(anim){
      anim.update(dt);
    }
  }
}
