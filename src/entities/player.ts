import {
  Entity,
  ItemStack,
  ItemType,
  ITEM_DATA,
  BLOCK_DATA,
  BlockType,
  GRAVITY,
  PLAYER_SPEED,
  JUMP_FORCE,
  TERMINAL_VELOCITY,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_REACH,
  INVENTORY_SIZE,
  HOTBAR_SIZE,
  ARMOR_SLOTS,
  ArmorSlot,
  ToolType,
  Dimension,
  getToolSpeedMultiplier,
  canHarvest,
  TILE_SIZE,
} from '../constants';

export class Player {
  // Position & physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  facing: number;

  // Stats
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  saturation: number;
  xp: number;
  xpLevel: number;

  // Inventory
  inventory: (ItemStack | null)[];
  armor: (ItemStack | null)[];
  selectedSlot: number;

  // Mining state
  miningX: number;
  miningY: number;
  miningProgress: number;
  miningBlock: BlockType;

  // Combat
  attackCooldown: number;
  hurtTimer: number;
  deathTimer: number;
  alive: boolean;

  // Effects
  fireResistant: boolean;
  speedBoost: number;
  strengthBoost: number;
  effectTimers: Map<string, number>;

  // Respawn
  spawnX: number;
  spawnY: number;
  spawnDimension: Dimension;

  // Internal timers
  private hungerTimer: number;
  private regenTimer: number;
  private starvationTimer: number;
  private isMoving: boolean;
  private moveDirection: number;
  sprinting: boolean;
  walkAnimTime: number;

  constructor() {
    this.x = 0;
    this.y = 80;
    this.vx = 0;
    this.vy = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.onGround = false;
    this.facing = 1;

    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;
    this.saturation = 5;
    this.xp = 0;
    this.xpLevel = 0;

    this.inventory = new Array(INVENTORY_SIZE).fill(null);
    this.armor = new Array(ARMOR_SLOTS).fill(null);
    this.selectedSlot = 0;

    this.miningX = -1;
    this.miningY = -1;
    this.miningProgress = 0;
    this.miningBlock = BlockType.AIR;

    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.deathTimer = 0;
    this.alive = true;

    this.fireResistant = false;
    this.speedBoost = 0;
    this.strengthBoost = 0;
    this.effectTimers = new Map();

    this.spawnX = 0;
    this.spawnY = 80;
    this.spawnDimension = Dimension.OVERWORLD;

    this.hungerTimer = 0;
    this.regenTimer = 0;
    this.starvationTimer = 0;
    this.isMoving = false;
    this.moveDirection = 0;
    this.sprinting = false;
    this.walkAnimTime = 0;
  }

  // ---------------------------------------------------------------------------
  // Movement & Physics
  // ---------------------------------------------------------------------------

  update(dt: number, getBlock: (x: number, y: number) => BlockType): void {
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }

    // Apply horizontal movement input
    if (this.isMoving) {
      const sprintMult = this.sprinting ? 1.5 : 1;
      const speed = PLAYER_SPEED * (1 + this.speedBoost) * sprintMult;
      this.vx = this.moveDirection * speed;
      if (this.moveDirection !== 0) {
        this.facing = this.moveDirection;
      }
      // Walk animation
      this.walkAnimTime += dt * (this.sprinting ? 12 : 8);
    } else {
      this.walkAnimTime = 0;
    }

    // Sprinting drains hunger faster
    if (this.sprinting && this.isMoving) {
      this.hungerTimer += dt * 0.5; // extra hunger drain
    }

    // Check if player is in fluid or on ladder
    const centerTileX = Math.floor(this.x);
    const centerTileY = Math.floor(this.y + this.height / 2);
    const feetTileX = Math.floor(this.x);
    const feetTileY = Math.floor(this.y);
    const blockAtCenter = getBlock(centerTileX, centerTileY);
    const blockAtFeet = getBlock(feetTileX, feetTileY);

    this.onLadder = this.isLadderBlock(blockAtCenter) || this.isLadderBlock(blockAtFeet);
    this.inWater = this.isWaterBlock(blockAtCenter) || this.isWaterBlock(blockAtFeet);
    const inLava = this.isLavaBlock(blockAtCenter) || this.isLavaBlock(blockAtFeet);
    const inFluid = this.inWater || inLava;

