/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = true;
var UP = false;

/**
 * Update the state of the given key to the given value (UP/DOWN)
 * @param  {number} keyCode The keycode of the key that triggered the event
 * @param  {boolean} val    Wether the key is up or down (false/true)
 */
Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.up = val;
      break;
    case 83: // down
      state.down = val;
      break;
    case 65: // left
      state.left = val;
      break;
    case 68: // right
      state.right = val;
      break;
  }
}

/**
 * Get the movement vector based on the current state of input
 * @return {Object}   The movement vector
 */
Input.getMovementVector = function(){
  state = Input.getState();
  vector = {x: 0, y: 0};

  if(state.up) vector.y = -1;
  else if(state.down) vector.y = 1;
  if(state.left) vector.x = -1;
  else if(state.right) vector.x = 1;

  return vector;
}

/**
 * The default way that the input state starts
 * @return {[type]} [description]
 */
Input.baseState = function(){
  return {
    up: false,
    down: false,
    left: false,
    right: false
  }
}

/**
 * Get the current input state
 * @return {Object} the current input state
 */
Input.getState = function(){
  return STATE;
}

/**
 * Reset the current input state
 */
Input.reset = function(){
  STATE = Input.baseState();
}

/**
 * Initialize the input state, start listening for key events
 */
Input.init = function(){
  STATE = Input.baseState();

  document.onkeydown = function(event){
    console.log('down')
    Input.onKeyEvent(event.keyCode, DOWN);
  }

  document.onkeyup = function(event){
    Input.onKeyEvent(event.keyCode, UP);
  }
}
