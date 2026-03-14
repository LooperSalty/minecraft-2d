import { MobType, MobData, MOB_DATA, BlockType, BLOCK_DATA, Dimension, ItemType, ItemStack, GRAVITY, TILE_SIZE, CHUNK_WIDTH, MAX_LIGHT } from '../constants';

export interface Mob {
  type: MobType;
  x: number; y: number;
  vx: number; vy: number;
  width: number; height: number;
  onGround: boolean;
  health: number;
  maxHealth: number;
  damage: number;
  hostile: boolean;
  facing: number;

  aiTimer: number;
  aiState: 'idle' | 'wander' | 'chase' | 'flee' | 'attack' | 'explode';
  target: { x: number; y: number } | null;

  hurtTimer: number;
  attackTimer: number;
  deathTimer: number;
  alive: boolean;

  fuseTimer: number;
  shootTimer: number;
  aggravated: boolean;
}

const SPAWN_MIN_DISTANCE = 24;
const SPAWN_MAX_DISTANCE = 64;
const HOSTILE_LIGHT_THRESHOLD = 7;
const CHASE_RANGE = 16;
const SKELETON_SHOOT_RANGE = 15;
const SKELETON_SHOOT_COOLDOWN = 2.0;
const CREEPER_FUSE_RANGE = 3;
const CREEPER_FUSE_DURATION = 1.5;
const CREEPER_EXPLOSION_RADIUS = 3;
const ATTACK_COOLDOWN = 1.0;
const FLEE_DURATION = 5.0;
const KNOCKBACK_FORCE = 5;
const ENDERMAN_TELEPORT_RANGE = 8;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function tileAt(px: number): number {
  return Math.floor(px);
}

function isSolid(blockType: BlockType): boolean {
  const data = BLOCK_DATA[blockType];
  return data != null && data.solid === true;
}

function createDefaultMob(): Mob {
  return {
    type: MobType.ZOMBIE,
    x: 0, y: 0,
    vx: 0, vy: 0,
    width: 0.8, height: 1.8,
    onGround: false,
    health: 20,
    maxHealth: 20,
    damage: 3,
    hostile: true,
    facing: 1,
    aiTimer: 0,
    aiState: 'idle',
    target: null,
    hurtTimer: 0,
    attackTimer: 0,
    deathTimer: 0,
    alive: true,
    fuseTimer: 0,
    shootTimer: 0,
    aggravated: false,
  };
}

export class MobManager {
  mobs: Mob[];
  spawnTimer: number;
  maxMobs: number;

  constructor() {
    this.mobs = [];
    this.spawnTimer = 0;
    this.maxMobs = 10;
  }

  createMob(type: MobType, x: number, y: number): Mob {
    const data: MobData = MOB_DATA[type];
    const mob: Mob = {
      ...createDefaultMob(),
      type,
      x,
      y,
      health: data.health,
      maxHealth: data.health,
      damage: data.damage,
      hostile: data.hostile,
      width: data.width ?? 0.8,
      height: data.height ?? 1.8,
      facing: Math.random() < 0.5 ? -1 : 1,
      aiTimer: randomRange(2, 4),
      aiState: 'idle',
    };

    if (type === MobType.GHAST || type === MobType.BLAZE) {
      mob.width = 2;
      mob.height = 2;
    }

    if (type === MobType.SPIDER) {
      mob.width = 1.2;
      mob.height = 0.7;
    }

    this.mobs = [...this.mobs, mob];
    return mob;
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    getBlock: (x: number, y: number) => BlockType,
    getLight: (x: number, y: number) => number,
    dimension: Dimension
  ): void {
    const updatedMobs = this.mobs.map(mob => {
      if (!mob.alive) return mob;

      let updated = { ...mob };

      updated.hurtTimer = Math.max(0, updated.hurtTimer - dt);
      updated.attackTimer = Math.max(0, updated.attackTimer - dt);

      if (updated.deathTimer > 0) {
        updated.deathTimer -= dt;
        if (updated.deathTimer <= 0) {
          updated.alive = false;
        }
        return updated;
      }

      this.updateMobAI(updated, playerX, playerY, playerAlive, getBlock);
      this.updateMobPhysics(updated, dt, getBlock);

      return updated;
    });

    this.mobs = updatedMobs;
    this.removeDead();
  }

