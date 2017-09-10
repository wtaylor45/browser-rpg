var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    Types = require('../../shared/js/types');

module.exports = Map = class Map{
  constructor(name, collisionLayer){
    this.isLoaded = false;
    this.name = name;

    this.entities = {};

    this.loadMap(Map.mapData[name]);
  }

  loadMap(map){
    this.json = map;
    if(!this.json) return;
    var collisionLayer = this.getLayerWithProperty('collision');
    var collisionTiles = this.getTilesetWithProp('properties');
    this.collisionData = collisionLayer ? collisionLayer.data : [];
    this.collisionId = collisionTiles ? this.getTileIdWithProperty('collision', collisionTiles) : -1;
    this.doorId = collisionTiles ? this.getTileIdWithProperty('door', collisionTiles) : -1;
    this.tileWidth = map.tilewidth;
    this.tileHeight = map.tileheight;
    this.width = this.tileWidth*map.width;
    this.height = this.tileHeight*map.height;

    this.doors = this.loadDoors();
    this.entrances = this.loadEntrances();
    this.npcs = this.loadNpcs();

    this.loaded();
  }

  onLoad(callback){
    this.loadcallback = callback;
  }

  loaded(){
    if(this.loadcallback)
      this.loadcallback(this);
  }

  loadDoors(){
    var doorLayer = this.getLayerByName("doors").objects;

    var doors = [];

    for(var i in doorLayer){
      var door = doorLayer[i];
      var doorInfo = door.name.split('_');
      doors[i] = {
        map: doorInfo[0],
        entrance: doorInfo[1],
        x1: door.x,
        y1: door.y,
        x2: door.x + door.width,
        y2: door.y + door.height,
      }
    }

    return doors
  }

  loadEntrances(){
    var entrances = {};

    var entranceObjects = this.getLayerByName('entrances').objects;
    for(var i in entranceObjects){
      var entrance = entranceObjects[i];
      entrances[entrance.name] = {x: entrance.x, y: entrance.y};
    }

    return entrances;
  }

  loadNpcs(){
    var npcs = [];

    var objects = this.getLayerByName('npcs').objects;
    for(var i in objects){
      var npc = objects[i];
      npcs.push({species: Types.Entities.MAN, x: npc.x, y: npc.y});
    }

    return npcs;
  }

  getLayerByName(name){
    if(!this.json) return;
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i];
      }
    }
    console.log('Layer', name, 'not found');
    return false;
  }

  worldPosToTileIndex(x, y){
    var tileX = Math.floor(x/this.tileWidth);
    var tileY = Math.floor(y/this.tileHeight);

    return tileX + tileY * (this.height/this.tileHeight);
  }

  isDoor(id){
    if(this.doorId >= 0)
      return id == this.doorId;
  }

  isColliding(coords){
    var self = this;

    var collision = this.checkCollisions(coords[0], coords[1]);
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[0], coords[2]);
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[1], coords[3])
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[2], coords[3])
    if(collision >= 0) return collision;

    return -1;
  }

  checkCollisions(pos1, pos2){
    var x1 = pos1[0],
        x2 = pos2[0],
        y1 = pos1[1],
        y2 = pos2[1];

    while(x1 < x2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.isDoor(this.collisionData[index])){
          return Types.Collisions.DOOR;
        }
        return Types.Collisions.WALL;
      }
      x1 += this.tileWidth;
    }

    while(y1 <= y2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] == this.collisionId){
        if(this.isDoor(this.collisionData[index])){
          return Types.Collisions.DOOR;
        }
        return Types.Collisions.WALL;
      }
      y1 += this.tileWidth;
    }

    return -1;
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

  whichDoor(x, y){
    for(var i in this.doors){
      var dLeftX = this.doors[i].x1,
          dTopY = this.doors[i].y1,
          dRightX = this.doors[i].x2,
          dBottomY = this.doors[i].y2;

      if(x >= dLeftX && x <= dRightX){
        if(y >= dTopY && y <= dBottomY){
          return [this.doors[i].map, this.doors[i].entrance];
        }
      }
    }
  }

  getEntrancePosition(id){
    var entrance = this.entrances[id];
    return [entrance.x, entrance.y];
  }

  getTilesetProperties(tileset){
    return tile;
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

  layerToAStarGrid(layerName){
    var layer = this.getLayerByName(layerName);
    var grid = [];

    for(var i=0;i<layer.height;i++){
      var row = [];
      for(var j=0;j<layer.width;j++){
        var value = layer.data[layer.height*i+j] > 0 ? 0 : 1;
        row.push(value);
      }
      grid.push(row);
    }

    return grid;
  }
}

Map.mapData = {
  septoria: require('../../shared/maps/septoria.json'),
  map0: require('../../shared/maps/map0.json')
}
