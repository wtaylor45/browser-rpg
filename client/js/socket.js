/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

module.exports = Socket = {};

var socket = io();

Socket.emit = function(type, data){
  socket.emit(type, data);
}

Socket.on = function(evnt, callback){
  socket.on(evnt, function(data){
    callback(data);
  });
}
