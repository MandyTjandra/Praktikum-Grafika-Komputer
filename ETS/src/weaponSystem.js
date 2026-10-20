// ============================================================================
// WEAPON SYSTEM - SISTEM ARSENAL SENJATA, UPGRADE & POWER-UP
// ============================================================================

import * as THREE from 'three';
import { TURRET_SKINS } from './turret.js';

export const WEAPONS = {
  1: { name: 'Laser',   color: 0x38bdf8, damage: 1.5, cooldown: 160, aoe: 0,   pierce: false, sound: 'shoot_laser',   maxAmmo: Infinity },
  2: { name: 'Missile', color: 0xf97316, damage: 4.5, cooldown: 620, aoe: 8.5, pierce: false, sound: 'shoot_missile', maxAmmo: 7 },
  3: { name: 'Railgun', color: 0xa855f7, damage: 7.0, cooldown: 840, aoe: 0,   pierce: true,  sound: 'shoot_railgun', maxAmmo: 3 }
};

export class WeaponSystem {
  constructor(env, turret, vfx, meteorMgr) {
    this.env = env;
    this.turret = turret;
    this.vfx = vfx;
    this.meteorMgr = meteorMgr;

    this.currentWeapon = 1;
    this.lastShotTime = 0;
  }

  setWeapon(wId, onUpdateHUD) {
    this.currentWeapon = wId;
    if (onUpdateHUD) onUpdateHUD();
  }

  shoot(raycaster, mouse, aimTarget, state, callbacks) {
    // callbacks: onUpdateHUD, onIncrementCombo, onResetCombo, onSaveHighScore
    if (this.currentWeapon !== 1) {
      if (state.reloading[this.currentWeapon]) {
        this.vfx.playSound('reload');
        return;
      }

      if (state.ammo[this.currentWeapon] <= 0) {
        this.reload(this.currentWeapon, state, callbacks.onUpdateHUD);
        return;
      }
    }

    const now = performance.now();
    const wpn = WEAPONS[this.currentWeapon];
    const effectiveCooldown = wpn.cooldown * Math.pow(0.86, state.rateLevel - 1);
    if (now - this.lastShotTime < effectiveCooldown) return;
    this.lastShotTime = now;

    // Kurangi amunisi untuk senjata terbatas
    if (this.currentWeapon !== 1) {
      state.ammo[this.currentWeapon]--;
    }
    this.turret.triggerRecoil();
    this.vfx.playSound(wpn.sound);

    raycaster.setFromCamera(mouse, this.env.camera);
    const hits = raycaster.intersectObjects(this.meteorMgr.meteors, false);
    const muzzlePos = this.turret.getMuzzleWorldPosition();
    const beamColor = this.currentWeapon === 1 ? TURRET_SKINS[this.turret.skinIndex].beam : wpn.color;
    const dmgMultiplier = 1 + (state.dmgLevel - 1) * 0.3;

    if (this.currentWeapon === 2) {
      // [SENJATA 2: PELURU KENDALI MISSILE AOE]
      const targetPos = hits.length > 0 ? hits[0].point : (aimTarget.clone() || new THREE.Vector3(0, 10, -20));
      this.vfx.createMissile(muzzlePos, targetPos, (impactPos) => {
        this.vfx.createExplosion(impactPos, 0xf97316, 32, 18);
        this.vfx.playSound('explosion');
        this.vfx.triggerScreenShake(0.7);

        this.meteorMgr.meteors.forEach((m) => {
          if (m.position.distanceTo(impactPos) <= wpn.aoe) {
            this.applyDamage(m, wpn.damage * dmgMultiplier, 0, beamColor, state, callbacks);
          }
        });
        this.checkDestroyedMeteors(state, callbacks);
      });

      if (hits.length > 0) callbacks.onIncrementCombo();
      else callbacks.onResetCombo();

    } else if (this.currentWeapon === 3) {
      // [SENJATA 3: RAILGUN PIERCE SEJAJAR]
      const endPoint = aimTarget.clone() || new THREE.Vector3(0, 10, -40);
      this.vfx.createBeam(muzzlePos, endPoint, beamColor, true);
      this.vfx.triggerScreenShake(0.5);

      if (hits.length > 0) {
        hits.forEach((h) => {
          this.applyDamage(h.object, wpn.damage * dmgMultiplier, 0, beamColor, state, callbacks);
        });
        callbacks.onIncrementCombo();
      } else {
        callbacks.onResetCombo();
      }
    } else {
      // [SENJATA 1: LASER CEPAT]
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        this.vfx.createBeam(muzzlePos, hits[0].point, beamColor, false);
        this.applyDamage(hitObj, wpn.damage * dmgMultiplier, 0, beamColor, state, callbacks);
        callbacks.onIncrementCombo();
      } else {
        this.vfx.createBeam(muzzlePos, aimTarget, beamColor, false);
        callbacks.onResetCombo();
      }
    }

