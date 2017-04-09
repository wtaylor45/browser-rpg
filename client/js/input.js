/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = true;
var UP = false;

Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.up = val;
      break;
    case 83:
      state.down = val;
      break;
    case 65:
      state.left = val;
      break;
    case 68:
      state.right = val;
      break;
  }
}

Input.getMovementVector = function(){
  state = Input.getState();
  vector = {x: 0, y: 0};

  if(state.up) vector.y = -1;
  else if(state.down) vector.y = 1;
  if(state.left) vector.x = -1;
  else if(state.right) vector.x = 1;

  return vector;
}

Input.baseState = function(){
  return {
    up: false,
    down: false,
    left: false,
    right: false
  }
}

Input.getState = function(){
  return STATE;
}

Input.reset = function(){
  STATE = Input.baseState();
}

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
