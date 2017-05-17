var Types = require('../../shared/js/types'),
    _ = require('underscore');

module.exports = Group = class Group {
  constructor(id){
    this.id = id;
    this.players = {};
    this.projectiles = {};
    this.npcs = {};
    this.mobs = {};
    this.items = {};

    this.size = 0;
  }

  addEntity(entity){
    var type = entity.species;

    switch(Types.getGenus(type)){
      case "player":
        this.addPlayer(entity);
        break;
      case "projectile":
        this.addProjectile(entity);
        break;
      case "character":
        this.addCharacter(entity);
        break;
      case "item":
        this.addItem(entity);
        break;
      case "mob":
        this.addMob(entity);
        break;
    }
  }

  addPlayer(entity){
    this.players[entity.id] = entity;
    this.size++;
    entity.map = this.id;
  }

  addCharacter(entity){
    this.npcs[entity.id] = entity;
    this.size++;
    entity.map = this.id;
  }

  addProjectile(entity){
    this.projectiles[entity.id] = entity;
    this.size++;
    entity.map = this.id;
  }

  addItem(entity){
    this.items[entity.id] = entity;
    this.size++;
    entity.map = this.id;
  }

  addMob(entity){
    this.mobs[entity.id] = entity;
    this.size++;
    entity.map = this.id;
  }

  removeEntity(id){
    for(var i in this.players){
      if(this.players[i]){
        delete this.players[i];
        this.size--;
        return;
      }
    }
    for(var i in this.npcs){
      if(this.npcs[i]){
        delete this.npcs[i];
        this.size--;
        return;
      }
    }
    for(var i in this.mobs){
      if(this.mobs[i]){
        delete this.mobs[i];
        this.size--;
        return;
      }
    }
    for(var i in this.projectiles){
      if(this.projectiles[i]){
        delete this.projectiles[i];
        this.size--;
        return;
      }
    }
    for(var i in this.items){
      if(this.items[i]){
        delete this.items[i];
        this.size--;
        return;
      }
    }
  }

  update(dt){
    var readyToKill = [];
    var entities = this.getAllEntities();

    for(var i in entities){
      var entity = entities[i];
      entity.update(dt);
      if(entity.readyToKill) readyToKill.push(i);
    }

    for(var j in readyToKill){
      this.removeEntity(readyToKill[j]);
    }
  }

  getAllEntities(){
    return Object.assign({}, this.players, this.npcs, this.mobs, this.projectiles, this.items);
  }
}
