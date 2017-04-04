var depend = ['game.js', 'sprite.js', 'entity.js','player.js', 'mailbox.js', 'message.js'];

for(var i in depend){
  var src = document.createElement('script');
  src.src = 'client/js/' + depend[i];
  document.getElementsByTagName('head')[0].append(src);
  console.log(i)
}
