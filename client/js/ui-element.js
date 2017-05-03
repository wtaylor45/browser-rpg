
module.exports = UIElement = class UIElement {
  constructor(section){
    this.html = "";
    this.parent = "#"+section;

    LIST.push(this);
  }
}

var LIST = UIElement.LIST = [];

UIElement.Chat = class Chat extends UIElement {
  constructor(){
    super('bottomLeft');

    this.chatText = null;
    this.chatInput = null;

    this.onResize();

    this.broadcast('Welcome to browser-rpg!')
  }

  onResize(){
    var parent = $(this.parent);

    parent.css({
      'width': $('#game-content').width()/2,
      'height': $('#game-content').height()/2
    })

    $('#chat-container').css({
      'width': (parent.width()-parent.width()/6)+"px"
      });

    console.log('resize')
  }

  broadcast(message){
    $('#chat-text').append('<b><i style="color:aqua;">'+message+'</i></b>');
  }

  addMessage(chat){
    var chatText = document.getElementById('chat-text');
    var isScrolledToBottom = chatText.scrollHeight - chatText.clientHeight <= chatText.scrollTop + 1;

    var div = document.createElement("div");
    div.append(chat);
    chatText.appendChild(div);

    if(isScrolledToBottom)
      chatText.scrollTop = chatText.scrollHeight - chatText.clientHeight;
  }
}
