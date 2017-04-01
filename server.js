/**
 * @author  Will Taylor
 * The main file to start up and handle the web server, connections, etc.
 */

// Require the needed Nodejs modules
var express = require('express');
var app = express();
var http = require('http').Server(app);
var GameServer = require('./server/js/gameserver.js');
var io = require('socket.io')(http);
var uuidV1 = require('uuid/v1');

// Declare which port the server will listen on
const PORT = 2000;

// When user loads default URL, send them the index
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'))

// Begin listening on given port
http.listen(PORT);
console.log(':: EXPRESS :: Now listening on port', PORT + '...');
console.log('-------------------------------------------')

// Start the game server
var gameserver = new GameServer();

// Initialize the list of connections
global.SOCKET_LIST = {}

// Handle connection from a new client
io.sockets.on('connection', function(socket){

  // Generate a unique ID for this connection
  socket.id = uuidV1();
  global.SOCKET_LIST[socket.id] = socket;

  // Send connection to game server
  gameserver.onConnection(socket);

  // Handle disconnection from this client
  socket.on('disconnect', function(){
    gameserver.onDisconnect(socket);
  });

  // Handle messages from client
  socket.on('message', function(message){
    gameserver.onMessage(message);
  });
});
