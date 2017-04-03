/**
 * @author Will Taylor
 * Contains functionality of recieving updates from the server
 */

 socket.on('update', function(mail){
   if(game)
     game.mail = mail;
 });
