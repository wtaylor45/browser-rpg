module.exports = Stage = {};
var stage;

Stage.addChild = function(child){
  stage.addChild(child);
}

Stage.update = function(){
  stage.update();
}

Stage.removeAllChildren = function(){
  stage.removeAllChildren();
}

Stage.init = function(){
  stage = new createjs.Stage('canvas');
}