    // Gravity (Y-up: negative vy = falling)
    if (this.onLadder) {
      this.vy -= GRAVITY * dt * 0.1;
      this.vy *= 0.8;
    } else if (inFluid) {
      this.vy -= GRAVITY * dt * 0.4;
      this.vy *= 0.85;
      this.vx *= 0.9;
    } else {
      this.vy -= GRAVITY * dt;
    }

    // Cap fall speed
    if (this.vy < -TERMINAL_VELOCITY) {
      this.vy = -TERMINAL_VELOCITY;
    }

    // Lava damage
    if (inLava && !this.fireResistant) {
      this.takeDamage(2 * dt);
    }

    // Horizontal collision with auto-step
    const nextX = this.x + this.vx * dt;
    if (this.collidesWithBlock(nextX, this.y, getBlock)) {
      // Try stepping up 1 block (auto-step for walking onto ledges / out of water)
      const stepY = this.y + 1;
      if (!this.collidesWithBlock(nextX, stepY, getBlock)) {
        this.x = nextX;
        this.y = stepY;
        this.vy = 0;
      } else {
        this.vx = 0;
      }
    } else {
      this.x = nextX;
    }

    // Vertical collision
    const nextY = this.y + this.vy * dt;
    if (this.collidesWithBlock(this.x, nextY, getBlock)) {
      if (this.vy < 0) {
        this.onGround = true;
      }
      this.vy = 0;
    } else {
      this.y = nextY;
      this.onGround = false;
    }

