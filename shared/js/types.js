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
    ATTACK: 4
  },

  Entities: {
    PLAYER: 0
  },

  Directions: {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
  }
}

if(!(typeof exports === 'undefined')){
  module.exports = Types;
}
