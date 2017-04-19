var _ = require('underscore');

var maps = {
  septoria: {json: require('../../shared/maps/septoria.json'), img: 'client/assets/maps/septoria.bmp'}
}

module.exports = Map = class Map{
  constructor(name, collisionLayer){
    this.name = name;
    this.json = maps[name]['json'];
    this.collisionName = collisionLayer || 'collision';

    this.isLoaded = false;

    this.loadJSON();
  }

  loadJSON(){
    if(!this.json){
      return;
    }

    var json = this.json;

    this.img = new createjs.Bitmap(maps[this.name]['img']);

    this.collisionLayer = this.findLayerByName(this.collisionName);
    this.collisionData = this.collisionLayer.data;
    this.tileWidth = json.tilewidth;
    this.tileHeight = json.tileheight;
    this.width = this.tileWidth*json.width;
    this.height = this.tileHeight*json.height;

    this.isLoaded = true;
  }

  loadTilesets(){
    var tilesetsData = this.json.tilesets;
    var tilesets = {};
    _.each(tilesetsData, function(tileset){
      tilesets[tileset.name] = new createjs.Bitmap(tilesetsData.image);
    });

    return tilesets;
  }

  getTilesetData(name){
    for(var i in this.json.tilesets){
      var tileset = this.json.tilesets[i];
      if(tileset.name == name) return tileset;
    }
  }

  getTilesetImage(name){
    return this.tilesets[name];
  }

  findLayerByName(name){
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i];
      }
    }
  }

  worldPosToTileIndex(x, y){
    var tileX = Math.floor(x/this.tileWidth);
    var tileY = Math.floor(y/this.tileHeight);

    return tileX + tileY * (this.height/this.tileHeight);
  }

  isColliding(coords){
    var self = this;
    var collisions = false;
    _.each(coords, function(pos){
      var x = pos[0];
      var y = pos[1];
      var index = self.worldPosToTileIndex(x, y);
      if(self.collisionData[index] > 0) collisions = true;
    });

    return collisions;
  }

  nearestTilePositions(entity){
    var index = 0;

    var leftX = entity.x;
    var topY = entity.y+entity.height/2;
    var rightX = entity.x + entity.width;
    var bottomY = entity.y + entity.height;

    var corners = [];
    corners[0] = [leftX, topY];
    corners[1] = [rightX, topY];
    corners[2] = [leftX, bottomY];
    corners[3] = [rightX, bottomY];

    return corners;
  }
}
