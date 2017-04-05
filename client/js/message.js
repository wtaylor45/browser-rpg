/**
 * @author Will Taylor
 *
 * Message Format:
 * {
 *   'type': [type],
 *   'data': {
 *     [data]
 *   }
 * }
 */

class Message{
  constructor(type, data){
    this.message = {
      'type': type,
      'data': data
    }
  }

  send(){
    socket.emit('message', this.message);
  }
}

Message.MessageType = {
  LOGIN: 'lgin',
  LOGOUT: 'lgout',
  MOVE: 'move',
  ATTACK: 'atk'
}