    // Friction
    if (!this.isMoving) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.01) {
        this.vx = 0;
      }
    }

    // Cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
      if (this.attackCooldown < 0) {
        this.attackCooldown = 0;
      }
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer < 0) {
        this.hurtTimer = 0;
      }
    }

    // Hunger system
    this.updateHunger(dt);

    // Health regeneration when hunger >= 18
    if (this.hunger >= 18 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 0.5) {
        this.regenTimer -= 0.5;
        this.heal(1);
        this.hunger = Math.max(0, this.hunger - 0.5);
      }
    } else {
      this.regenTimer = 0;
    }

    // Starvation damage at 0 hunger
    if (this.hunger <= 0) {
      this.starvationTimer += dt;
      if (this.starvationTimer >= 4) {
        this.starvationTimer -= 4;
        this.takeDamage(1);
      }
    } else {
      this.starvationTimer = 0;
    }

    // Update potion effects
    this.updateEffects(dt);
  }

  moveLeft(): void {
    this.isMoving = true;
    this.moveDirection = -1;
    this.facing = -1;
  }

  moveRight(): void {
    this.isMoving = true;
    this.moveDirection = 1;
    this.facing = 1;
  }

  jump(): void {
    if (this.onGround) {
      this.vy = JUMP_FORCE;
      this.onGround = false;
    } else if (this.inWater || this.onLadder) {
      // Swim upward / climb ladder
      this.vy = 5;
    }
  }

  // Fluid/ladder state (set during update)
  private inWater = false;
  private onLadder = false;

  stopMoving(): void {
    this.isMoving = false;
    this.moveDirection = 0;
    this.sprinting = false;
  }

  setSprinting(sprinting: boolean): void {
    // Can only sprint if hunger > 6
    this.sprinting = sprinting && this.hunger > 6;
  }

  // ---------------------------------------------------------------------------
  // Collision Detection
  // ---------------------------------------------------------------------------

  collidesWithBlock(
    nx: number,
    ny: number,
    getBlock: (x: number, y: number) => BlockType,
  ): boolean {
    const left = nx - this.width / 2;
    const right = nx + this.width / 2;
    const top = ny;
    const bottom = ny + this.height;

    const tileLeft = Math.floor(left);
    const tileRight = Math.floor(right - 0.001);
    const tileTop = Math.floor(top);
    const tileBottom = Math.floor(bottom - 0.001);

    for (let tx = tileLeft; tx <= tileRight; tx++) {
      for (let ty = tileTop; ty <= tileBottom; ty++) {
        const block = getBlock(tx, ty);
        const blockData = BLOCK_DATA[block];
        if (blockData && blockData.solid) {
          return true;
        }
      }
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // Inventory Management
  // ---------------------------------------------------------------------------

  getHeldItem(): ItemStack | null {
    return this.inventory[this.selectedSlot];
  }

  addItem(item: ItemStack): boolean {
    // Try to stack with existing matching items first
    const itemData = ITEM_DATA[item.type];
    const maxStack = itemData?.stackSize ?? 64;

    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const slot = this.inventory[i];
      if (slot !== null && slot.type === item.type && slot.count < maxStack) {
        const canAdd = maxStack - slot.count;
        const toAdd = Math.min(canAdd, item.count);
        // Create new stack (immutable pattern)
        this.inventory[i] = { ...slot, count: slot.count + toAdd };
        item = { ...item, count: item.count - toAdd };
        if (item.count <= 0) {
          return true;
        }
      }
    }

    // Find empty slot for remainder
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      if (this.inventory[i] === null) {
        this.inventory[i] = { ...item };
        return true;
      }
    }

    return false;
  }

  removeItem(slot: number, count: number): void {
    if (slot < 0 || slot >= INVENTORY_SIZE) return;
    const current = this.inventory[slot];
    if (current === null) return;

    const newCount = current.count - count;
    if (newCount <= 0) {
      this.inventory[slot] = null;
    } else {
      this.inventory[slot] = { ...current, count: newCount };
    }
  }

  consumeHeldItem(): void {
    const held = this.getHeldItem();
    if (held === null) return;

    const itemData = ITEM_DATA[held.type];
    if (itemData && itemData.durability !== undefined && held.durability !== undefined) {
      const newDurability = held.durability - 1;
      if (newDurability <= 0) {
        this.inventory[this.selectedSlot] = null;
      } else {
        this.inventory[this.selectedSlot] = { ...held, durability: newDurability };
      }
    } else {
      this.removeItem(this.selectedSlot, 1);
    }
  }

  swapSlots(a: number, b: number): void {
    if (a < 0 || a >= INVENTORY_SIZE || b < 0 || b >= INVENTORY_SIZE) return;
    const temp = this.inventory[a];
    this.inventory[a] = this.inventory[b];
    this.inventory[b] = temp;
  }

  getArmorValue(): number {
    let total = 0;
    for (const piece of this.armor) {
      if (piece !== null) {
        const data = ITEM_DATA[piece.type];
        if (data && data.armorValue !== undefined) {
          total += data.armorValue;
        }
      }
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Mining
  // ---------------------------------------------------------------------------

  startMining(bx: number, by: number, blockType: BlockType): void {
    if (this.miningX === bx && this.miningY === by && this.miningBlock === blockType) {
      return; // Already mining this block
    }
    this.miningX = bx;
    this.miningY = by;
    this.miningBlock = blockType;
    this.miningProgress = 0;
  }

  updateMining(dt: number): boolean {
    if (this.miningBlock === BlockType.AIR) return false;

    const blockData = BLOCK_DATA[this.miningBlock];
    if (!blockData) return false;

    const hardness = blockData.hardness ?? 0;
    if (hardness < 0) return false; // Unbreakable (like bedrock)

    if (hardness === 0) {
      // Instant break
      this.stopMining();
      return true;
    }

    const speed = this.getMiningSpeed(this.miningBlock);
    this.miningProgress += speed * dt;

    if (this.miningProgress >= hardness) {
      this.consumeHeldItem();
      this.stopMining();
      return true;
    }

    return false;
  }

  stopMining(): void {
    this.miningX = -1;
    this.miningY = -1;
    this.miningProgress = 0;
    this.miningBlock = BlockType.AIR;
  }

  getMiningSpeed(blockType: BlockType): number {
    const held = this.getHeldItem();
    if (held === null) {
      return 1; // Fist speed
    }

    const itemData = ITEM_DATA[held.type];
    if (!itemData || !itemData.toolType) {
      return 1;
    }

    const blockData = BLOCK_DATA[blockType];
    const multiplier = getToolSpeedMultiplier(itemData.toolTier, itemData.toolType, blockData.tool);
    return multiplier;
  }

  // ---------------------------------------------------------------------------
  // Combat
  // ---------------------------------------------------------------------------

  attack(): number {
    if (this.attackCooldown > 0) return 0;

    this.attackCooldown = 0.5;

    const held = this.getHeldItem();
    let baseDamage = 1; // Fist damage

    if (held !== null) {
      const itemData = ITEM_DATA[held.type];
      if (itemData && itemData.damage !== undefined) {
        baseDamage = itemData.damage;
      }
    }

    const totalDamage = baseDamage + this.strengthBoost;
    return totalDamage;
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    if (this.hurtTimer > 0) return; // Invincibility frames

    const armorValue = this.getArmorValue();
    const reduction = 1 - armorValue * 0.04;
    const actualDamage = Math.max(0, amount * Math.max(0.2, reduction));

    this.health -= actualDamage;
    this.hurtTimer = 0.5;

    // Drain armor durability
    for (let i = 0; i < ARMOR_SLOTS; i++) {
      const piece = this.armor[i];
      if (piece !== null && piece.durability !== undefined) {
        const newDurability = piece.durability - 1;
        if (newDurability <= 0) {
          this.armor[i] = null;
        } else {
          this.armor[i] = { ...piece, durability: newDurability };
        }
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  heal(amount: number): void {
    if (!this.alive) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  die(): void {
    this.alive = false;
    this.deathTimer = 0;
    this.vx = 0;
    this.vy = 0;
  }

  respawn(): void {
    this.alive = true;
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.saturation = 5;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.deathTimer = 0;
    this.hurtTimer = 0;
    this.attackCooldown = 0;
    this.fireResistant = false;
    this.speedBoost = 0;
    this.strengthBoost = 0;
    this.effectTimers.clear();
  }

  // ---------------------------------------------------------------------------
  // Food
  // ---------------------------------------------------------------------------

  eat(): boolean {
    const held = this.getHeldItem();
    if (held === null) return false;

    const itemData = ITEM_DATA[held.type];
    if (!itemData || !itemData.foodValue) return false;
    if (this.hunger >= this.maxHunger) return false;

    const foodValue = itemData.foodValue;
    const saturationValue = itemData.saturation ?? 0;

    this.hunger = Math.min(this.maxHunger, this.hunger + foodValue);
    this.saturation = Math.min(this.hunger, this.saturation + saturationValue);

    this.removeItem(this.selectedSlot, 1);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Potion Effects
  // ---------------------------------------------------------------------------

  usePotion(): void {
    const held = this.getHeldItem();
    if (held === null) return;

    if (held.type === ItemType.POTION_HEALING) {
      this.heal(6);
    } else if (held.type === ItemType.POTION_SPEED) {
      this.speedBoost = 0.4;
      this.effectTimers.set('speed', 30);
    } else if (held.type === ItemType.POTION_STRENGTH) {
      this.strengthBoost = 3;
      this.effectTimers.set('strength', 30);
    } else if (held.type === ItemType.POTION_FIRE_RESISTANCE) {
      this.fireResistant = true;
      this.effectTimers.set('fire_resistance', 30);
    } else {
      return; // Not a potion
    }

    this.removeItem(this.selectedSlot, 1);
  }

  updateEffects(dt: number): void {
    const expired: string[] = [];

    for (const [effect, remaining] of this.effectTimers) {
      const newRemaining = remaining - dt;

      if (newRemaining <= 0) {
        expired.push(effect);
      } else {
        this.effectTimers.set(effect, newRemaining);

        // Regeneration heals 1 HP every 2.5 seconds
        if (effect === 'regeneration') {
          const prevTick = Math.floor(remaining / 2.5);
          const currTick = Math.floor(newRemaining / 2.5);
          if (currTick < prevTick) {
            this.heal(1);
          }
        }
      }
    }

    for (const effect of expired) {
      this.effectTimers.delete(effect);

      if (effect === 'speed') {
        this.speedBoost = 0;
      } else if (effect === 'strength') {
        this.strengthBoost = 0;
      } else if (effect === 'fire_resistance') {
        this.fireResistant = false;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Block Interaction
  // ---------------------------------------------------------------------------

  canReach(bx: number, by: number): boolean {
    const playerCenterX = this.x;
    const playerCenterY = this.y + this.height / 2;
    const blockCenterX = (bx + 0.5) * TILE_SIZE;
    const blockCenterY = (by + 0.5) * TILE_SIZE;

    const dx = playerCenterX - blockCenterX;
    const dy = playerCenterY - blockCenterY;
    const distSquared = dx * dx + dy * dy;
    const reachPixels = PLAYER_REACH * TILE_SIZE;

    return distSquared <= reachPixels * reachPixels;
  }

  // ---------------------------------------------------------------------------
  // XP
  // ---------------------------------------------------------------------------

  addXp(amount: number): void {
    this.xp += amount;

    // XP needed for next level follows Minecraft formula (simplified)
    while (true) {
      const xpNeeded = this.getXpForNextLevel();
      if (this.xp >= xpNeeded) {
        this.xp -= xpNeeded;
        this.xpLevel += 1;
      } else {
        break;
      }
    }
  }

  private getXpForNextLevel(): number {
    if (this.xpLevel < 16) {
      return 2 * this.xpLevel + 7;
    } else if (this.xpLevel < 31) {
      return 5 * this.xpLevel - 38;
    } else {
      return 9 * this.xpLevel - 158;
    }
  }

  // ---------------------------------------------------------------------------
  // Hunger
  // ---------------------------------------------------------------------------

  private updateHunger(dt: number): void {
    if (this.isMoving && (this.vx !== 0)) {
      this.hungerTimer += dt;
      const drainRate = 0.005;
      if (this.hungerTimer >= 1) {
        this.hungerTimer -= 1;
        if (this.saturation > 0) {
          this.saturation = Math.max(0, this.saturation - drainRate * 20);
        } else {
          this.hunger = Math.max(0, this.hunger - drainRate * 20);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Fluid / Ladder helpers
  // ---------------------------------------------------------------------------

  private isLadderBlock(block: BlockType): boolean {
    return block === BlockType.LADDER;
  }

  private isWaterBlock(block: BlockType): boolean {
    return block === BlockType.WATER;
  }

  private isLavaBlock(block: BlockType): boolean {
    return block === BlockType.LAVA;
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  serialize(): object {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      facing: this.facing,
      health: this.health,
      maxHealth: this.maxHealth,
      hunger: this.hunger,
      maxHunger: this.maxHunger,
      saturation: this.saturation,
      xp: this.xp,
      xpLevel: this.xpLevel,
      inventory: this.inventory.map((slot) =>
        slot !== null ? { type: slot.type, count: slot.count, durability: slot.durability } : null,
      ),
      armor: this.armor.map((slot) =>
        slot !== null ? { type: slot.type, count: slot.count, durability: slot.durability } : null,
      ),
      selectedSlot: this.selectedSlot,
      alive: this.alive,
      spawnX: this.spawnX,
      spawnY: this.spawnY,
      spawnDimension: this.spawnDimension,
      effectTimers: Array.from(this.effectTimers.entries()),
      fireResistant: this.fireResistant,
      speedBoost: this.speedBoost,
      strengthBoost: this.strengthBoost,
    };
  }

  static deserialize(data: any): Player {
    const player = new Player();

    player.x = data.x ?? 0;
    player.y = data.y ?? 80;
    player.vx = data.vx ?? 0;
    player.vy = data.vy ?? 0;
    player.facing = data.facing ?? 1;
    player.health = data.health ?? 20;
    player.maxHealth = data.maxHealth ?? 20;
    player.hunger = data.hunger ?? 20;
    player.maxHunger = data.maxHunger ?? 20;
    player.saturation = data.saturation ?? 5;
    player.xp = data.xp ?? 0;
    player.xpLevel = data.xpLevel ?? 0;
    player.selectedSlot = data.selectedSlot ?? 0;
    player.alive = data.alive ?? true;
    player.spawnX = data.spawnX ?? 0;
    player.spawnY = data.spawnY ?? 80;
    player.spawnDimension = data.spawnDimension ?? Dimension.OVERWORLD;
    player.fireResistant = data.fireResistant ?? false;
    player.speedBoost = data.speedBoost ?? 0;
    player.strengthBoost = data.strengthBoost ?? 0;

    if (Array.isArray(data.inventory)) {
      player.inventory = data.inventory.map((slot: any) => {
        if (slot === null || slot === undefined) return null;
        return {
          type: slot.type,
          count: slot.count ?? 1,
          durability: slot.durability,
        } as ItemStack;
      });
      // Pad to INVENTORY_SIZE if shorter
      while (player.inventory.length < INVENTORY_SIZE) {
        player.inventory.push(null);
      }
    }

    if (Array.isArray(data.armor)) {
      player.armor = data.armor.map((slot: any) => {
        if (slot === null || slot === undefined) return null;
        return {
          type: slot.type,
          count: slot.count ?? 1,
          durability: slot.durability,
        } as ItemStack;
      });
      while (player.armor.length < ARMOR_SLOTS) {
        player.armor.push(null);
      }
    }

    if (Array.isArray(data.effectTimers)) {
      player.effectTimers = new Map(data.effectTimers);
    }

    if (!player.alive) {
      player.deathTimer = 0;
    }

    return player;
  }
}
