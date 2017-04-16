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
    this.updatePlayer(dt);
    this.updateEntities(dt);

  }

  updatePlayer(dt){
    this.game.player.update(dt);
  }

  updateEntities(dt){
    var self = this;
    _.each(this.game.entities, function(entity){
      if(entity instanceof Character) self.updateCharacter(entity);
      self.updateAnimation(entity, dt);
    });
  }

  updateCharacter(entity){
    var map = this.game.currentMap
    _.each(map.nearestTiles(entity), function(index){
      console.log('Checking')
      if(map.isColliding(index[0], index[1])){
        entity.setPos(entity.lastPos[0], entity.lastPos[1]);
        console.log('collision');
      }
    });

    entity.updateMovement();
  }

  updateAnimation(entity, dt){
    var anim = entity.currentAnimation;

    if(anim){
      anim.update(dt);
    }
  }
}
