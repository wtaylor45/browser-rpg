var _ = require('underscore'),
    Types = require('../../shared/js/types');

var maps = {
  septoria: {json: require('../../shared/maps/septoria.json'), lowImage: 'client/assets/maps/septoria.bmp', highImage: 'client/assets/maps/septoria-high.png'},
  map0: {json: require('../../shared/maps/map0.json'), lowImage: 'client/assets/maps/map0.png', highImage: 'client/assets/maps/map0-high.png'},
  test: {json: require('../../shared/maps/test.json'), lowImage: 'client/assets/maps/test.png'}
}

module.exports = Map = class Map{
  constructor(name){
    this.name = name;
    console.log(name)
    this.json = maps[name]['json'];
    this.isLoaded = false;

    this.loadJSON();
  }

  loadJSON(){
    if(!this.json){
      return;
    }

    var json = this.json;

    this.lowImage = new createjs.Bitmap(maps[this.name]['lowImage']);
    if(maps[this.name]['highImage'])
      this.highImage = new createjs.Bitmap(maps[this.name]['highImage'])

    var collisionLayer = this.getLayerWithProperty('collision');
    var collisionTiles = this.getTilesetWithProp('properties');
    this.collisionData = collisionLayer ? collisionLayer.data : [];
    this.collisionId = collisionTiles ? this.getTileIdWithProperty('collision', collisionTiles) : -1;
    this.doorId = collisionTiles ? this.getTileIdWithProperty('door', collisionTiles) : -1;

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
      if(this.collisionData[index] > 0){
        if(this.collisionData[index] == this.collisionId)
          return Types.Collisions.WALL;
        if(this.collisionData[index] == this.doorId)
          return Types.Collisions.DOOR;
      }
      x1 += this.tileWidth;
    }

    while(y1 <= y2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.collisionData[index] == this.collisionId)
          return Types.Collisions.WALL;
      }
      y1 += this.tileWidth;
    }

    return false;
  }

  nearestTilePositions(entity){
    var hitbox = entity.hitbox;

    // Use the hitbox to find the corners, 
    // get the nearest tile positions of each coord
    var leftX = Math.floor(entity.x+hitbox[0]);
    var topY = Math.floor(entity.y+hitbox[1]);
    var rightX = Math.floor(entity.x+hitbox[2])-this.tileWidth;
    var rightX = Math.ceil(rightX / this.tileWidth)*this.tileWidth;
    var bottomY = Math.floor(entity.y+hitbox[3])-this.tileHeight;
    var bottomY = Math.ceil(bottomY / this.tileHeight)*this.tileHeight;

    var corners = [];
    corners[0] = [leftX, topY];
    corners[1] = [rightX, topY];
    corners[2] = [leftX, bottomY];
    corners[3] = [rightX, bottomY];

    return corners;
  }

  getLayerWithProperty(name){
    for(var i in this.json.layers){
      var layer = this.json.layers[i];
      if(!layer.properties) continue;
      if(layer.properties[name]) return layer;
    }
  }

  getTilesetWithProp(prop){
    for(var i in this.json.tilesets){
      var tileset = this.json.tilesets[i];
      if(!tileset.properties) continue;
      if(tileset.properties[prop]) return tileset;
    }
  }

  getTileIdWithProperty(prop, tileset){
    var properties = tileset.tileproperties;

    for(var i in properties){
      if(properties[i][prop]) return parseInt(i)+tileset.firstgid;
    }

    return false;
  }
}