  updateMobAI(
    mob: Mob,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    getBlock: (x: number, y: number) => BlockType
  ): void {
    const distToPlayer = distanceBetween(mob.x, mob.y, playerX, playerY);

    mob.aiTimer -= 1 / 60;

    if (mob.type === MobType.ENDERMAN) {
      this.updateEndermanAI(mob, playerX, playerY, playerAlive, distToPlayer);
      return;
    }

    if (mob.type === MobType.GHAST) {
      this.updateGhastAI(mob, playerX, playerY, playerAlive, distToPlayer);
      return;
    }

    if (mob.type === MobType.BLAZE) {
      this.updateBlazeAI(mob, playerX, playerY, playerAlive, distToPlayer);
      return;
    }

    if (mob.type === MobType.ZOMBIE_PIGLIN) {
      this.updateZombiePiglinAI(mob, playerX, playerY, playerAlive, distToPlayer);
      return;
    }

    if (!mob.hostile) {
      this.updatePassiveAI(mob);
      return;
    }

    if (!playerAlive) {
      if (mob.aiState === 'chase' || mob.aiState === 'attack' || mob.aiState === 'explode') {
        mob.aiState = 'wander';
        mob.aiTimer = randomRange(3, 5);
      }
    }

    switch (mob.aiState) {
      case 'idle':
        mob.vx = 0;
        if (mob.aiTimer <= 0) {
          mob.aiState = 'wander';
          mob.aiTimer = randomRange(3, 5);
          mob.facing = Math.random() < 0.5 ? -1 : 1;
        }
        if (playerAlive && mob.hostile && distToPlayer < CHASE_RANGE) {
          mob.aiState = 'chase';
          mob.aiTimer = 0.5;
          mob.target = { x: playerX, y: playerY };
        }
        break;

      case 'wander':
        mob.vx = mob.facing * 1.5;
        if (mob.aiTimer <= 0) {
          mob.aiState = 'idle';
          mob.aiTimer = randomRange(2, 4);
          mob.vx = 0;
        }
        if (playerAlive && mob.hostile && distToPlayer < CHASE_RANGE) {
          mob.aiState = 'chase';
          mob.aiTimer = 0.5;
          mob.target = { x: playerX, y: playerY };
        }
        this.handleWallJump(mob, getBlock);
        break;

      case 'chase':
        if (!playerAlive || distToPlayer > CHASE_RANGE * 2) {
          mob.aiState = 'idle';
          mob.aiTimer = randomRange(2, 4);
          mob.vx = 0;
          break;
        }

        mob.target = { x: playerX, y: playerY };
        const chaseDir = playerX > mob.x ? 1 : -1;
        mob.facing = chaseDir;

        const chaseSpeed = mob.type === MobType.SPIDER ? 3 : 2;
        mob.vx = chaseDir * chaseSpeed;

        this.handleWallJump(mob, getBlock);

        if (mob.type === MobType.CREEPER && distToPlayer < CREEPER_FUSE_RANGE) {
          mob.aiState = 'explode';
          mob.fuseTimer = CREEPER_FUSE_DURATION;
        }

        if (mob.type === MobType.SKELETON) {
          mob.shootTimer -= 1 / 60;
          if (distToPlayer < SKELETON_SHOOT_RANGE && mob.shootTimer <= 0) {
            mob.shootTimer = SKELETON_SHOOT_COOLDOWN;
            mob.aiState = 'attack';
            mob.attackTimer = 0.3;
          }
        }

        if (mob.type !== MobType.SKELETON && mob.type !== MobType.CREEPER) {
          if (distToPlayer < 1.5) {
            mob.aiState = 'attack';
          }
        }

        if (mob.aiTimer <= 0) {
          mob.aiTimer = 0.5;
        }
        break;

      case 'attack':
        mob.vx = 0;
        if (mob.type === MobType.SKELETON) {
          if (mob.attackTimer <= 0) {
            mob.aiState = 'chase';
            mob.aiTimer = 0.5;
          }
        } else {
          if (distToPlayer > 2) {
            mob.aiState = 'chase';
            mob.aiTimer = 0.5;
          }
        }
        break;

      case 'explode':
        mob.vx = 0;
        mob.fuseTimer -= 1 / 60;
        if (mob.fuseTimer <= 0) {
          mob.deathTimer = 0.1;
          mob.alive = false;
        }
        if (distToPlayer > CREEPER_FUSE_RANGE * 2) {
          mob.aiState = 'chase';
          mob.aiTimer = 0.5;
          mob.fuseTimer = 0;
        }
        break;

      case 'flee':
        {
          const fleeDir = playerX > mob.x ? -1 : 1;
          mob.facing = fleeDir;
          mob.vx = fleeDir * 2.5;
          this.handleWallJump(mob, getBlock);
          if (mob.aiTimer <= 0) {
            mob.aiState = 'idle';
            mob.aiTimer = randomRange(2, 4);
            mob.vx = 0;
          }
        }
        break;
    }
  }

