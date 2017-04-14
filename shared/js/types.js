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
    WHO: 6
  },

  Entities: {
    PLAYER: 0
  },

  Directions: {
    UP: 1,
    DOWN: 0,
    LEFT: 3,
    RIGHT: 2
  }
}

var speciesList = {
  player: [Types.Entities.PLAYER, "player"],

  getGenus: function(species){
    return speciesList[species][1];
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
