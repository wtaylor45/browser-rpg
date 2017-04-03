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
  this.collectMail = function(object){
    // TODO: Find a use for this :(
  }

  this.sendMail = function(mail){
    // Send mail
    for(var i in this.server.players){
      var socket = global.SOCKET_LIST[i];
      socket.emit('update', mail);
    }
  }
}
