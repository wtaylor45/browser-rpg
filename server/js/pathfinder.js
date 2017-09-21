var AStar = require('./lib/astar');

module.exports = Pathfinder = class Pathfinder {
    constructor(map, character){
        this.map = map;
        this.character = character;
        this.graph = new AStar.Graph(map.pathfindingGrid);
    }

    findPath(endX, endY){
      // Set up the starting tile
      var gridCol = Math.floor(this.character.x/this.map.tileWidth);
      var gridRow = Math.floor(this.character.y/this.map.tileHeight);
      var start = this.graph.grid[gridRow][gridCol];
      //console.log("Start:",gridRow,"("+this.character.y+")", gridCol,"("+this.character.x+")");
      // Set up the goal tile
      var endCol = Math.floor(endX/this.map.tileWidth);
      var endRow = Math.floor(endY/this.map.tileHeight);
      var goal = this.graph.grid[endRow][endCol];
      //console.log("Goal:",endRow,"("+endRow*this.map.tileHeight+")", endCol,"("+endCol*this.map.tileWidth+")")
      // Get the character's size type
      var sizeType = this.character.sizeType;

      // Search for the path
      var path = AStar.astar.search(this.graph, start, goal, sizeType, {closest: true});

      return this.pathToWorldCoords(path);
    }

    pathToWorldCoords(path){
        var newPath = [];

        for(var i in path){
            var entry = [path[i].x*this.map.tileWidth, path[i].y*this.map.tileHeight];
            newPath.push(entry);
        }

        return newPath;
    }
}