  private updatePassiveAI(mob: Mob): void {
    switch (mob.aiState) {
      case 'idle':
        mob.vx = 0;
        if (mob.aiTimer <= 0) {
          mob.aiState = 'wander';
          mob.aiTimer = randomRange(3, 5);
          mob.facing = Math.random() < 0.5 ? -1 : 1;
        }
        break;

      case 'wander':
        mob.vx = mob.facing * 1;
        if (mob.aiTimer <= 0) {
          mob.aiState = 'idle';
          mob.aiTimer = randomRange(2, 4);
          mob.vx = 0;
        }
        break;

      case 'flee':
        mob.vx = mob.facing * 2.5;
        if (mob.aiTimer <= 0) {
          mob.aiState = 'idle';
          mob.aiTimer = randomRange(2, 4);
          mob.vx = 0;
        }
        break;

      default:
        mob.aiState = 'idle';
        mob.aiTimer = randomRange(2, 4);
        break;
    }
  }

  private updateEndermanAI(
    mob: Mob,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    distToPlayer: number
  ): void {
    if (mob.aggravated && playerAlive) {
      mob.aiState = 'chase';
      const chaseDir = playerX > mob.x ? 1 : -1;
      mob.facing = chaseDir;
      mob.vx = chaseDir * 3;

      if (distToPlayer < 1.5) {
        mob.aiState = 'attack';
        mob.vx = 0;
      }

      if (Math.random() < 0.005) {
        const teleportX = mob.x + (Math.random() - 0.5) * ENDERMAN_TELEPORT_RANGE * 2;
        const teleportY = mob.y + (Math.random() - 0.5) * ENDERMAN_TELEPORT_RANGE;
        mob.x = teleportX;
        mob.y = teleportY;
      }
    } else {
      this.updatePassiveAI(mob);
    }
  }

  private updateGhastAI(
    mob: Mob,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    distToPlayer: number
  ): void {
    mob.vy = Math.sin(Date.now() / 1000) * 0.5;

    if (playerAlive && distToPlayer < 20) {
      mob.facing = playerX > mob.x ? 1 : -1;
      mob.shootTimer -= 1 / 60;
      if (mob.shootTimer <= 0) {
        mob.shootTimer = 3;
        mob.aiState = 'attack';
        mob.attackTimer = 0.5;
      }
    } else {
      mob.vx = mob.facing * 0.5;
      if (mob.aiTimer <= 0) {
        mob.facing = Math.random() < 0.5 ? -1 : 1;
        mob.aiTimer = randomRange(3, 6);
      }
    }

    if (mob.attackTimer <= 0 && mob.aiState === 'attack') {
      mob.aiState = 'idle';
    }
  }