    if (callbacks.onUpdateHUD) callbacks.onUpdateHUD();
  }

  reload(targetWeapon = this.currentWeapon, state, onUpdateHUD) {
    if (targetWeapon === 1) {
      let triggered = false;
      if (state.ammo[2] < state.maxAmmo[2] && !state.reloading[2]) {
        this.startReload(2, state);
        triggered = true;
      }
      if (state.ammo[3] < state.maxAmmo[3] && !state.reloading[3]) {
        this.startReload(3, state);
        triggered = true;
      }
      if (triggered) {
        this.vfx.playSound('reload');
        if (onUpdateHUD) onUpdateHUD();
      }
      return;
    }

    if (state.ammo[targetWeapon] < state.maxAmmo[targetWeapon] && !state.reloading[targetWeapon]) {
      this.startReload(targetWeapon, state);
      this.vfx.playSound('reload');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  startReload(wpnId, state) {
    state.reloading[wpnId] = true;
    state.reloadTimers[wpnId] = state.reloadDurations[wpnId];
  }

  applyDamage(meteor, dmg, aoe, color, state, callbacks) {
    meteor.userData.hp -= dmg;
    meteor.userData.flashTime = 0.08;
    meteor.material.emissive.setHex(0xffffff);

    this.vfx.createExplosion(meteor.position, color, 8, 8);

    if (aoe > 0) {
      this.meteorMgr.meteors.forEach((other) => {
        if (other !== meteor && other.position.distanceTo(meteor.position) <= aoe) {
          other.userData.hp -= dmg * 0.75;
        }
      });
    }
    this.checkDestroyedMeteors(state, callbacks);
  }

  checkDestroyedMeteors(state, callbacks) {
    for (let i = this.meteorMgr.meteors.length - 1; i >= 0; i--) {
      const m = this.meteorMgr.meteors[i];
      if (m.userData.hp <= 0) {
        const isBoss = m.userData.type === 'boss';
        this.vfx.createExplosion(m.position, isBoss ? 0xa855f7 : 0xf97316, isBoss ? 60 : 25, isBoss ? 24 : 16);
        this.vfx.playSound('explosion');

        if (isBoss) {
          this.vfx.triggerScreenShake(1.5);
        }

        if (m.userData.type === 'cluster') {
          this.meteorMgr.spawnClusterShards(m.position);
        }

        const mult = state.doubleScoreTimer > 0 ? 2 : 1;
        state.score += m.userData.score * state.combo * mult;
        state.coins += m.userData.coins;

        if (callbacks.onSaveHighScore) callbacks.onSaveHighScore(state.score);

        this.env.scene.remove(m);
        this.meteorMgr.meteors.splice(i, 1);
      }
    }
    if (callbacks.onUpdateHUD) callbacks.onUpdateHUD();
  }

  // --- UPGRADE SYSTEM ---
  upgradeDamage(state, onUpdateHUD) {
    const cost = state.dmgLevel * 50;
    if (state.coins >= cost) {
      state.coins -= cost;
      state.dmgLevel++;
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  upgradeFireRate(state, onUpdateHUD) {
    const cost = state.rateLevel * 50;
    if (state.coins >= cost) {
      state.coins -= cost;
      state.rateLevel++;
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  upgradeAmmoCap(state, onUpdateHUD) {
    const cost = state.ammoLevel * 40;
    if (state.coins >= cost) {
      state.coins -= cost;
      state.ammoLevel++;
      state.maxAmmo[2] += 2;
      state.maxAmmo[3] += 1;
      state.ammo[2] = state.maxAmmo[2];
      state.ammo[3] = state.maxAmmo[3];
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  upgradeRotSpeed(state, onUpdateHUD) {
    const cost = state.rotLevel * 40;
    if (state.coins >= cost) {
      state.coins -= cost;
      state.rotLevel++;
      this.turret.rotationSpeed += 3.0;
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  // --- POWER-UP SYSTEM ---
  activateShield(state, onUpdateHUD) {
    if (state.coins >= 80 && !state.shieldActive) {
      state.coins -= 80;
      state.shieldActive = true;
      this.env.shieldDome.visible = true;
      this.vfx.playSound('shield');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  activateEMP(state, callbacks) {
    if (state.coins >= 120 && this.meteorMgr.meteors.length > 0) {
      state.coins -= 120;
      this.vfx.triggerScreenShake(1.3);
      this.vfx.playSound('emp');
      this.meteorMgr.meteors.forEach((m) => { m.userData.hp = 0; });
      this.checkDestroyedMeteors(state, callbacks);
    }
  }

  activateTimeSlow(state, onUpdateHUD) {
    if (state.coins >= 70) {
      state.coins -= 70;
      state.timeSlowTimer = 6.0;
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }

  activateDoubleScore(state, onUpdateHUD) {
    if (state.coins >= 60) {
      state.coins -= 60;
      state.doubleScoreTimer = 8.0;
      this.vfx.playSound('powerup');
      if (onUpdateHUD) onUpdateHUD();
    }
  }
}
