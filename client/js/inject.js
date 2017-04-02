var depend = ['mailbox.js', 'message.js', 'player.js'];

for(var i in depend){
  var src = document.createElement('script');
  src.src = 'client/js/' + depend[i];
  document.getElementsByTagName('head')[0].append(src);
}
