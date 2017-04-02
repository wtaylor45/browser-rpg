/**
 * @author Will Taylor
 * Contains functionality of sending updates to the clients
 */

module.exports = Mailman;

function Mailman(server){
  this.server = server;


  /**
   * Collect all the updates from players, npcs, etc. and send off to each mailbox
   */
  this.collectAndSendMail = function(){
    var mail = []

    // Collect mail
    for(var i in this.server.players){
      var player = this.server.players[i];
      mail.push({'type': 'p', 'data': player.pack()});
    }

    // Send mail
    for(var i in this.server.players){
      var socket = global.SOCKET_LIST[i];
      socket.emit('update', mail);
    }
  }
}
