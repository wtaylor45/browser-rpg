/**
 * @author Will Taylor
 * Created on: 4/5/17
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types')

module.exports = Character = Entity.extend({
  /**
   * Initialize the character
   * @param  {number} id      the UUID of this character
   * @param  {string} genus   the higher level type of this character
   * @param  {number} species the specific kind of character
   * @param  {number} x       x coordinate of the character
   * @param  {number} y       y coordinate of the character
   * @param  {number} width   The width of the character
   * @param  {number} height  The height of the character
   */
  init: function(id, name, genus, species, x, y, width, height){
    // Call the Entity class constructor
    this._super(id, genus, species, x, y, width, height);

    // What direction is this character facing
    this.direction = Types.Directions.DOWN;

    // Who is currently targeting this character
    this.hostiles = {};

    // Who is this character's target
    this.target = null;

    this.name = name;
  },

  /**
   * Get this character's current state
   * @return {Object} This character's current state
   */
  getState: function(){
    var state = this.getDefaultState();

    state['direction'] = this.direction;
    if(this.map) state['map'] = this.map;
    if(this.target) state['target'] = this.target;
    if(this.name) state['name'] = this.name;

    return state;
  }
});
