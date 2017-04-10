/**
 * @author Will Taylor
 * Created on: 4/5/17
 */

 var cls = require('./lib/class');

module.exports = Entity = cls.Class.extend({
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
  init: function(id, genus, species, x, y, width, height){
    this.id = id;
    this.genus = genus;
    this.species = species;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  },

  /**
   * Get the most basic state of this entity.
   * @return {Object} This entity's state
   *
   * Meant to be called in subclasses' getState() functions
   */
  getDefaultState: function(){
    return {
      id: this.id,
      species: this.species,
      x: this.x,
      y: this.y
    }
  },

  /**
   * Return this entity's state
   * @return {Object} This entity's state
   *
   * Meant to be overriden by subclasses
   */
  getState: function(){
    return this.getDefaultState();
  },

  /**
   * Set the x and y coordiante of this entity
   * @param {number} x The y coordinate to set to
   * @param {number} y The y coordinate to set to
   */
  setPosition: function(x, y){
    this.x = x;
    this.y = y;
  }
});
