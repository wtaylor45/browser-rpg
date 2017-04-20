var _ = require('underscore');

var maps = {
  septoria: {json: require('../../shared/maps/septoria.json'), lowImage: 'client/assets/maps/septoria.bmp', highImage: 'client/assets/maps/septoria-high.png'}
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

    this.lowImage = new createjs.Bitmap(maps[this.name]['lowImage']);
    this.highImage = new createjs.Bitmap(maps[this.name]['highImage'])
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

    if(this.checkCollisions(coords[0], coords[1])) return true;
    if(this.checkCollisions(coords[0], coords[2])) return true;
    if(this.checkCollisions(coords[1], coords[3])) return true;
    if(this.checkCollisions(coords[2], coords[3])) return true;

    return false;
  }

  checkCollisions(pos1, pos2){
    var x1 = pos1[0],
        x2 = pos2[0],
        y1 = pos1[1],
        y2 = pos2[1];

    while(x1 < x2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0) return true
      x1 += this.tileWidth;
    }

    while(y1 <= y2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0) return true
      y1 += this.tileHeight;
    }

    return false;
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
