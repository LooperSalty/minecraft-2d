import { MobType, MOB_DATA, BlockType, BLOCK_DATA, ItemType, ItemStack, TILE_SIZE } from '../constants';

export interface EndCrystal {
  x: number; y: number;
  alive: boolean;
  pillarHeight: number;
}

export enum DragonPhase {
  CIRCLE,
  CHARGE,
  BREATH,
  PERCH,
  DYING,
}

interface BreathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const DRAGON_MAX_HEALTH = 200;
const CRYSTAL_COUNT = 10;
const CRYSTAL_HEAL_RATE = 1;
const CIRCLE_DURATION_MIN = 10;
const CIRCLE_DURATION_MAX = 15;
const CHARGE_SPEED = TILE_SIZE * 12;
const CHARGE_DAMAGE = 10;
const BREATH_DAMAGE = 3;
const PERCH_DURATION = 5;
const DEATH_DURATION = 5;
const BREATH_PARTICLE_SPEED = TILE_SIZE * 4;
const BREATH_PARTICLE_LIFE = 2;
const ARENA_RADIUS = 40 * TILE_SIZE;
const CRYSTAL_EXPLOSION_RADIUS = 6 * TILE_SIZE;
const XP_REWARD = 12000;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export class EnderDragon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  alive: boolean;

  phase: DragonPhase;
  phaseTimer: number;
  circleAngle: number;
  circleRadius: number;
  centerX: number;
  centerY: number;

  crystals: EndCrystal[];

  hurtTimer: number;
  deathTimer: number;
  breathParticles: BreathParticle[];

  private chargeTargetX: number;
  private chargeTargetY: number;

  constructor(centerX: number, centerY: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.x = centerX;
    this.y = centerY - 20 * TILE_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.width = TILE_SIZE * 6;
    this.height = TILE_SIZE * 3;
    this.health = DRAGON_MAX_HEALTH;
    this.maxHealth = DRAGON_MAX_HEALTH;
    this.alive = true;

    this.phase = DragonPhase.CIRCLE;
    this.phaseTimer = randomRange(CIRCLE_DURATION_MIN, CIRCLE_DURATION_MAX);
    this.circleAngle = 0;
    this.circleRadius = 25 * TILE_SIZE;

    this.crystals = this.initCrystals();

    this.hurtTimer = 0;
    this.deathTimer = 0;
    this.breathParticles = [];

    this.chargeTargetX = centerX;
    this.chargeTargetY = centerY;
  }

  initCrystals(): EndCrystal[] {
    const crystals: EndCrystal[] = [];
    for (let i = 0; i < CRYSTAL_COUNT; i++) {
      const angle = (i / CRYSTAL_COUNT) * Math.PI * 2;
      const radius = 30 * TILE_SIZE;
      const pillarHeight = Math.floor(randomRange(5, 15));
      crystals.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY - pillarHeight * TILE_SIZE,
        alive: true,
        pillarHeight,
      });
    }
    return crystals;
  }

  update(dt: number, playerX: number, playerY: number): void {
    if (!this.alive) return;

    this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    // Heal from crystals
    const healRate = this.getHealRate();
    if (healRate > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + healRate * dt);
    }

    // Update breath particles
    this.breathParticles = this.breathParticles
      .map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - dt,
      }))
      .filter(p => p.life > 0);

    this.phaseTimer -= dt;

    switch (this.phase) {
      case DragonPhase.CIRCLE:
        this.updateCircle(dt, playerX, playerY);
        break;
      case DragonPhase.CHARGE:
        this.updateCharge(dt, playerX, playerY);
        break;
      case DragonPhase.BREATH:
        this.updateBreath(dt, playerX, playerY);
        break;
      case DragonPhase.PERCH:
        this.updatePerch(dt);
        break;
      case DragonPhase.DYING:
        this.updateDying(dt);
        break;
    }
  }

  private updateCircle(dt: number, playerX: number, playerY: number): void {
    const circleSpeed = 0.4;
    this.circleAngle += circleSpeed * dt;

    const targetX = this.centerX + Math.cos(this.circleAngle) * this.circleRadius;
    const targetY = this.centerY - 15 * TILE_SIZE + Math.sin(this.circleAngle * 0.5) * 5 * TILE_SIZE;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const moveSpeed = TILE_SIZE * 6;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      this.vx = (dx / dist) * moveSpeed;
      this.vy = (dy / dist) * moveSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.phaseTimer <= 0) {
      const roll = Math.random();
      if (roll < 0.4) {
        this.phase = DragonPhase.CHARGE;
        this.phaseTimer = 3;
        this.chargeTargetX = playerX;
        this.chargeTargetY = playerY;
      } else if (roll < 0.7) {
        this.phase = DragonPhase.BREATH;
        this.phaseTimer = 4;
      } else {
        this.phase = DragonPhase.PERCH;
        this.phaseTimer = PERCH_DURATION;
      }
    }
  }

  private updateCharge(dt: number, _playerX: number, _playerY: number): void {
    const dx = this.chargeTargetX - this.x;
    const dy = this.chargeTargetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > TILE_SIZE * 2) {
      this.vx = (dx / dist) * CHARGE_SPEED;
      this.vy = (dy / dist) * CHARGE_SPEED;

      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else {
      this.transitionToCircle();
    }

    if (this.phaseTimer <= 0) {
      this.transitionToCircle();
    }
  }

  private updateBreath(dt: number, playerX: number, playerY: number): void {
    const hoverX = this.centerX;
    const hoverY = this.centerY - 12 * TILE_SIZE;

    const dx = hoverX - this.x;
    const dy = hoverY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = TILE_SIZE * 4;

    if (dist > TILE_SIZE) {
      this.vx = (dx / dist) * moveSpeed;
      this.vy = (dy / dist) * moveSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Spawn breath particles aimed toward the player
    if (Math.random() < 0.3) {
      const pdx = playerX - this.x;
      const pdy = playerY - this.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      const spread = 0.3;

      if (pDist > 1) {
        this.breathParticles = [
          ...this.breathParticles,
          {
            x: this.x,
            y: this.y + this.height / 2,
            vx: (pdx / pDist) * BREATH_PARTICLE_SPEED + (Math.random() - 0.5) * spread * BREATH_PARTICLE_SPEED,
            vy: (pdy / pDist) * BREATH_PARTICLE_SPEED + (Math.random() - 0.5) * spread * BREATH_PARTICLE_SPEED,
            life: BREATH_PARTICLE_LIFE,
          },
        ];
      }
    }

    if (this.phaseTimer <= 0) {
      this.transitionToCircle();
    }
  }

  private updatePerch(dt: number): void {
    const perchX = this.centerX;
    const perchY = this.centerY - 2 * TILE_SIZE;

    const dx = perchX - this.x;
    const dy = perchY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = TILE_SIZE * 5;

    if (dist > TILE_SIZE * 0.5) {
      this.vx = (dx / dist) * moveSpeed;
      this.vy = (dy / dist) * moveSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.x = perchX;
      this.y = perchY;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.phaseTimer <= 0) {
      this.transitionToCircle();
    }
  }

  private updateDying(dt: number): void {
    this.vy += TILE_SIZE * 0.5 * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.x += this.vx * dt;

    this.deathTimer -= dt;
    if (this.deathTimer <= 0) {
      this.alive = false;
    }
  }

  private transitionToCircle(): void {
    this.phase = DragonPhase.CIRCLE;
    this.phaseTimer = randomRange(CIRCLE_DURATION_MIN, CIRCLE_DURATION_MAX);
  }

  takeDamage(amount: number): void {
    if (!this.alive || this.phase === DragonPhase.DYING) return;

    this.health -= amount;
    this.hurtTimer = 0.4;

    if (this.health <= 0) {
      this.health = 0;
      this.phase = DragonPhase.DYING;
      this.deathTimer = DEATH_DURATION;
      this.phaseTimer = DEATH_DURATION;
      this.vx = 0;
      this.vy = 0;
      this.breathParticles = [];
    }
  }

  destroyCrystal(index: number): void {
    if (index < 0 || index >= this.crystals.length) return;

    const crystal = this.crystals[index];
    if (!crystal.alive) return;

    this.crystals = this.crystals.map((c, i) =>
      i === index ? { ...c, alive: false } : c
    );
  }

  isNearCrystal(x: number, y: number): number {
    for (let i = 0; i < this.crystals.length; i++) {
      const crystal = this.crystals[i];
      if (!crystal.alive) continue;

      const dist = distanceBetween(x, y, crystal.x, crystal.y);
      if (dist < TILE_SIZE * 2) {
        return i;
      }
    }
    return -1;
  }

  getHealRate(): number {
    return this.crystals.filter(c => c.alive).length * CRYSTAL_HEAL_RATE;
  }

  getBossBarPercent(): number {
    return this.health / this.maxHealth;
  }

  isDying(): boolean {
    return this.phase === DragonPhase.DYING;
  }

  isDefeated(): boolean {
    return this.phase === DragonPhase.DYING && this.deathTimer <= 0;
  }

  getChargeDamage(): number {
    return CHARGE_DAMAGE;
  }

  getBreathDamage(): number {
    return BREATH_DAMAGE;
  }

  getXPReward(): number {
    return XP_REWARD;
  }

  getBreathParticlesNear(x: number, y: number, radius: number): BreathParticle[] {
    return this.breathParticles.filter(p =>
      distanceBetween(p.x, p.y, x, y) < radius
    );
  }

  serialize(): object {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      width: this.width,
      height: this.height,
      health: this.health,
      maxHealth: this.maxHealth,
      alive: this.alive,
      phase: this.phase,
      phaseTimer: this.phaseTimer,
      circleAngle: this.circleAngle,
      circleRadius: this.circleRadius,
      centerX: this.centerX,
      centerY: this.centerY,
      crystals: this.crystals.map(c => ({
        x: c.x,
        y: c.y,
        alive: c.alive,
        pillarHeight: c.pillarHeight,
      })),
      hurtTimer: this.hurtTimer,
      deathTimer: this.deathTimer,
      breathParticles: this.breathParticles.map(p => ({
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        life: p.life,
      })),
    };
  }

  static deserialize(data: any): EnderDragon {
    if (!data) {
      return new EnderDragon(0, 70 * TILE_SIZE);
    }

    const dragon = new EnderDragon(data.centerX ?? 0, data.centerY ?? 70 * TILE_SIZE);
    dragon.x = data.x ?? dragon.x;
    dragon.y = data.y ?? dragon.y;
    dragon.vx = data.vx ?? 0;
    dragon.vy = data.vy ?? 0;
    dragon.width = data.width ?? dragon.width;
    dragon.height = data.height ?? dragon.height;
    dragon.health = data.health ?? DRAGON_MAX_HEALTH;
    dragon.maxHealth = data.maxHealth ?? DRAGON_MAX_HEALTH;
    dragon.alive = data.alive ?? true;
    dragon.phase = data.phase ?? DragonPhase.CIRCLE;
    dragon.phaseTimer = data.phaseTimer ?? randomRange(CIRCLE_DURATION_MIN, CIRCLE_DURATION_MAX);
    dragon.circleAngle = data.circleAngle ?? 0;
    dragon.circleRadius = data.circleRadius ?? 25 * TILE_SIZE;
    dragon.hurtTimer = data.hurtTimer ?? 0;
    dragon.deathTimer = data.deathTimer ?? 0;

    if (Array.isArray(data.crystals)) {
      dragon.crystals = data.crystals.map((c: any): EndCrystal => ({
        x: c.x ?? 0,
        y: c.y ?? 0,
        alive: c.alive ?? true,
        pillarHeight: c.pillarHeight ?? 10,
      }));
    }

    if (Array.isArray(data.breathParticles)) {
      dragon.breathParticles = data.breathParticles.map((p: any): BreathParticle => ({
        x: p.x ?? 0,
        y: p.y ?? 0,
        vx: p.vx ?? 0,
        vy: p.vy ?? 0,
        life: p.life ?? 0,
      }));
    }

    return dragon;
  }
}
