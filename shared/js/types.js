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
    NOTIFICATION: 11
  },

  Entities: {
    PLAYER: 0
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
  }
}

var speciesList = {
  player: [Types.Entities.PLAYER, "player"],

  getGenus: function(species){
    return speciesList[species][1];
  }
}

Types.speciesAsString = function(species){
  for(var s in speciesList) {
    if(speciesList[s][0] === species) {
        return s;
    }
}
}

Types.isPlayer = function(species){
  return speciesList.getGenus[species] == "player";
}

Types.isCharacter = function(species){
  return Types.isPlayer(species);
}

if(!(typeof exports === 'undefined')){
  module.exports = Types;
}
