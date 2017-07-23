var Types = require('../../shared/js/types'),
    _ = require('underscore');

module.exports = Group = class Group {
  constructor(id){
    this.id = id;
    this.players = {};
    this.entities = {};
    this.size = 0;

    this.healthGenAmount = 1;
  }

  addEntity(entity){
    var type = entity.species;

    if(Types.isPlayer(type)) this.players[entity.id] = entity;
    this.entities[entity.id] = entity;

    this.size++;
  }

  removeEntity(id){
    var entity = this.entities[id];

    if(entity){
      if(this.players[id]) delete this.players[id];
      delete this.entities[id];
    }
  }

  generateHealth(){
    for(var i in this.entities){
      var entity = this.entities[i];
      if(entity.currentHealth)
        entity.heal(this.healthGenAmount);
    }
  }

  update(dt){
    var readyToKill = [];
    var entities = this.entities;

    for(var i in entities){
      var entity = entities[i];
      entity.update(dt);
      if(entity.readyToKill) readyToKill.push(entity);
    }

    for(var j in readyToKill){
      readyToKill[j].despawn();
    }

    readyToKill = [];
  }
}