  private updateBlazeAI(
    mob: Mob,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    distToPlayer: number
  ): void {
    mob.vy = Math.sin(Date.now() / 800) * 0.8;

    if (playerAlive && distToPlayer < 16) {
      mob.facing = playerX > mob.x ? 1 : -1;
      mob.shootTimer -= 1 / 60;

      if (distToPlayer > 6) {
        mob.vx = mob.facing * 1.5;
      } else {
        mob.vx = 0;
      }

      if (mob.shootTimer <= 0) {
        mob.shootTimer = 1.5;
        mob.aiState = 'attack';
        mob.attackTimer = 0.3;
      }
    } else {
      mob.vx = 0;
    }

    if (mob.attackTimer <= 0 && mob.aiState === 'attack') {
      mob.aiState = 'idle';
    }
  }

  private updateZombiePiglinAI(
    mob: Mob,
    playerX: number,
    playerY: number,
    playerAlive: boolean,
    distToPlayer: number
  ): void {
    if (mob.aggravated && playerAlive) {
      mob.aiState = 'chase';
      const chaseDir = playerX > mob.x ? 1 : -1;
      mob.facing = chaseDir;
      mob.vx = chaseDir * 2;

      if (distToPlayer < 1.5) {
        mob.aiState = 'attack';
        mob.vx = 0;
      }
    } else {
      this.updatePassiveAI(mob);
    }
  }

  private handleWallJump(mob: Mob, getBlock: (x: number, y: number) => BlockType): void {
    const frontX = mob.x + mob.facing * (mob.width / 2 + 2);
    const feetTileX = tileAt(frontX);
    const feetTileY = tileAt(mob.y + mob.height / 2);
    const headTileY = tileAt(mob.y - mob.height / 2);

    const blockAtFeet = getBlock(feetTileX, feetTileY);
    const blockAtHead = getBlock(feetTileX, headTileY);

    if (isSolid(blockAtFeet) && !isSolid(blockAtHead) && mob.onGround) {
      mob.vy = 8;
      mob.onGround = false;
    }

    if (mob.type === MobType.SPIDER && isSolid(blockAtFeet)) {
      mob.vy = -3;
      mob.onGround = false;
    }
  }

