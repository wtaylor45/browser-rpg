/**
 * @author Will Taylor
 * Created on: 4/5/17
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types');

module.exports = Character = class Character extends Entity {
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
  constructor(id, name, species, x, y, width, height){
    // Call the Entity class constructor
    super(id, Types.getGenus(species), species, x, y, width, height);

    // What direction is this character facing
    this.direction = Types.Directions.DOWN;

    // Who is currently targeting this character
    this.hostiles = {};

    // Who is this character's target
    this.target = null;

    this.name = name;

    this.targetBox = [x, y, x+width, y+height];
    this.hitbox = [0, Math.floor(height/2), width, height];

    this.maxSpeed = this.currentSpeed = 10;

    // How much health a character can possibly have
    this.maxHealth = 100;
    // How much health the character currently has
    this.currentHealth = 76;

    // How much attack power the player can possibly have
    this.maxAttackPower = 10;
    // How much attack power the player currently has
    this.currentAttackPower = 10;
  }

  /**
   * Get this character's current state
   * @return {Object} This character's current state
   */
  getState(){
    var state = this.getDefaultState();

    state['direction'] = this.direction;
    if(this.map) state['map'] = this.map;
    if(this.target) state['target'] = this.target;
    if(this.name) state['name'] = this.name;

    state['stats'] = this.getStats();

    console.log(state['stats'])

    return state;
  }

  /**
   * Get all the stats that are a part of the character's state
   * @return {Object} Object containing all stats and their max values
   */
  getStats(){
    return {
      currentSpeed: this.currentSpeed,
      maxSpeed: this.maxSpeed,
      currentHealth: this.currentHealth,
      maxHealth: this.maxHealth,
      currentAttackPower: this.currentAttackPower,
      maxAttackPower: this.maxAttackPower
    }
  }

  resetStats(){
    this.currentSpeed = this.maxSpeed;
    this.currentHealth = this.maxHealth;
    this.currentAttackPower = this.maxAttackPower;
  }

  /**
   * Remove the given amount of health from the current health
   * @param  {number} damage The amount of health to remove
   */
  damage(damage){
    this.currentHealth = Math.max(0, this.currentHealth-damage);

    if(this.damageCallback){
      this.damageCallback(this, damage);
    }

    if(this.currentHealth == 0){
      this.die();
    }
  }

  onDamage(callback){
    this.damageCallback = callback;
  }

  heal(amount){
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth+amount);

    if(this.healCallback){
      this.healCallback(this, amount);
    }
  }

  onHeal(callback){
    this.healCallback = callback;
  }

  die(){
    this.resetStats();

    if(this.deathCallback){
      this.deathCallback(this);
    }
  }

  onDeath(callback){
    this.deathCallback = callback;
  }

  attack(target){
    if(this.currentCooldown > 0) return;

    this.target = target.id;
    target.damage(this.currentAttackPower);
    this.facePoint(target.anchorX, target.anchorY);
    this.currentCooldown = this.COOLDOWN;
  }

  onAttack(callback){
    this.attackCallback = callback;
  }
}
