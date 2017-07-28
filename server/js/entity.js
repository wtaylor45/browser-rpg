/**
 * @author Will Taylor
 * Created on: 4/5/17
 */

 var cls = require('./lib/class'),
     Map = require('./map'),
     Types = require('../../shared/js/types.js'),
     Messages = require('./message.js');

module.exports = Entity = class Entity {
  /**
   * Initialize this entity
   * @param  {number} id      the UUID of this entity
   * @param  {string} genus   the higher level type of this entity
   * @param  {number} species the specific kind of entity
   * @param  {number} x       x coordinate of the entity
   * @param  {number} y       y coordinate of the entity
   * @param  {number} width   The width of the entity
   * @param  {number} height  The height of the entity
   */
  constructor(id, genus, species, x, y, width, height){
    this.id = id;
    this.genus = genus;
    this.species = species;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.spawned = false;
    this.map = null;
    this.direction = Types.Directions.DOWN;

    this.targetBox = [x, y, x+width, y+height];
  }

  /**
   * Get the most basic state of this entity.
   * @return {Object} This entity's state
   *
   * Meant to be called in subclasses' getState() functions
   */
  getDefaultState(){
    return {
      id: this.id,
      species: this.species,
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    }
  }

  /**
   * Return this entity's state
   * @return {Object} This entity's state
   *
   * Meant to be overriden by subclasses
   */
  getState(){
    return this.getDefaultState();
  }

  spawn(){
    return new Message.Spawn(this);
  }

  despawn(){
    if(this.despawnCallback){
      this.despawnCallback(this);
    }
  }

  onMove(func){
    this.moveCallback = func;
  }

  onDespawn(callback){
    this.despawnCallback = callback;
  }

  moveTo(x, y){
    this.setPosition(x, y);
    if(this.moveCallback){
      this.moveCallback(this);
    }
  }

  /**
   * Set the x and y coordiante of this entity
   * @param {number} x The y coordinate to set to
   * @param {number} y The y coordinate to set to
   */
  setPosition(x, y){
    this.x = x;
    this.y = y;

    this.targetBox = [x, y, x+this.width, y+this.height];
  }

  update(dt){
  }

  distanceTo(x1, y1){
    var x = this.x - x1;
    var y = this.y - y1;

    return Math.sqrt(x*x + y*y);
  }
}
