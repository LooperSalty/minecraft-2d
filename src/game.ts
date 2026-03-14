import {
  GameState, Dimension, BlockType, BLOCK_DATA, ItemType, ITEM_DATA,
  ItemStack, TILE_SIZE, PLAYER_REACH, HOTBAR_SIZE, INVENTORY_SIZE,
  getItemBlock, getBlockItem, DroppedItem, canHarvest, getToolSpeedMultiplier,
  MobType, CRAFTING_RECIPES,
} from './constants';
import { Input } from './input';
import { World, FurnaceState } from './world/world';
import { Player } from './entities/player';
import { MobManager, Mob } from './entities/mobs';
import { EnderDragon, DragonPhase } from './entities/dragon';
import { Renderer, RenderState } from './rendering/renderer';
import { CraftingSystem, InventoryOps } from './systems/inventory';
import { AudioManager } from './audio/audio';
import { SaveManager, SaveData } from './save/save';

const MAX_DT = 0.05;
const PORTAL_DELAY = 2.0;
const PICKUP_RANGE = 1.5;
const AUTO_SAVE_INTERVAL = 60;
const MENU_BUTTON_WIDTH = 200;
const MENU_BUTTON_HEIGHT = 40;

export class Game {
  private canvas: HTMLCanvasElement;
  private input: Input;
  private renderer: Renderer;
  private audio: AudioManager;
  private save: SaveManager;

  state: GameState;
  world: World;
  player: Player;
  mobs: MobManager;
  dragon: EnderDragon | null;

  craftingGrid: (ItemStack | null)[];
  craftingResult: ItemStack | null;
  cursorItem: ItemStack | null;
  openFurnaceX: number;
  openFurnaceY: number;

  private lastTime: number;
  private running: boolean;
  victoryTimer: number;
  hasSaveFile: boolean;
  audioReady: boolean;

  private miningX: number;
  private miningY: number;
  private miningProgress: number;
  private portalTimer: number;
  private autoSaveTimer: number;
  private attackCooldown: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();
    this.save = new SaveManager();

    this.state = GameState.MENU;
    this.world = new World(0);
    this.player = new Player();
    this.mobs = new MobManager();
    this.dragon = null;

    this.craftingGrid = [null, null, null, null];
    this.craftingResult = null;
    this.cursorItem = null;
    this.openFurnaceX = 0;
    this.openFurnaceY = 0;

    this.lastTime = 0;
    this.running = false;
    this.victoryTimer = 0;
    this.hasSaveFile = false;
    this.audioReady = false;

