import {entity} from "./entity.js";


export const health_component = (() => {

  class HealthComponent extends entity.Component {
    constructor(params) {
      super();
      this._health = params.health;
      this._maxHealth = params.maxHealth;
      this._params = params;
    }

    InitComponent() {
      this._RegisterHandler('health.damage', (m) => this._OnDamage(m));
    }

    IsAlive() {
      return this._health > 0;
    }

    _OnDeath(attacker) {
      this.Broadcast({
          topic: 'health.death',
          attacker: attacker,
      });
    }

    _OnDamage(msg) {
      this._health = Math.max(0.0, this._health - msg.value);
      if (this._health == 0) {
        this._OnDeath(msg.attacker);
      }

      this.Broadcast({
        topic: 'health.update',
        health: this._health,
        maxHealth: this._maxHealth,
      });

    }
  };

  return {
    HealthComponent: HealthComponent,
  };

})();