/**
 * @author Will Taylor
 * Created on: 4/6/17
 *
 * Heavily based on Mozilla's BrowserQuest
 */

/**
 * Enumeration of enumerations.
 * Contains details such as message types, directions, etc.
 * @type {Object}
 */
Types = {
  Messages: {
    LOGIN: 0,
    LOGOUT: 1,
    MOVE: 2,
    SPAWN: 3,
    ATTACK: 4,
    LIST: 5,
    WHO: 6,
    DESPAWN: 7,
    TRANSITION: 8,
    CHAT: 9,
    COMMAND: 10,
    NOTIFICATION: 11,
    ABILITY: 12
  },

  Entities: {
    PLAYER: 0,
    FIREBALL: 1
  },

  Directions: {
    UP: 1,
    DOWN: 0,
    LEFT: 3,
    RIGHT: 2
  },

  Collisions: {
    DOOR: 0,
    WALL: 1
  },

  Permissions: {
    GOD: 5,
    ADMIN: 4,
    PLEB: 3
  },


  Abilities: {
    FIREBALL: 'fireball'
  }
}

var speciesList = {
  player: [Types.Entities.PLAYER, "player"],
  fireball: [Types.Entities.FIREBALL, "projectile"],
}

var iconList = {
  fireball: 'fireball-red-1.png'
}

Types.getGenus = function(species){
  var species = Types.speciesAsString(species);
  return speciesList[species][1];
}

Types.speciesAsString = function(species){
  for(var s in speciesList) {
    if(speciesList[s][0] === species) {
        return s;
    }
  }
}

Types.isPlayer = function(species){
  return Types.getGenus(species) == "player";
}

Types.isCharacter = function(species){
  return Types.isPlayer(species);
}

Types.isProjectile = function(species){
  return Types.getGenus(species) == "projectile";
}

if(!(typeof exports === 'undefined')){
  module.exports = Types;
}

Types.abilityToIcon = function(ability){
  return 'client/assets/icons/'+iconList[ability];
}