  updateMobPhysics(mob: Mob, dt: number, getBlock: (x: number, y: number) => BlockType): void {
    const isFlying = mob.type === MobType.GHAST || mob.type === MobType.BLAZE;

    // Y-up: mob.y = feet position, mob.y + height = head position
    if (!isFlying) {
      mob.vy -= GRAVITY * dt;
    }
    if (mob.vy < -20) mob.vy = -20;

    // Try horizontal move
    const nextX = mob.x + mob.vx * dt;
    const feetY = Math.floor(mob.y);
    const headY = Math.floor(mob.y + mob.height - 0.01);

    let blockedX = false;
    if (mob.vx > 0) {
      const frontTile = Math.floor(nextX + mob.width / 2);
      for (let ty = feetY; ty <= headY; ty++) {
        if (isSolid(getBlock(frontTile, ty))) { blockedX = true; break; }
      }
    } else if (mob.vx < 0) {
      const frontTile = Math.floor(nextX - mob.width / 2);
      for (let ty = feetY; ty <= headY; ty++) {
        if (isSolid(getBlock(frontTile, ty))) { blockedX = true; break; }
      }
    }
    if (blockedX) {
      mob.vx = 0;
    } else {
      mob.x = nextX;
    }

    // Try vertical move
    const nextY = mob.y + mob.vy * dt;
    mob.onGround = false;

    if (mob.vy <= 0) {
      // Falling: check feet
      const feetTile = Math.floor(nextY);
      const leftTile = Math.floor(mob.x - mob.width / 2 + 0.1);
      const rightTile = Math.floor(mob.x + mob.width / 2 - 0.1);
      let landed = false;
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (isSolid(getBlock(tx, feetTile))) {
          landed = true;
          break;
        }
      }
      if (landed) {
        mob.y = feetTile + 1; // snap feet to top of solid block
        mob.vy = 0;
        mob.onGround = true;
      } else {
        mob.y = nextY;
      }
    } else {
      // Rising: check head
      const headTile = Math.floor(nextY + mob.height);
      const leftTile = Math.floor(mob.x - mob.width / 2 + 0.1);
      const rightTile = Math.floor(mob.x + mob.width / 2 - 0.1);
      let hitCeiling = false;
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (isSolid(getBlock(tx, headTile))) {
          hitCeiling = true;
          break;
        }
      }
      if (hitCeiling) {
        mob.vy = 0;
      } else {
        mob.y = nextY;
      }
    }
  }

  spawnMobs(
    playerX: number,
    playerY: number,
    getBlock: (x: number, y: number) => BlockType,
    getLight: (x: number, y: number) => number,
    dimension: Dimension,
    isNight: boolean
  ): void {
    if (this.mobs.length >= this.maxMobs) return;

    this.spawnTimer -= 1 / 60;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = randomRange(8, 15);

    const angle = Math.random() * Math.PI * 2;
    // Spawn at random horizontal distance, then find ground
    const hDist = randomRange(SPAWN_MIN_DISTANCE, SPAWN_MAX_DISTANCE);
    const side = Math.random() < 0.5 ? -1 : 1;
    const spawnX = playerX + side * hDist;

    // Find ground from player's Y level
    let spawnY = -1;
    const searchY = Math.floor(playerY) + 10;
    for (let y = searchY; y > 0; y--) {
      if (isSolid(getBlock(Math.floor(spawnX), y)) && !isSolid(getBlock(Math.floor(spawnX), y + 1)) && !isSolid(getBlock(Math.floor(spawnX), y + 2))) {
        spawnY = y + 1;
        break;
      }
    }
    if (spawnY < 0) return;

    const tileX = Math.floor(spawnX);
    const tileY = Math.floor(spawnY);

    const blockBelow = getBlock(tileX, tileY - 1); // Y-up: below = lower Y
    const blockAt = getBlock(tileX, tileY);
    const blockAbove = getBlock(tileX, tileY + 1); // Y-up: above = higher Y

    if (isSolid(blockAt) || isSolid(blockAbove)) return;
    if (!isSolid(blockBelow)) return;

    const light = getLight(tileX, tileY);

    if (dimension === Dimension.NETHER) {
      const netherMobs: MobType[] = [MobType.ZOMBIE_PIGLIN, MobType.GHAST, MobType.BLAZE];
      const chosenType = netherMobs[Math.floor(Math.random() * netherMobs.length)];
      this.createMob(chosenType, spawnX, spawnY);
      return;
    }

    if (isNight || light <= HOSTILE_LIGHT_THRESHOLD) {
      const hostileMobs: MobType[] = [
        MobType.ZOMBIE,
        MobType.SKELETON,
        MobType.CREEPER,
        MobType.SPIDER,
        MobType.ENDERMAN,
      ];
      const weights = [30, 25, 20, 15, 10];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let roll = Math.random() * totalWeight;
      let chosenType = hostileMobs[0];
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) {
          chosenType = hostileMobs[i];
          break;
        }
      }
      this.createMob(chosenType, spawnX, spawnY);
    } else {
      const passiveMobs: MobType[] = [MobType.PIG, MobType.COW, MobType.SHEEP, MobType.CHICKEN];
      if (blockBelow === BlockType.GRASS) {
        const chosenType = passiveMobs[Math.floor(Math.random() * passiveMobs.length)];
        this.createMob(chosenType, spawnX, spawnY);
      }
    }
  }

  damageMob(mob: Mob, amount: number): { killed: boolean; drops: ItemStack[] } {
    if (!mob.alive || mob.deathTimer > 0) {
      return { killed: false, drops: [] };
    }

    const updated = this.mobs.find(m => m === mob);
    if (!updated) return { killed: false, drops: [] };

    updated.health -= amount;
    updated.hurtTimer = 0.3;

    updated.vx = -updated.facing * KNOCKBACK_FORCE;
    updated.vy = 4;

    if (!updated.hostile) {
      updated.aiState = 'flee';
      updated.aiTimer = FLEE_DURATION;
      updated.facing = updated.vx > 0 ? 1 : -1;
    }

    if (updated.type === MobType.ZOMBIE_PIGLIN) {
      updated.aggravated = true;
      this.mobs.forEach(m => {
        if (m.type === MobType.ZOMBIE_PIGLIN && m.alive) {
          m.aggravated = true;
        }
      });
    }

    if (updated.type === MobType.ENDERMAN) {
      updated.aggravated = true;
    }

    if (updated.health <= 0) {
      updated.health = 0;
      updated.deathTimer = 0.5;
      updated.vx = 0;

      const data = MOB_DATA[updated.type];
      const drops: ItemStack[] = [];

      if (data.drops) {
        for (const drop of data.drops) {
          if (Math.random() > drop.chance) continue;

          const quantity = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
          if (quantity <= 0) continue;

          drops.push({
            type: drop.item,
            count: quantity,
            durability: 0,
          });
        }
      }

      return { killed: true, drops };
    }

    return { killed: false, drops: [] };
  }

  getMobsNear(x: number, y: number, radius: number): Mob[] {
    const radiusPx = radius;
    return this.mobs.filter(mob => {
      if (!mob.alive) return false;
      return distanceBetween(mob.x, mob.y, x, y) <= radiusPx;
    });
  }

  removeDead(): void {
    this.mobs = this.mobs.filter(mob => mob.alive);
  }

  collidesWithPlayer(mob: Mob, px: number, py: number, pw: number, ph: number): boolean {
    if (!mob.alive || mob.deathTimer > 0) return false;

    const mobLeft = mob.x - mob.width / 2;
    const mobRight = mob.x + mob.width / 2;
    const mobTop = mob.y - mob.height / 2;
    const mobBottom = mob.y + mob.height / 2;

    const playerLeft = px - pw / 2;
    const playerRight = px + pw / 2;
    const playerTop = py - ph / 2;
    const playerBottom = py + ph / 2;

    return (
      mobLeft < playerRight &&
      mobRight > playerLeft &&
      mobTop < playerBottom &&
      mobBottom > playerTop
    );
  }

  serialize(): object {
    return {
      mobs: this.mobs.map(mob => ({
        type: mob.type,
        x: mob.x,
        y: mob.y,
        vx: mob.vx,
        vy: mob.vy,
        width: mob.width,
        height: mob.height,
        onGround: mob.onGround,
        health: mob.health,
        maxHealth: mob.maxHealth,
        damage: mob.damage,
        hostile: mob.hostile,
        facing: mob.facing,
        aiTimer: mob.aiTimer,
        aiState: mob.aiState,
        target: mob.target,
        hurtTimer: mob.hurtTimer,
        attackTimer: mob.attackTimer,
        deathTimer: mob.deathTimer,
        alive: mob.alive,
        fuseTimer: mob.fuseTimer,
        shootTimer: mob.shootTimer,
        aggravated: mob.aggravated,
      })),
      spawnTimer: this.spawnTimer,
      maxMobs: this.maxMobs,
    };
  }

  static deserialize(data: any): MobManager {
    const manager = new MobManager();
    if (!data || !Array.isArray(data.mobs)) return manager;

    manager.spawnTimer = data.spawnTimer ?? 0;
    manager.maxMobs = data.maxMobs ?? 30;
    manager.mobs = data.mobs.map((d: any): Mob => ({
      type: d.type,
      x: d.x ?? 0,
      y: d.y ?? 0,
      vx: d.vx ?? 0,
      vy: d.vy ?? 0,
      width: d.width ?? 0.8,
      height: d.height ?? 1.8,
      onGround: d.onGround ?? false,
      health: d.health ?? 20,
      maxHealth: d.maxHealth ?? 20,
      damage: d.damage ?? 3,
      hostile: d.hostile ?? true,
      facing: d.facing ?? 1,
      aiTimer: d.aiTimer ?? 0,
      aiState: d.aiState ?? 'idle',
      target: d.target ?? null,
      hurtTimer: d.hurtTimer ?? 0,
      attackTimer: d.attackTimer ?? 0,
      deathTimer: d.deathTimer ?? 0,
      alive: d.alive ?? true,
      fuseTimer: d.fuseTimer ?? 0,
      shootTimer: d.shootTimer ?? 0,
      aggravated: d.aggravated ?? false,
    }));

    return manager;
  }
}