    this.miningX = -1;
    this.miningY = -1;
    this.miningProgress = 0;
    this.portalTimer = 0;
    this.autoSaveTimer = 0;
    this.attackCooldown = 0;
  }

  async init(): Promise<void> {
    await this.save.init();
    this.hasSaveFile = await this.save.hasSave();
    this.state = GameState.MENU;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, MAX_DT);
    this.lastTime = timestamp;

    switch (this.state) {
      case GameState.MENU: this.updateMenu(); break;
      case GameState.PLAYING: this.updatePlaying(dt); break;
      case GameState.INVENTORY: this.updateInventory(dt); break;
      case GameState.CRAFTING: this.updateCrafting(dt); break;
      case GameState.FURNACE: this.updateFurnace(dt); break;
      case GameState.PAUSED: this.updatePaused(); break;
      case GameState.DEAD: this.updateDead(); break;
      case GameState.VICTORY: this.updateVictory(dt); break;
    }

    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ─── PLAYING ───

  private updatePlaying(dt: number): void {
    // Movement
    if (this.input.isDown('KeyA') || this.input.isDown('ArrowLeft')) this.player.moveLeft();
    if (this.input.isDown('KeyD') || this.input.isDown('ArrowRight')) this.player.moveRight();
    if (this.input.isDown('KeyW') || this.input.isDown('ArrowUp') || this.input.isDown('Space')) this.player.jump();
    if (!this.input.isDown('KeyA') && !this.input.isDown('ArrowLeft') &&
        !this.input.isDown('KeyD') && !this.input.isDown('ArrowRight')) {
      this.player.stopMoving();
    }

    // Sprint
    this.player.setSprinting(this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight'));

    // Hotbar selection
    for (let i = 0; i < 9; i++) {
      if (this.input.wasPressed(`Digit${i + 1}`)) this.player.selectedSlot = i;
    }
    if (this.input.scroll !== 0) {
      this.player.selectedSlot = ((this.player.selectedSlot + Math.sign(this.input.scroll)) % HOTBAR_SIZE + HOTBAR_SIZE) % HOTBAR_SIZE;
    }

    // Left click: mine (hold) or attack (single click on mob)
    if (this.input.mouseLeft) {
      // Try attack only on first click
      if (this.input.mouseLeftJust && this.attackCooldown <= 0) {
        this.handleAttack(); // attack mobs/crystals if near cursor
      }
      // Always mine while holding (attack doesn't block mining)
      this.handleMining(dt);
    } else {
      this.resetMining();
    }

    // Right click: place / interact / use
    if (this.input.mouseRightJust) {
      const target = this.getTargetBlock();
      if (target) {
        const blockAt = this.world.getBlock(target.x, target.y);
        if (blockAt === BlockType.CRAFTING_TABLE) {
          this.state = GameState.CRAFTING;
          this.craftingGrid = new Array(9).fill(null);
          this.craftingResult = null;
          this.cursorItem = null;
        } else if (blockAt === BlockType.FURNACE || blockAt === BlockType.FURNACE_LIT) {
          this.state = GameState.FURNACE;
          this.openFurnaceX = target.x;
          this.openFurnaceY = target.y;
          this.cursorItem = null;
        } else {
          const held = this.player.getHeldItem();
          if (held) {
            const blockToPlace = getItemBlock(held.type);
            if (blockToPlace !== null) {
              this.handlePlacing();
            } else {
              this.handleItemUse();
            }
          }
        }
      } else {
        this.handleItemUse();
      }
    }

    // Inventory
    if (this.input.wasPressed('KeyE')) {
      this.state = GameState.INVENTORY;
      this.craftingGrid = [null, null, null, null];
      this.craftingResult = null;
      this.cursorItem = null;
    }

    // Pause
    if (this.input.wasPressed('Escape')) this.state = GameState.PAUSED;

    // Drop item
    if (this.input.wasPressed('KeyQ')) {
      const held = this.player.getHeldItem();
      if (held) {
        this.world.spawnDrop(this.player.x, this.player.y + 1, {
          type: held.type, count: 1, durability: held.durability,
        });
        this.player.removeItem(this.player.selectedSlot, 1);
      }
    }

    // Update physics
    const getBlock = (x: number, y: number) => this.world.getBlock(x, y);
    this.player.update(dt, getBlock);

    // World updates
    this.world.updateTime(dt * 4); // ~10 min pour un cycle jour/nuit complet
    this.world.updateFurnaces(dt * 20);
    this.world.loadChunksAround(Math.floor(this.player.x));

    // Mobs
    const getLight = (x: number, y: number) => this.world.getLight(x, y);
    this.mobs.update(dt, this.player.x, this.player.y, this.player.alive,
      getBlock, getLight, this.world.currentDimension);
    this.mobs.spawnMobs(this.player.x, this.player.y, getBlock, getLight,
      this.world.currentDimension, this.world.isNight());

    // Dropped items pickup
    this.updateDroppedItems(dt);
    this.world.updateDroppedItems(dt);

    // Dragon
    if (this.world.currentDimension === Dimension.END && this.dragon && this.dragon.alive) {
      this.dragon.update(dt, this.player.x, this.player.y);
      // Check dragon contact damage
      const dx = this.player.x - this.dragon.x;
      const dy = this.player.y - this.dragon.y;
      if (Math.sqrt(dx * dx + dy * dy) < 3) {
        this.player.takeDamage(this.dragon.getChargeDamage());
      }
      // Check breath particles
      const nearBreath = this.dragon.getBreathParticlesNear(this.player.x, this.player.y, 1.5);
      if (nearBreath.length > 0) {
        this.player.takeDamage(this.dragon.getBreathDamage());
      }
      // Check defeat
      if (this.dragon.isDefeated()) {
        this.state = GameState.VICTORY;
        this.victoryTimer = 0;
        this.audio.playDragonDeath();
      }
    }

    // Player death
    if (this.player.health <= 0 && this.player.alive) {
      this.player.die();
      this.state = GameState.DEAD;
      this.audio.playHurt();
    }

    // Portal check
    this.handlePortalCheck(dt);

    // Mob collision damage
    for (const mob of this.mobs.mobs) {
      if (!mob.alive || !mob.hostile) continue;
      if (this.mobs.collidesWithPlayer(mob, this.player.x, this.player.y, this.player.width, this.player.height)) {
        this.player.takeDamage(mob.damage);
      }
    }

    // Camera
    this.renderer.camera.follow(this.player.x, this.player.y, dt);

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Auto-save
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }
  }

  // ─── MENU ───

  private updateMenu(): void {
    if (this.input.mouseLeftJust) {
      if (!this.audioReady) {
        this.audio.init();
        this.audioReady = true;
        this.audio.startMusic('menu');
      }

      const mx = this.input.mouseX;
      const my = this.input.mouseY;
      const cx = this.canvas.width / 2;
      const btnL = cx - MENU_BUTTON_WIDTH / 2;
      const btnR = cx + MENU_BUTTON_WIDTH / 2;

      // Button layout matches renderer: btnW=220, btnH=44, centered
      const btnW = 220;
      const btnH = 44;
      const btnX = (this.canvas.width - btnW) / 2;

      // "New World" button at canvas.height * 0.5
      const newBtnY = this.canvas.height * 0.5;
      if (mx >= btnX && mx <= btnX + btnW && my >= newBtnY && my <= newBtnY + btnH) {
        this.newGame();
        return;
      }

      // "Continue" button at canvas.height * 0.5 + 60
      if (this.hasSaveFile) {
        const contBtnY = this.canvas.height * 0.5 + 60;
        if (mx >= btnX && mx <= btnX + btnW && my >= contBtnY && my <= contBtnY + btnH) {
          this.loadGame();
          return;
        }
      }
    }
  }

  // ─── INVENTORY / CRAFTING / FURNACE ───

  private updateInventory(dt: number): void {
    if (this.input.wasPressed('Escape') || this.input.wasPressed('KeyE')) {
      this.closeInventoryScreen();
      return;
    }
    if (this.input.mouseLeftJust) this.handleInventoryClick(this.input.mouseX, this.input.mouseY, false);
    if (this.input.mouseRightJust) this.handleInventoryClick(this.input.mouseX, this.input.mouseY, true);
    this.world.updateFurnaces(dt * 20);
  }

  private updateCrafting(dt: number): void {
    if (this.input.wasPressed('Escape') || this.input.wasPressed('KeyE')) {
      this.closeInventoryScreen();
      return;
    }
    if (this.input.mouseLeftJust) this.handleInventoryClick(this.input.mouseX, this.input.mouseY, false);
    if (this.input.mouseRightJust) this.handleInventoryClick(this.input.mouseX, this.input.mouseY, true);
    this.world.updateFurnaces(dt * 20);
  }

  private updateFurnace(dt: number): void {
    if (this.input.wasPressed('Escape') || this.input.wasPressed('KeyE')) {
      this.closeInventoryScreen();
      return;
    }
    if (this.input.mouseLeftJust) this.handleFurnaceClick(this.input.mouseX, this.input.mouseY, false);
    if (this.input.mouseRightJust) this.handleFurnaceClick(this.input.mouseX, this.input.mouseY, true);
    this.world.updateFurnaces(dt * 20);
  }

  private updatePaused(): void {
    if (this.input.wasPressed('Escape')) { this.state = GameState.PLAYING; return; }
    if (this.input.mouseLeftJust) {
      const mx = this.input.mouseX;
      const my = this.input.mouseY;
      // Matches renderer: btnW=200, btnH=44, centered, resume at 0.45, quit at 0.45+56
      const btnW = 200;
      const btnH = 44;
      const btnX = (this.canvas.width - btnW) / 2;

      const resumeY = this.canvas.height * 0.45;
      if (mx >= btnX && mx <= btnX + btnW && my >= resumeY && my <= resumeY + btnH) {
        this.state = GameState.PLAYING;
      }
      const quitY = this.canvas.height * 0.45 + 56;
      if (mx >= btnX && mx <= btnX + btnW && my >= quitY && my <= quitY + btnH) {
        this.saveGame().then(() => {
          this.hasSaveFile = true;
          this.state = GameState.MENU;
          this.audio.stopMusic();
          this.audio.startMusic('menu');
        });
      }
    }
  }

  private updateDead(): void {
    if (this.input.mouseLeftJust) {
      const mx = this.input.mouseX;
      const my = this.input.mouseY;
      // Matches renderer: btnW=180, btnH=40, btnY = canvas.height/2 + 20
      const btnW = 180;
      const btnH = 40;
      const btnX = (this.canvas.width - btnW) / 2;
      const btnY = this.canvas.height / 2 + 20;
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        this.player.respawn();
        if (this.world.currentDimension !== Dimension.OVERWORLD) {
          const pos = this.world.switchDimension(Dimension.OVERWORLD, this.player.x, this.player.y);
          this.player.x = pos.x;
          this.player.y = pos.y;
        }
        this.state = GameState.PLAYING;
      }
    }
  }

  private updateVictory(dt: number): void {
    this.victoryTimer += dt;
    if (this.victoryTimer > 5 && this.input.mouseLeftJust) {
      this.returnFromEnd();
      this.state = GameState.PLAYING;
    }
  }

  // ─── MINING ───

  private handleMining(dt: number): void {
    const target = this.getTargetBlock();
    if (!target) { this.resetMining(); return; }

    const block = this.world.getBlock(target.x, target.y);
    if (block === BlockType.AIR) { this.resetMining(); return; }

    const blockData = BLOCK_DATA[block];
    if (!blockData || blockData.hardness < 0) return;

    if (target.x !== this.miningX || target.y !== this.miningY) {
      this.miningX = target.x;
      this.miningY = target.y;
      this.miningProgress = 0;
    }

    const held = this.player.getHeldItem();
    const itemData = held ? ITEM_DATA[held.type] : null;
    const toolType = itemData?.toolType ?? 0;
    const toolTier = itemData?.toolTier ?? 0;
    const speedMult = getToolSpeedMultiplier(toolTier, toolType, blockData.tool);
    const hardness = blockData.hardness || 0.5;

    this.miningProgress += (dt * speedMult) / hardness;

    if (this.miningProgress >= 1.0) {
      this.world.setBlock(target.x, target.y, BlockType.AIR);
      this.audio.playBlockBreak();
      this.renderer.spawnBlockBreakParticles(target.x, target.y, block);

      // Drops
      if (canHarvest(toolTier, toolType, blockData) && blockData.drops !== null) {
        const dropCount = blockData.dropCount || 1;
        this.world.spawnDrop(target.x + 0.5, target.y + 0.5, {
          type: blockData.drops, count: dropCount, durability: 0,
        });
      }

      // Sapling drop chance from leaves
      if (block === BlockType.OAK_LEAVES && Math.random() < 0.05) {
        this.world.spawnDrop(target.x + 0.5, target.y + 0.5, {
          type: ItemType.OAK_SAPLING, count: 1, durability: 0,
        });
      }
      if (block === BlockType.BIRCH_LEAVES && Math.random() < 0.05) {
        this.world.spawnDrop(target.x + 0.5, target.y + 0.5, {
          type: ItemType.BIRCH_SAPLING, count: 1, durability: 0,
        });
      }

      // Tool durability
      if (held && itemData && itemData.durability > 0) {
        this.player.consumeHeldItem();
      }

      this.resetMining();
    }
  }

  private resetMining(): void {
    this.miningProgress = 0;
    this.miningX = -1;
    this.miningY = -1;
  }

  // ─── PLACING ───

  private handlePlacing(): void {
    const target = this.getTargetBlock();
    if (!target) return;

    const held = this.player.getHeldItem();
    if (!held) return;

    const blockToPlace = getItemBlock(held.type);
    if (blockToPlace === null) return;

    const blockAt = this.world.getBlock(target.x, target.y);
    let placeX = target.x;
    let placeY = target.y;

    if (BLOCK_DATA[blockAt]?.solid) {
      // Find adjacent air block
      const worldPos = this.renderer.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
      const fracX = worldPos.x - target.x;
      const fracY = worldPos.y - target.y;

      const candidates: { x: number; y: number }[] = [];
      if (fracX < 0.25) candidates.push({ x: target.x - 1, y: target.y });
      else if (fracX > 0.75) candidates.push({ x: target.x + 1, y: target.y });
      if (fracY < 0.25) candidates.push({ x: target.x, y: target.y - 1 });
      else if (fracY > 0.75) candidates.push({ x: target.x, y: target.y + 1 });

      if (candidates.length === 0) {
        const ax = Math.abs(fracX - 0.5);
        const ay = Math.abs(fracY - 0.5);
        candidates.push(ax > ay
          ? { x: target.x + (fracX < 0.5 ? -1 : 1), y: target.y }
          : { x: target.x, y: target.y + (fracY < 0.5 ? -1 : 1) });
      }

      let placed = false;
      for (const c of candidates) {
        if (!BLOCK_DATA[this.world.getBlock(c.x, c.y)]?.solid) {
          placeX = c.x;
          placeY = c.y;
          placed = true;
          break;
        }
      }
      if (!placed) return;
    }

    // Check reach
    const dx = placeX + 0.5 - this.player.x;
    const dy = placeY + 0.5 - this.player.y;
    if (Math.sqrt(dx * dx + dy * dy) > PLAYER_REACH) return;

    // Check player overlap
    const pL = this.player.x - this.player.width / 2;
    const pR = this.player.x + this.player.width / 2;
    const pB = this.player.y;
    const pT = this.player.y + this.player.height;
    if (placeX + 1 > pL && placeX < pR && placeY + 1 > pB && placeY < pT) return;

    if (this.world.placeBlock(placeX, placeY, blockToPlace)) {
      this.player.removeItem(this.player.selectedSlot, 1);
      this.audio.playBlockPlace();
    }
  }

  // ─── ATTACK ───

  private handleAttack(): boolean {
    if (this.attackCooldown > 0) return false;

    const worldPos = this.renderer.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
    const dx = worldPos.x - this.player.x;
    const dy = worldPos.y - this.player.y;
    if (Math.sqrt(dx * dx + dy * dy) > PLAYER_REACH) return false;

    // Check end crystals
    if (this.world.currentDimension === Dimension.END && this.dragon) {
      const crystalIdx = this.dragon.isNearCrystal(worldPos.x, worldPos.y);
      if (crystalIdx >= 0) {
        this.dragon.destroyCrystal(crystalIdx);
        this.audio.playExplosion();
        this.renderer.spawnExplosionParticles(worldPos.x, worldPos.y, 20);
        this.attackCooldown = 0.5;
        return true;
      }
    }

    // Check mobs
    const nearMobs = this.mobs.getMobsNear(worldPos.x, worldPos.y, 1.5);
    if (nearMobs.length === 0) return false;

    const mob = nearMobs[0];
    const damage = this.player.attack();
    if (damage <= 0) return false;

    const result = this.mobs.damageMob(mob, damage);
    // Knockback
    const kbDir = mob.x > this.player.x ? 1 : -1;
    mob.vx += kbDir * 5;
    mob.vy -= 3;

    this.audio.playHit();
    this.attackCooldown = 0.5;

    if (result.killed) {
      for (const drop of result.drops) {
        this.world.spawnDrop(mob.x, mob.y, drop);
      }
      this.player.addXp(5);
    }

    // Dragon damage
    if (this.dragon && this.dragon.alive) {
      const ddx = worldPos.x - this.dragon.x;
      const ddy = worldPos.y - this.dragon.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < this.dragon.width) {
        this.dragon.takeDamage(damage);
        this.audio.playHit();
      }
    }

    return true;
  }

  // ─── ITEM USE ───

  private handleItemUse(): void {
    const held = this.player.getHeldItem();
    if (!held) return;

    const target = this.getTargetBlock();

    switch (held.type) {
      case ItemType.FLINT_AND_STEEL: {
        if (target && this.tryLightNetherPortal(target.x, target.y)) {
          this.player.consumeHeldItem();
          this.audio.playBlockPlace();
        }
        break;
      }
      case ItemType.ENDER_PEARL: {
        if (target) {
          this.player.x = target.x + 0.5;
          this.player.y = target.y + 1;
          this.player.vy = 0;
          this.player.takeDamage(5);
          this.player.removeItem(this.player.selectedSlot, 1);
          this.audio.playPortal();
        }
        break;
      }
      case ItemType.EYE_OF_ENDER: {
        if (target) {
          const blockAt = this.world.getBlock(target.x, target.y);
          if (blockAt === BlockType.END_PORTAL_FRAME) {
            this.player.removeItem(this.player.selectedSlot, 1);
            if (this.checkEndPortalComplete(target.x, target.y)) {
              this.world.setBlock(target.x, target.y, BlockType.END_PORTAL);
              this.audio.playPortal();
            }
          }
        }
        break;
      }
      case ItemType.BUCKET: {
        if (target) {
          const b = this.world.getBlock(target.x, target.y);
          if (b === BlockType.WATER) {
            this.world.setBlock(target.x, target.y, BlockType.AIR);
            this.player.inventory[this.player.selectedSlot] = { type: ItemType.WATER_BUCKET, count: 1, durability: 0 };
          } else if (b === BlockType.LAVA) {
            this.world.setBlock(target.x, target.y, BlockType.AIR);
            this.player.inventory[this.player.selectedSlot] = { type: ItemType.LAVA_BUCKET, count: 1, durability: 0 };
          }
        }
        break;
      }
      case ItemType.WATER_BUCKET:
      case ItemType.LAVA_BUCKET: {
        if (target) {
          const fluid = held.type === ItemType.WATER_BUCKET ? BlockType.WATER : BlockType.LAVA;
          const b = this.world.getBlock(target.x, target.y);
          if (!BLOCK_DATA[b]?.solid) {
            this.world.setBlock(target.x, target.y, fluid);
            this.player.inventory[this.player.selectedSlot] = { type: ItemType.BUCKET, count: 1, durability: 0 };
          }
        }
        break;
      }
      default: {
        // Food
        const itemData = ITEM_DATA[held.type];
        if (itemData && itemData.foodValue > 0) {
          if (this.player.eat()) {
            this.audio.playEat();
          }
        }
        // Potion
        if (held.type === ItemType.POTION_HEALING || held.type === ItemType.POTION_STRENGTH ||
            held.type === ItemType.POTION_SPEED || held.type === ItemType.POTION_FIRE_RESISTANCE) {
          this.player.usePotion();
          this.audio.playPickup();
        }
        break;
      }
    }
  }

  // ─── PORTAL ───

  private handlePortalCheck(dt: number): void {
    const bx = Math.floor(this.player.x);
    const by = Math.floor(this.player.y);
    const blockAt = this.world.getBlock(bx, by);
    const blockBelow = this.world.getBlock(bx, by - 1);

    if (blockAt === BlockType.NETHER_PORTAL || blockBelow === BlockType.NETHER_PORTAL) {
      this.portalTimer += dt;
      if (this.portalTimer >= PORTAL_DELAY) {
        this.portalTimer = 0;
        if (this.world.currentDimension === Dimension.OVERWORLD) {
          this.switchToNether();
        } else if (this.world.currentDimension === Dimension.NETHER) {
          this.switchToOverworld();
        }
      }
    } else if (blockAt === BlockType.END_PORTAL || blockBelow === BlockType.END_PORTAL) {
      if (this.world.currentDimension === Dimension.OVERWORLD) {
        this.switchToEnd();
      } else if (this.world.currentDimension === Dimension.END) {
        this.returnFromEnd();
      }
      this.portalTimer = 0;
    } else {
      this.portalTimer = 0;
    }
  }

  private tryLightNetherPortal(bx: number, by: number): boolean {
    for (let ox = -2; ox <= 0; ox++) {
      for (let oy = -4; oy <= 0; oy++) {
        if (this.isValidPortalFrame(bx + ox, by + oy)) {
          this.fillPortalInterior(bx + ox, by + oy);
          return true;
        }
      }
    }
    return false;
  }

  private isValidPortalFrame(left: number, bottom: number): boolean {
    for (let x = left; x < left + 4; x++) {
      if (this.world.getBlock(x, bottom) !== BlockType.OBSIDIAN) return false;
      if (this.world.getBlock(x, bottom + 4) !== BlockType.OBSIDIAN) return false;
    }
    for (let y = bottom + 1; y < bottom + 4; y++) {
      if (this.world.getBlock(left, y) !== BlockType.OBSIDIAN) return false;
      if (this.world.getBlock(left + 3, y) !== BlockType.OBSIDIAN) return false;
    }
    for (let x = left + 1; x < left + 3; x++) {
      for (let y = bottom + 1; y < bottom + 4; y++) {
        const b = this.world.getBlock(x, y);
        if (b !== BlockType.AIR && b !== BlockType.NETHER_PORTAL) return false;
      }
    }
    return true;
  }

  private fillPortalInterior(left: number, bottom: number): void {
    for (let x = left + 1; x < left + 3; x++) {
      for (let y = bottom + 1; y < bottom + 4; y++) {
        this.world.setBlock(x, y, BlockType.NETHER_PORTAL);
      }
    }
  }

  private checkEndPortalComplete(bx: number, by: number): boolean {
    const offsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1],
    ];
    for (const [ox, oy] of offsets) {
      if (this.world.getBlock(bx + ox, by + oy) !== BlockType.END_PORTAL_FRAME) return false;
    }
    return true;
  }

  // ─── DIMENSION TRANSITIONS ───

  private switchToNether(): void {
    const pos = this.world.switchDimension(Dimension.NETHER, this.player.x, this.player.y);
    this.player.x = pos.x;
    this.player.y = pos.y;
    this.player.vy = 0;
    this.mobs.mobs = [];
    this.audio.playPortal();
    this.audio.stopMusic();
    this.audio.startMusic('nether');
  }

  private switchToOverworld(): void {
    const pos = this.world.switchDimension(Dimension.OVERWORLD, this.player.x, this.player.y);
    this.player.x = pos.x;
    this.player.y = pos.y;
    this.player.vy = 0;
    this.mobs.mobs = [];
    this.audio.playPortal();
    this.audio.stopMusic();
    this.audio.startMusic('overworld');
  }

  private switchToEnd(): void {
    const pos = this.world.switchDimension(Dimension.END, this.player.x, this.player.y);
    this.player.x = pos.x;
    this.player.y = pos.y;
    this.player.vy = 0;
    this.mobs.mobs = [];
    if (!this.dragon || this.dragon.alive) {
      this.dragon = new EnderDragon(0, 80);
    }
    this.audio.playPortal();
    this.audio.stopMusic();
    this.audio.startMusic('end');
  }

  private returnFromEnd(): void {
    const pos = this.world.switchDimension(Dimension.OVERWORLD, this.player.x, this.player.y);
    this.player.x = pos.x;
    this.player.y = pos.y;
    this.player.vy = 0;
    this.mobs.mobs = [];
    this.dragon = null;
    this.audio.playPortal();
    this.audio.stopMusic();
    this.audio.startMusic('overworld');
  }

  // ─── INVENTORY CLICKS ───

  private handleInventoryClick(mx: number, my: number, rightClick: boolean): void {
    const is3x3 = this.state === GameState.CRAFTING;
    const slotIndex = this.renderer.getInventorySlotAt(mx, my, this.state);
    const craftSlot = this.renderer.getCraftingSlotAt(mx, my, this.state);

    // Crafting result (slot 200)
    if (craftSlot === 200 && this.craftingResult) {
      this.craftItem();
      this.audio.playClick();
      return;
    }

    // Crafting grid (100-108)
    if (craftSlot >= 100 && craftSlot < 200) {
      const idx = craftSlot - 100;
      this.handleSlotClick(
        this.craftingGrid[idx],
        (item) => { this.craftingGrid[idx] = item; },
        rightClick
      );
      this.updateCraftingResult();
      this.audio.playClick();
      return;
    }

    // Inventory slot (0-35)
    if (slotIndex >= 0 && slotIndex < INVENTORY_SIZE) {
      this.handleSlotClick(
        this.player.inventory[slotIndex],
        (item) => { this.player.inventory[slotIndex] = item; },
        rightClick
      );
      this.audio.playClick();
      return;
    }
  }

  private handleFurnaceClick(mx: number, my: number, rightClick: boolean): void {
    const furnaceKey = `${this.openFurnaceX}_${this.openFurnaceY}_${this.world.currentDimension}`;
    const furnace = this.world.furnaceStates.get(furnaceKey);
    if (!furnace) return;

    const slotIndex = this.renderer.getFurnaceSlotAt(mx, my);
    const invSlot = this.renderer.getInventorySlotAt(mx, my, this.state);

    if (slotIndex === 300) {
      // Furnace input
      this.handleSlotClick(furnace.input, (item) => { furnace.input = item; }, rightClick);
      this.audio.playClick();
    } else if (slotIndex === 301) {
      // Furnace fuel
      this.handleSlotClick(furnace.fuel, (item) => { furnace.fuel = item; }, rightClick);
      this.audio.playClick();
    } else if (slotIndex === 302) {
      // Furnace output (take only)
      if (furnace.output && !this.cursorItem) {
        this.cursorItem = { ...furnace.output };
        furnace.output = null;
        this.audio.playClick();
      } else if (furnace.output && this.cursorItem && this.cursorItem.type === furnace.output.type) {
        const max = ITEM_DATA[this.cursorItem.type]?.stackSize ?? 64;
        const canFit = max - this.cursorItem.count;
        const toMove = Math.min(canFit, furnace.output.count);
        this.cursorItem = { ...this.cursorItem, count: this.cursorItem.count + toMove };
        furnace.output = furnace.output.count - toMove <= 0
          ? null
          : { ...furnace.output, count: furnace.output.count - toMove };
        this.audio.playClick();
      }
    } else if (invSlot >= 0 && invSlot < INVENTORY_SIZE) {
      this.handleSlotClick(
        this.player.inventory[invSlot],
        (item) => { this.player.inventory[invSlot] = item; },
        rightClick
      );
      this.audio.playClick();
    }
  }

  private handleSlotClick(
    slotItem: ItemStack | null,
    setSlot: (item: ItemStack | null) => void,
    rightClick: boolean,
  ): void {
    if (rightClick) {
      if (this.cursorItem && !slotItem) {
        setSlot({ type: this.cursorItem.type, count: 1, durability: this.cursorItem.durability });
        this.cursorItem = this.cursorItem.count - 1 <= 0
          ? null
          : { ...this.cursorItem, count: this.cursorItem.count - 1 };
      } else if (this.cursorItem && slotItem && slotItem.type === this.cursorItem.type) {
        const max = ITEM_DATA[slotItem.type]?.stackSize ?? 64;
        if (slotItem.count < max) {
          setSlot({ ...slotItem, count: slotItem.count + 1 });
          this.cursorItem = this.cursorItem.count - 1 <= 0
            ? null
            : { ...this.cursorItem, count: this.cursorItem.count - 1 };
        }
      } else if (!this.cursorItem && slotItem) {
        const half = Math.ceil(slotItem.count / 2);
        this.cursorItem = { type: slotItem.type, count: half, durability: slotItem.durability };
        setSlot(slotItem.count - half <= 0 ? null : { ...slotItem, count: slotItem.count - half });
      } else if (this.cursorItem && slotItem) {
        const old = slotItem;
        setSlot(this.cursorItem);
        this.cursorItem = old;
      }
    } else {
      if (this.cursorItem && !slotItem) {
        setSlot(this.cursorItem);
        this.cursorItem = null;
      } else if (this.cursorItem && slotItem && slotItem.type === this.cursorItem.type) {
        const max = ITEM_DATA[slotItem.type]?.stackSize ?? 64;
        const toMove = Math.min(max - slotItem.count, this.cursorItem.count);
        setSlot({ ...slotItem, count: slotItem.count + toMove });
        this.cursorItem = this.cursorItem.count - toMove <= 0
          ? null
          : { ...this.cursorItem, count: this.cursorItem.count - toMove };
      } else if (this.cursorItem && slotItem) {
        const old = slotItem;
        setSlot(this.cursorItem);
        this.cursorItem = old;
      } else if (!this.cursorItem && slotItem) {
        this.cursorItem = slotItem;
        setSlot(null);
      }
    }
  }

  // ─── CRAFTING ───

  private updateCraftingResult(): void {
    const gridSize = this.state === GameState.CRAFTING ? 3 : 2;
    const match = CraftingSystem.findRecipe(this.craftingGrid, gridSize, gridSize);
    this.craftingResult = match ? match.result : null;
  }

  private craftItem(): void {
    if (!this.craftingResult) return;
    const gridSize = this.state === GameState.CRAFTING ? 3 : 2;
    const match = CraftingSystem.findRecipe(this.craftingGrid, gridSize, gridSize);
    if (!match) return;

    if (this.cursorItem) {
      if (this.cursorItem.type !== this.craftingResult.type) return;
      const max = ITEM_DATA[this.cursorItem.type]?.stackSize ?? 64;
      if (this.cursorItem.count + this.craftingResult.count > max) return;
      this.cursorItem = { ...this.cursorItem, count: this.cursorItem.count + this.craftingResult.count };
    } else {
      this.cursorItem = { ...this.craftingResult };
    }

    // Find the offset where the match was found - try all offsets
    for (let oy = 0; oy <= gridSize - match.recipe.height; oy++) {
      for (let ox = 0; ox <= gridSize - match.recipe.width; ox++) {
        if (CraftingSystem.matchRecipeAt(this.craftingGrid, gridSize, gridSize, match.recipe, ox, oy)) {
          this.craftingGrid = CraftingSystem.consumeIngredients(this.craftingGrid, match.recipe, gridSize, ox, oy);
          this.updateCraftingResult();
          return;
        }
      }
    }
  }

  private closeInventoryScreen(): void {
    for (let i = 0; i < this.craftingGrid.length; i++) {
      const item = this.craftingGrid[i];
      if (item) {
        this.player.addItem(item);
        this.craftingGrid[i] = null;
      }
    }
    if (this.cursorItem) {
      this.player.addItem(this.cursorItem);
      this.cursorItem = null;
    }
    this.craftingResult = null;
    this.state = GameState.PLAYING;
  }

  // ─── DROPPED ITEMS PICKUP ───

  private updateDroppedItems(dt: number): void {
    const toRemove: number[] = [];
    const playerCenterY = this.player.y + this.player.height / 2;

    for (let i = 0; i < this.world.droppedItems.length; i++) {
      const item = this.world.droppedItems[i];
      if (item.pickupDelay > 0) continue;

      const dx = this.player.x - item.x;
      const dy = playerCenterY - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetic attraction when close
      if (dist < 3 && dist > 0.1) {
        const pull = 8 * dt;
        item.x += (dx / dist) * pull;
        item.y += (dy / dist) * pull;
      }

      if (dist < PICKUP_RANGE) {
        const added = this.player.addItem(item.item);
        if (added) {
          toRemove.push(i);
          this.audio.playPickup();
        }
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.world.droppedItems.splice(toRemove[i], 1);
    }
  }

  // ─── SAVE / LOAD ───

  private async saveGame(): Promise<void> {
    const data: SaveData = {
      version: 1,
      seed: this.world.seed,
      player: this.player.serialize(),
      world: this.world.serialize(),
      mobs: this.mobs.serialize(),
      dragon: this.dragon ? this.dragon.serialize() : null,
      timestamp: Date.now(),
    };
    await this.save.save(data);
  }

  private async loadGame(): Promise<boolean> {
    const data = await this.save.load();
    if (!data) return false;

    this.world = World.deserialize(data.world as any);
    this.player = Player.deserialize(data.player as any);
    this.mobs = MobManager.deserialize(data.mobs as any);
    this.dragon = data.dragon ? EnderDragon.deserialize(data.dragon) : null;

    this.world.loadChunksAround(Math.floor(this.player.x));
    this.state = GameState.PLAYING;
    this.audio.stopMusic();

    const dim = this.world.currentDimension;
    this.audio.startMusic(dim === Dimension.NETHER ? 'nether' : dim === Dimension.END ? 'end' : 'overworld');
    return true;
  }

  private newGame(): void {
    const seed = Math.floor(Math.random() * 2147483647);
    this.world = new World(seed);
    this.world.loadChunksAround(0);

    this.player = new Player();
    // Find spawn Y
    for (let y = 128; y > 0; y--) {
      if (BLOCK_DATA[this.world.getBlock(0, y)]?.solid) {
        this.player.x = 0.5;
        this.player.y = y + 1;
        break;
      }
    }

    this.mobs = new MobManager();
    this.dragon = null;
    this.victoryTimer = 0;
    this.portalTimer = 0;
    this.autoSaveTimer = 0;
    this.resetMining();

    this.state = GameState.PLAYING;
    this.audio.stopMusic();
    this.audio.startMusic('overworld');
  }

  // ─── RENDER ───

  private render(): void {
    const furnaceKey = `${this.openFurnaceX}_${this.openFurnaceY}_${this.world.currentDimension}`;
    const furnace = this.world.furnaceStates.get(furnaceKey);
    const target = this.getTargetBlock();

    const renderState: RenderState = {
      gameState: this.state,
      player: {
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        hurtTimer: this.player.hurtTimer,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        hunger: this.player.hunger,
        maxHunger: this.player.maxHunger,
        inventory: this.player.inventory,
        armor: this.player.armor,
        selectedSlot: this.player.selectedSlot,
        xpLevel: this.player.xpLevel,
        xpProgress: this.player.xpLevel > 0 ? (this.player.xp / (this.player.xpLevel * 10 + 10)) : (this.player.xp / 10),
        mining: this.miningX >= 0,
        miningX: this.miningX,
        miningY: this.miningY,
        miningProgress: this.miningProgress,
        alive: this.player.alive,
        walkAnimTime: this.player.walkAnimTime,
        sprinting: this.player.sprinting,
      },
      world: {
        chunks: this.world.chunks,
        time: this.world.time,
        dimension: this.world.currentDimension,
        daylight: this.world.getDaylight(),
        weather: this.world.weather,
        droppedItems: this.world.droppedItems.map(d => ({ x: d.x, y: d.y, item: d.item })),
      },
      mobs: this.mobs.mobs.filter(m => m.alive).map(m => ({
        type: m.type,
        x: m.x, y: m.y,
        facing: m.facing,
        hurtTimer: m.hurtTimer,
        alive: m.alive,
        health: m.health,
        maxHealth: m.maxHealth,
        fuseTimer: m.fuseTimer,
      })),
      dragon: this.dragon ? {
        alive: this.dragon.alive,
        health: this.dragon.health,
        maxHealth: this.dragon.maxHealth,
        x: this.dragon.x, y: this.dragon.y,
        crystals: this.dragon.crystals.map(c => ({ x: c.x, y: c.y, alive: c.alive })),
        breathParticles: this.dragon.breathParticles.map(p => ({ x: p.x, y: p.y, life: p.life })),
        phase: this.dragon.phase,
        deathTimer: this.dragon.deathTimer,
      } : null,
      ui: {
        craftingGrid: this.craftingGrid,
        craftingResult: this.craftingResult,
        cursor: this.cursorItem,
        furnaceInput: furnace?.input ?? null,
        furnaceFuel: furnace?.fuel ?? null,
        furnaceOutput: furnace?.output ?? null,
        furnaceBurnProgress: furnace ? (furnace.burnTimeMax > 0 ? furnace.burnTime / furnace.burnTimeMax : 0) : 0,
        furnaceCookProgress: furnace ? (furnace.cookTimeTotal > 0 ? furnace.cookProgress / furnace.cookTimeTotal : 0) : 0,
      },
      mouseX: this.input.mouseX,
      mouseY: this.input.mouseY,
      targetBlockX: target?.x ?? -1,
      targetBlockY: target?.y ?? -1,
      hasSave: this.hasSaveFile,
      victoryTimer: this.victoryTimer,
    };

    this.renderer.render(renderState);
  }

  // ─── UTILITY ───

  private getTargetBlock(): { x: number; y: number } | null {
    const worldPos = this.renderer.camera.screenToWorld(this.input.mouseX, this.input.mouseY);
    const bx = Math.floor(worldPos.x);
    const by = Math.floor(worldPos.y);

    const dx = (bx + 0.5) - this.player.x;
    const dy = (by + 0.5) - (this.player.y + this.player.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) > PLAYER_REACH) return null;
    return { x: bx, y: by };
  }
}
