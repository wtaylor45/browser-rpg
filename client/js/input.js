/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = 1;
var UP = 0;

Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.vector.y = -1 * val;
      break;
    case 83:
      state.vector.y = val
      break;
  }
}

Input.getMovementVector = function(){
  return Input.getState().vector;
}

Input.baseState = function(){
  return {
    vector: {x: 0, y: 0}
  }
}

Input.getState = function(){
  return STATE;
}

Input.reset = function(){
  STATE = Input.baseState;
}

Input.init = function(){
  STATE = Input.baseState();

  $(document).keydown(function(event){
    Input.onKeyEvent(event.keyCode, DOWN);
  });

  $(document).keyup(function(event){
    Input.onKeyEvent(event.keyCode, UP);
  });
}
