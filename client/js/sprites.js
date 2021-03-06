var _ = require('underscore'),
    paths = [
      require("../sprites/player.json"),
      require("../sprites/ogre.json"),
      require("../sprites/fire-spell.json")
    ]

module.exports = Sprites = {
  init: function(){
    var sprites = {};

    _.each(paths, function(json){
      sprites[json.id] = json;
    });

    return sprites;
  }
};
