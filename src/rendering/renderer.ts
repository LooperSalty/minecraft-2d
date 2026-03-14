import {
  BlockType,
  BLOCK_DATA,
  TILE_SIZE,
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  RENDER_DISTANCE,
  MAX_LIGHT,
  Dimension,
  MobType,
  ItemType,
  ITEM_DATA,
  ItemStack,
  GameState,
  Particle,
} from '../constants';
import { Chunk } from '../world/chunk';
import { TextureManager } from './textures';

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export class Camera {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;

  constructor(width: number, height: number) {
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.zoom = 1;
  }

  follow(targetX: number, targetY: number, dt: number): void {
    const factor = 1 - Math.pow(0.9, dt * 60);
    this.x += (targetX - this.x) * factor;
    this.y += (targetY - this.y) * factor;
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const screenX = (wx - this.x) * TILE_SIZE * this.zoom + this.width / 2;
    const screenY = this.height / 2 - (wy - this.y) * TILE_SIZE * this.zoom;
    return { x: screenX, y: screenY };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const wx = (sx - this.width / 2) / (TILE_SIZE * this.zoom) + this.x;
    const wy = -(sy - this.height / 2) / (TILE_SIZE * this.zoom) + this.y;
    return { x: wx, y: wy };
  }

  getVisibleChunks(): { minCx: number; maxCx: number; minY: number; maxY: number } {
    const halfW = this.width / 2 / (TILE_SIZE * this.zoom);
    const halfH = this.height / 2 / (TILE_SIZE * this.zoom);

    const leftTile = this.x - halfW - 1;
    const rightTile = this.x + halfW + 1;
    const bottomTile = this.y - halfH - 1;
    const topTile = this.y + halfH + 1;

    const minCx = Math.floor(leftTile / CHUNK_WIDTH);
    const maxCx = Math.floor(rightTile / CHUNK_WIDTH);
    const minY = Math.max(0, Math.floor(bottomTile));
    const maxY = Math.min(CHUNK_HEIGHT - 1, Math.ceil(topTile));

    return { minCx, maxCx, minY, maxY };
  }
}

// ---------------------------------------------------------------------------
// RenderState
// ---------------------------------------------------------------------------

export interface RenderState {
  gameState: GameState;
  player: {
    x: number;
    y: number;
    facing: number;
    hurtTimer: number;
    health: number;
    maxHealth: number;
    hunger: number;
    maxHunger: number;
    inventory: (ItemStack | null)[];
    armor: (ItemStack | null)[];
    selectedSlot: number;
    xpLevel: number;
    xpProgress: number;
    mining: boolean;
    miningX: number;
    miningY: number;
    miningProgress: number;
    alive: boolean;
    walkAnimTime: number;
    sprinting: boolean;
  };
  world: {
    chunks: Map<string, Chunk>;
    time: number;
    dimension: Dimension;
    daylight: number;
    weather: string;
    droppedItems: { x: number; y: number; item: ItemStack }[];
  };
  mobs: {
    type: MobType;
    x: number;
    y: number;
    facing: number;
    hurtTimer: number;
    alive: boolean;
    health: number;
    maxHealth: number;
    fuseTimer: number;
  }[];
  dragon: {
    alive: boolean;
    health: number;
    maxHealth: number;
    x: number;
    y: number;
    crystals: { x: number; y: number; alive: boolean }[];
    breathParticles: { x: number; y: number; life: number }[];
    phase: number;
    deathTimer: number;
  } | null;
  ui: {
    craftingGrid: (ItemStack | null)[];
    craftingResult: ItemStack | null;
    cursor: ItemStack | null;
    furnaceInput: ItemStack | null;
    furnaceFuel: ItemStack | null;
    furnaceOutput: ItemStack | null;
    furnaceBurnProgress: number;
    furnaceCookProgress: number;
  };
  mouseX: number;
  mouseY: number;
  targetBlockX: number;
  targetBlockY: number;
  hasSave: boolean;
  victoryTimer: number;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const HOTBAR_SLOT_SIZE = 40;
const HOTBAR_SLOTS = 9;
const HEART_SIZE = 8;
const HUNGER_SIZE = 8;
const INV_SLOT_SIZE = 36;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private textures: TextureManager;
  camera: Camera;
  private chunkCanvases: Map<string, HTMLCanvasElement>;
  particles: Particle[];
  screenShake: number;
  private animTime: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.textures = new TextureManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.chunkCanvases = new Map();
    this.particles = [];
    this.screenShake = 0;
    this.animTime = 0;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.width = width;
    this.camera.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  // ─────────────────────────────────────────────
  // MAIN RENDER PIPELINE
  // ─────────────────────────────────────────────

  render(state: RenderState): void {
    this.animTime += 1 / 60;
    const { ctx, canvas } = this;

    // Handle menu / loading states first
    if (state.gameState === GameState.MENU) {
      this.renderMainMenu(state.hasSave);
      return;
    }
    if (state.gameState === GameState.LOADING) {
      this.renderLoadingScreen('Generating world...');
      return;
    }

    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 8;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 8;
      ctx.translate(shakeX, shakeY);
      this.screenShake = Math.max(0, this.screenShake - 0.02);
    }

    // 1. Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2-3. Sky
    this.renderSky(state.world.time, state.world.dimension);

    // 4. Weather
    if (state.world.weather === 'rain') {
      this.renderRain();
    }

    // 5. Chunks
    this.renderChunks(state.world.chunks, state.world.dimension);

    // 6. Lighting overlay
    this.renderLighting(state.world.chunks, state.world.daylight, state.world.dimension);

    // 7. Dropped items
    this.renderDroppedItems(state.world.droppedItems);

    // 8. Mobs
    this.renderMobs(state.mobs);

    // 8b. Dragon & crystals
    if (state.dragon && state.dragon.alive) {
      this.renderDragon(state.dragon);
    }

    // 9. Player
    if (state.player.alive) {
      this.renderPlayerAnimated(state.player);
    }

    // 10. Particles
    this.updateAndRenderParticles(1 / 60);

    // 15. Block highlight + mining progress
    if (state.player.alive) {
      this.renderBlockHighlight(state.targetBlockX, state.targetBlockY);
      if (state.player.mining) {
        this.renderMiningProgress(
          state.player.miningX,
          state.player.miningY,
          state.player.miningProgress,
        );
      }
    }

    ctx.restore(); // end screen shake

    // 11. HUD
    if (state.player.alive) {
      const armorValue = state.player.armor.reduce((sum, a) => {
        if (!a) return sum;
        const data = ITEM_DATA[a.type];
        return sum + ((data as any).armor ?? 0);
      }, 0);
      this.renderHUD(
        state.player.health,
        state.player.maxHealth,
        state.player.hunger,
        state.player.maxHunger,
        state.player.inventory.slice(0, 9) as (ItemStack | null)[],
        state.player.selectedSlot,
        state.player.xpLevel,
        state.player.xpProgress,
        armorValue,
      );
    }

    // 13. Boss bar
    if (state.dragon && state.dragon.alive) {
      this.renderBossBar('Ender Dragon', state.dragon.health / state.dragon.maxHealth);
    }

    // 14. Inventory/crafting/furnace screens
    if (state.gameState === GameState.INVENTORY) {
      this.renderInventoryScreen(
        state.player.inventory,
        state.player.armor,
        state.ui.craftingGrid,
        state.ui.craftingResult,
        state.ui.cursor,
        state.mouseX,
        state.mouseY,
      );
    } else if (state.gameState === GameState.CRAFTING) {
      this.renderCraftingTableScreen(
        state.player.inventory,
        state.player.armor,
        state.ui.craftingGrid,
        state.ui.craftingResult,
        state.ui.cursor,
        state.mouseX,
        state.mouseY,
      );
    } else if (state.gameState === GameState.FURNACE) {
      this.renderFurnaceScreen(
        state.player.inventory,
        state.ui.furnaceInput,
        state.ui.furnaceFuel,
        state.ui.furnaceOutput,
        state.ui.furnaceBurnProgress,
        state.ui.furnaceCookProgress,
        state.ui.cursor,
        state.mouseX,
        state.mouseY,
      );
    }

    // Death screen
    if (!state.player.alive) {
      this.renderDeathScreen();
    }

    // Victory
    if (state.victoryTimer > 0) {
      this.renderVictoryScreen(state.victoryTimer);
    }

    // Pause
    if (state.gameState === GameState.PAUSED) {
      this.renderPauseMenu();
    }
  }

  // ─────────────────────────────────────────────
  // WORLD RENDERING
  // ─────────────────────────────────────────────

  renderSky(time: number, dimension: Dimension): void {
    const { ctx, canvas } = this;

    if (dimension === Dimension.NETHER) {
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (dimension === Dimension.END) {
      ctx.fillStyle = '#0a0010';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.renderStars(0.6);
      return;
    }

    // Overworld — convert time (0..24000) to phase (0..1)
    // 0=sunrise, 0.25=noon, 0.5=sunset, 0.75=midnight
    const dayPhase = (time / 24000) % 1;
    let topColor: string;
    let bottomColor: string;

    if (dayPhase >= 0.05 && dayPhase < 0.2) {
      // Sunrise
      const t = (dayPhase - 0.05) / 0.15;
      topColor = this.lerpColor('#0a0a2e', '#87CEEB', t);
      bottomColor = this.lerpColor('#0a0a2e', '#FFA04C', t);
    } else if (dayPhase >= 0.2 && dayPhase < 0.35) {
      // Morning to day
      const t = (dayPhase - 0.2) / 0.15;
      topColor = '#87CEEB';
      bottomColor = this.lerpColor('#FFA04C', '#87CEEB', t);
    } else if (dayPhase >= 0.35 && dayPhase < 0.55) {
      // Midday
      topColor = '#87CEEB';
      bottomColor = '#87CEEB';
    } else if (dayPhase >= 0.55 && dayPhase < 0.7) {
      // Sunset
      const t = (dayPhase - 0.55) / 0.15;
      topColor = this.lerpColor('#87CEEB', '#1a0a2e', t);
      bottomColor = this.lerpColor('#87CEEB', '#FF6030', t);
    } else if (dayPhase >= 0.7 && dayPhase < 0.85) {
      // Dusk to night
      const t = (dayPhase - 0.7) / 0.15;
      topColor = this.lerpColor('#1a0a2e', '#0a0a2e', t);
      bottomColor = this.lerpColor('#FF6030', '#0a0a2e', t);
    } else {
      // Night
      topColor = '#0a0a2e';
      bottomColor = '#0a0a2e';
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars at night
    const isNight = dayPhase >= 0.7 || dayPhase < 0.05;
    if (isNight) {
      const nightness =
        dayPhase >= 0.7
          ? Math.min(1, (dayPhase - 0.7) / 0.15)
          : dayPhase < 0.05
            ? 1 - dayPhase / 0.05
            : 0;
      this.renderStars(nightness);
    }

    // Sun and moon
    this.renderCelestialBodies(dayPhase);
  }

  private renderStars(alpha: number): void {
    const { ctx, canvas } = this;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    // Deterministic star positions based on a simple seed
    const seed = 12345;
    for (let i = 0; i < 80; i++) {
      const px = ((seed * (i + 1) * 7) % canvas.width + canvas.width) % canvas.width;
      const py = ((seed * (i + 1) * 13) % (canvas.height * 0.6));
      const size = (i % 3 === 0) ? 2 : 1;
      ctx.fillRect(px, py, size, size);
    }
  }

  private renderCelestialBodies(dayPhase: number): void {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;

    // Sun — angle based on day phase (rises at 0.05, sets at 0.7)
    const sunAngle = ((dayPhase - 0.05) / 0.65) * Math.PI;
    if (dayPhase >= 0.05 && dayPhase < 0.7) {
      const sunX = cx + Math.cos(Math.PI - sunAngle) * (canvas.width * 0.4);
      const sunY = canvas.height * 0.8 - Math.sin(sunAngle) * (canvas.height * 0.7);
      ctx.fillStyle = '#FFE040';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFF80';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon — visible at night
    const moonAngle = ((dayPhase - 0.7 + 1) % 1) / 0.35 * Math.PI;
    const isNightRange = dayPhase >= 0.7 || dayPhase < 0.05;
    if (isNightRange) {
      const adjustedPhase = dayPhase >= 0.7 ? dayPhase - 0.7 : dayPhase + 0.3;
      const mAngle = (adjustedPhase / 0.35) * Math.PI;
      const moonX = cx + Math.cos(Math.PI - mAngle) * (canvas.width * 0.4);
      const moonY = canvas.height * 0.8 - Math.sin(mAngle) * (canvas.height * 0.7);
      ctx.fillStyle = '#DDDDDD';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#CCCCCC';
      ctx.beginPath();
      ctx.arc(moonX + 4, moonY - 2, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderRain(): void {
    const { ctx, canvas } = this;
    ctx.lineWidth = 1.5;

    // Darken sky slightly for rain atmosphere
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const t = this.animTime;
    const dropCount = 200;

    for (let i = 0; i < dropCount; i++) {
      // Stable random position per drop using seed
      const seed = i * 7919;
      const baseX = ((seed * 13) % canvas.width + canvas.width) % canvas.width;
      const speed = 300 + (seed % 150);
      const length = 8 + (seed % 8);

      // Drop falls continuously, wrapping around screen
      const x = baseX + Math.sin(i * 0.3) * 20;
      const y = ((t * speed + seed * 3) % (canvas.height + length)) - length;

      const alpha = 0.2 + (i % 3) * 0.1;
      ctx.strokeStyle = `rgba(170,200,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1, y + length);
      ctx.stroke();
    }
  }

  renderChunks(chunks: Map<string, Chunk>, dimension: Dimension): void {
    const { ctx } = this;
    const visible = this.camera.getVisibleChunks();
    const scale = TILE_SIZE * this.camera.zoom;

    for (let cx = visible.minCx; cx <= visible.maxCx; cx++) {
      const key = `${dimension}_${cx}`;
      const chunk = chunks.get(key);
      if (!chunk) continue;

      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        for (let ly = visible.minY; ly <= Math.min(visible.maxY, CHUNK_HEIGHT - 1); ly++) {
          const block = chunk.getBlock(lx, ly);
          if (block === BlockType.AIR) continue;

          const worldX = cx * CHUNK_WIDTH + lx;
          const screenPos = this.camera.worldToScreen(worldX, ly + 1);

          // Round to integer pixels to prevent texture bleeding / seams
          const sx = Math.round(screenPos.x);
          const sy = Math.round(screenPos.y);
          const sz = Math.round(scale) || 1;

          // Skip if off-screen
          if (sx + sz < 0 || sx > this.canvas.width) continue;
          if (sy + sz < 0 || sy > this.canvas.height) continue;

          const texture = this.textures.getBlock(block);
          if (texture) {
            const data = BLOCK_DATA[block];
            if (data && data.transparent) {
              ctx.globalAlpha = 0.7;
            }
            ctx.drawImage(texture, sx, sy, sz, sz);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(sx, sy, sz, sz);
          }
        }
      }
    }
  }

  renderLighting(chunks: Map<string, Chunk>, daylight: number, dimension?: Dimension): void {
    const { ctx } = this;
    const visible = this.camera.getVisibleChunks();
    const scale = TILE_SIZE * this.camera.zoom;
    const dim = dimension ?? Dimension.OVERWORLD;

    for (let cx = visible.minCx; cx <= visible.maxCx; cx++) {
      const chunk = chunks.get(`${dim}_${cx}`);
      if (!chunk) continue;

      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        for (let ly = visible.minY; ly <= Math.min(visible.maxY, CHUNK_HEIGHT - 1); ly++) {
          const worldX = cx * CHUNK_WIDTH + lx;
          const worldY = ly;

          const lightLevel = chunk.getLight(lx, ly);
          // Quantize daylight to 16 discrete steps to prevent shimmer
          const quantizedDaylight = Math.round(daylight * 15) / 15;
          const skyLight = Math.floor(lightLevel * quantizedDaylight);
          const effectiveLight = Math.max(skyLight, chunk.getLight(lx, ly));
          const darkness = 1 - effectiveLight / MAX_LIGHT;

          if (darkness <= 0.02) continue;

          const screenPos = this.camera.worldToScreen(worldX, worldY + 1);
          const lsx = Math.round(screenPos.x);
          const lsy = Math.round(screenPos.y);
          const lsz = Math.round(scale) || 1;
          // Quantize alpha to 8 levels to prevent per-pixel flickering
          const alpha = Math.round(darkness * 0.85 * 8) / 8;
          ctx.fillStyle = `rgba(0,0,0,${alpha})`;
          ctx.fillRect(lsx, lsy, lsz, lsz);
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // ENTITY RENDERING
  // ─────────────────────────────────────────────

  renderPlayerAnimated(p: RenderState['player']): void {
    const { ctx } = this;
    const s = TILE_SIZE * this.camera.zoom;
    const screenPos = this.camera.worldToScreen(p.x - 0.5, p.y + 1.8);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    // Hurt flash
    if (p.hurtTimer > 0 && Math.floor(p.hurtTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    const walk = p.walkAnimTime;
    const isWalking = walk > 0;
    const legSwing = isWalking ? Math.sin(walk) * 0.4 : 0;
    const armSwing = isWalking ? Math.sin(walk + Math.PI) * 0.35 : 0;
    const bodyBob = isWalking ? Math.abs(Math.sin(walk * 2)) * s * 0.04 : 0;
    const flip = p.facing < 0;

    if (flip) {
      ctx.scale(-1, 1);
      ctx.translate(-s, 0);
    }

    // ─── LEGS ───
    const legW = s * 0.2;
    const legH = s * 0.55;
    const legY = s * 1.25;

    ctx.save();
    ctx.translate(s * 0.28, legY);
    ctx.rotate(legSwing);
    ctx.fillStyle = '#3b4fba';
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    ctx.save();
    ctx.translate(s * 0.72, legY);
    ctx.rotate(-legSwing);
    ctx.fillStyle = '#3b4fba';
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    // ─── BODY (with bob) ───
    ctx.save();
    ctx.translate(0, -bodyBob);

    ctx.fillStyle = '#1e90dd';
    ctx.fillRect(s * 0.18, s * 0.5, s * 0.64, s * 0.75);
    ctx.fillStyle = '#1578c0';
    ctx.fillRect(s * 0.42, s * 0.55, s * 0.04, s * 0.6);

    // Back arm
    ctx.save();
    ctx.translate(s * 0.18, s * 0.52);
    ctx.rotate(armSwing);
    ctx.fillStyle = '#c49a6c';
    ctx.fillRect(-s * 0.16, 0, s * 0.16, s * 0.6);
    ctx.restore();

    // Front arm + held item + mining swing
    ctx.save();
    ctx.translate(s * 0.82, s * 0.52);
    const mineSwing = p.mining ? Math.sin(this.animTime * 12) * 0.6 : 0;
    ctx.rotate(-armSwing + mineSwing);
    ctx.fillStyle = '#c49a6c';
    ctx.fillRect(0, 0, s * 0.16, s * 0.6);

    const heldItem = p.inventory[p.selectedSlot];
    if (heldItem) {
      this.drawItemIconRaw(ctx, -s * 0.05, s * 0.5, s * 0.35, heldItem);
    }
    ctx.restore();

    // ─── HEAD ───
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(s * 0.18, s * 0.02, s * 0.64, s * 0.12);
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(s * 0.2, s * 0.08, s * 0.6, s * 0.42);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(s * 0.18, s * 0.08, s * 0.08, s * 0.25);
    ctx.fillRect(s * 0.74, s * 0.08, s * 0.08, s * 0.25);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s * 0.34, s * 0.2, s * 0.1, s * 0.08);
    ctx.fillRect(s * 0.56, s * 0.2, s * 0.1, s * 0.08);
    ctx.fillStyle = '#2b1a0e';
    ctx.fillRect(s * 0.37, s * 0.21, s * 0.05, s * 0.06);
    ctx.fillRect(s * 0.59, s * 0.21, s * 0.05, s * 0.06);

    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(s * 0.4, s * 0.35, s * 0.2, s * 0.03);

    ctx.restore(); // body bob
    ctx.globalAlpha = 1;
    ctx.restore(); // main
  }

  renderMobs(
    mobs: {
      type: MobType;
      x: number;
      y: number;
      facing: number;
      hurtTimer: number;
      alive: boolean;
      health: number;
      maxHealth: number;
      fuseTimer: number;
    }[],
  ): void {
    const { ctx } = this;
    const scale = TILE_SIZE * this.camera.zoom;

    for (const mob of mobs) {
      if (!mob.alive) continue;

      // mob.y = feet position, render from feet upward
      const mobH = mob.type === MobType.ENDERMAN ? 2.9
        : (mob.type === MobType.ZOMBIE || mob.type === MobType.SKELETON || mob.type === MobType.ZOMBIE_PIGLIN) ? 1.8
        : (mob.type === MobType.CREEPER) ? 1.7
        : (mob.type === MobType.COW || mob.type === MobType.SHEEP) ? 1.4
        : (mob.type === MobType.GHAST) ? 4
        : (mob.type === MobType.BLAZE) ? 1.8
        : (mob.type === MobType.SPIDER) ? 0.8
        : (mob.type === MobType.CHICKEN) ? 0.7
        : 1;
      const screenPos = this.camera.worldToScreen(mob.x - 0.5, mob.y + mobH);

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      // Flash white for creeper fuse
      const flashWhite = mob.type === MobType.CREEPER && mob.fuseTimer > 0 && Math.sin(mob.fuseTimer * 20) > 0;

      const texture = this.textures.getMob(mob.type);
      const drawH = scale * mobH;
      if (texture && !flashWhite) {
        if (mob.facing < 0) {
          ctx.scale(-1, 1);
          ctx.drawImage(texture, -scale, 0, scale, drawH);
        } else {
          ctx.drawImage(texture, 0, 0, scale, drawH);
        }
      } else {
        const color = flashWhite ? '#ffffff' : this.getMobColor(mob.type);
        const h = drawH;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, scale, h);

        // Eyes
        ctx.fillStyle = mob.type === MobType.ENDERMAN ? '#ff00ff' : '#ff0000';
        const eyeY = mob.type === MobType.ENDERMAN ? scale * 0.15 : scale * 0.25;
        const eyeOffX = mob.facing >= 0 ? scale * 0.2 : scale * 0.5;
        ctx.fillRect(eyeOffX, eyeY, scale * 0.12, scale * 0.1);
        ctx.fillRect(eyeOffX + scale * 0.2, eyeY, scale * 0.12, scale * 0.1);
      }

      // Hurt flash
      if (mob.hurtTimer > 0) {
        const h = mob.type === MobType.ENDERMAN ? scale * 2.5 : scale;
        ctx.fillStyle = `rgba(255,0,0,${mob.hurtTimer * 0.5})`;
        ctx.fillRect(0, 0, scale, h);
      }

      // Health bar if damaged
      if (mob.health < mob.maxHealth) {
        const barW = scale * 0.8;
        const barH = 4;
        const barX = scale * 0.1;
        const barY = -8;
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(barX, barY, barW * (mob.health / mob.maxHealth), barH);
      }

      ctx.restore();
    }
  }

  private getMobColor(type: MobType): string {
    switch (type) {
      case MobType.ZOMBIE:
        return '#2d6930';
      case MobType.SKELETON:
        return '#c8c8c8';
      case MobType.CREEPER:
        return '#30b030';
      case MobType.SPIDER:
        return '#4a3728';
      case MobType.ENDERMAN:
        return '#161616';
      case MobType.PIG:
        return '#f0a0a0';
      case MobType.COW:
        return '#6b4226';
      case MobType.SHEEP:
        return '#e8e8e8';
      case MobType.CHICKEN:
        return '#ffffff';
      case MobType.BLAZE:
        return '#ffaa00';
      case MobType.GHAST:
        return '#e8e8e8';
      case MobType.ZOMBIE_PIGLIN:
        return '#cc9966';
      case MobType.ENDER_DRAGON:
        return '#1a1a2e';
      default:
        return '#ff00ff';
    }
  }

  private renderDragon(
    dragon: {
      alive: boolean;
      health: number;
      maxHealth: number;
      x: number;
      y: number;
      crystals: { x: number; y: number; alive: boolean }[];
      breathParticles: { x: number; y: number; life: number }[];
      phase: number;
      deathTimer: number;
    },
  ): void {
    const { ctx } = this;
    const scale = TILE_SIZE * this.camera.zoom;

    // Draw crystals
    for (const crystal of dragon.crystals) {
      if (!crystal.alive) continue;
      const cPos = this.camera.worldToScreen(crystal.x, crystal.y + 1);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(cPos.x, cPos.y, scale * 0.5, scale);
      // Beam
      ctx.strokeStyle = 'rgba(255,0,255,0.3)';
      ctx.lineWidth = 2;
      const dPos = this.camera.worldToScreen(dragon.x, dragon.y + 2);
      ctx.beginPath();
      ctx.moveTo(cPos.x + scale * 0.25, cPos.y + scale * 0.5);
      ctx.lineTo(dPos.x + scale * 2, dPos.y + scale * 1.5);
      ctx.stroke();
    }

    // Draw dragon
    const dragonPos = this.camera.worldToScreen(dragon.x, dragon.y + 4);
    ctx.save();
    ctx.translate(dragonPos.x, dragonPos.y);

    if (dragon.deathTimer > 0) {
      ctx.globalAlpha = Math.max(0, 1 - dragon.deathTimer / 5);
    }

    // Body
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, scale, scale * 4, scale * 2);
    // Head
    ctx.fillStyle = '#25254a';
    ctx.fillRect(scale * 3.5, scale * 0.3, scale * 1.2, scale);
    // Eyes
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(scale * 4, scale * 0.5, scale * 0.3, scale * 0.2);
    ctx.fillRect(scale * 4.4, scale * 0.5, scale * 0.3, scale * 0.2);
    // Wings
    const wingFlap = Math.sin(this.animTime * 3) * scale * 0.5;
    ctx.fillStyle = '#2a1a4e';
    ctx.beginPath();
    ctx.moveTo(scale * 0.5, scale);
    ctx.lineTo(scale * -1, scale * -0.5 + wingFlap);
    ctx.lineTo(scale * 2, scale);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(scale * 2.5, scale);
    ctx.lineTo(scale * 5, scale * -0.5 + wingFlap);
    ctx.lineTo(scale * 3.5, scale);
    ctx.fill();

    ctx.restore();

    // Breath particles
    for (const bp of dragon.breathParticles) {
      const bpPos = this.camera.worldToScreen(bp.x, bp.y);
      ctx.fillStyle = `rgba(128,0,255,${bp.life})`;
      ctx.fillRect(bpPos.x, bpPos.y, 4, 4);
    }
  }

  renderDroppedItems(items: { x: number; y: number; item: ItemStack }[]): void {
    const { ctx } = this;
    const scale = TILE_SIZE * this.camera.zoom;

    for (const di of items) {
      const bob = Math.sin(this.animTime * 3 + di.x * 7) * 3;
      const screenPos = this.camera.worldToScreen(di.x, di.y + 0.5);
      const size = scale * 0.5;
      this.drawItemIconRaw(ctx, screenPos.x + scale * 0.25, screenPos.y + bob, size, di.item);
    }
  }

  // ─────────────────────────────────────────────
  // PARTICLES
  // ─────────────────────────────────────────────

  updateAndRenderParticles(dt: number): void {
    const { ctx } = this;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 9.8 * dt; // gravity
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const screenPos = this.camera.worldToScreen(p.x, p.y);
      const alpha = Math.min(1, p.life / 0.3);
      ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb(', 'rgba(');
      if (!p.color.startsWith('rgb')) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
      }
      ctx.fillRect(screenPos.x, screenPos.y, p.size * this.camera.zoom, p.size * this.camera.zoom);
      ctx.globalAlpha = 1;
    }
  }

  spawnBlockBreakParticles(x: number, y: number, blockType: BlockType): void {
    const data = BLOCK_DATA[blockType];
    const color = (data as any).color ?? '#888888';
    const count = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < count; i++) {
      const life = 0.4 + Math.random() * 0.4;
      this.particles.push({
        x: x + Math.random(),
        y: y + Math.random(),
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 1,
        life,
        maxLife: life,
        color,
        size: 2 + Math.random() * 2,
        gravity: true,
      });
    }
  }

  spawnExplosionParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const life = 0.5 + Math.random() * 0.5;
      this.particles.push({
        x: x + Math.random(),
        y: y + Math.random(),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00',
        size: 3 + Math.random() * 3,
        gravity: true,
      });
    }
  }

  spawnXpParticles(x: number, y: number, amount: number): void {
    const count = Math.min(amount * 2, 20);
    for (let i = 0; i < count; i++) {
      const life = 0.8 + Math.random() * 0.5;
      this.particles.push({
        x: x + Math.random() * 0.5 - 0.25,
        y: y + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        life,
        maxLife: life,
        color: Math.random() > 0.4 ? '#80ff40' : '#ffff40',
        size: 2 + Math.random() * 2,
        gravity: true,
      });
    }
  }

  // ─────────────────────────────────────────────
  // UI RENDERING
  // ─────────────────────────────────────────────

  renderHUD(
    health: number,
    maxHealth: number,
    hunger: number,
    maxHunger: number,
    hotbar: (ItemStack | null)[],
    selectedSlot: number,
    xpLevel: number,
    xpProgress: number,
    armor: number,
  ): void {
    const { ctx, canvas } = this;

    const hotbarWidth = HOTBAR_SLOTS * HOTBAR_SLOT_SIZE;
    const hotbarX = (canvas.width - hotbarWidth) / 2;
    const hotbarY = canvas.height - HOTBAR_SLOT_SIZE - 8;

    // XP bar
    const xpBarY = hotbarY - 10;
    const xpBarH = 5;
    ctx.fillStyle = '#222222';
    ctx.fillRect(hotbarX, xpBarY, hotbarWidth, xpBarH);
    ctx.fillStyle = '#80ff20';
    ctx.fillRect(hotbarX, xpBarY, hotbarWidth * xpProgress, xpBarH);
    ctx.strokeStyle = '#111111';
    ctx.strokeRect(hotbarX, xpBarY, hotbarWidth, xpBarH);

    // XP level
    if (xpLevel > 0) {
      this.drawText(
        `${xpLevel}`,
        canvas.width / 2,
        xpBarY - 4,
        '#80ff20',
        12,
        'center',
      );
    }

    // Hearts
    const heartsY = xpBarY - 16;
    const totalHearts = Math.ceil(maxHealth / 2);
    for (let i = 0; i < totalHearts; i++) {
      const hx = hotbarX + i * (HEART_SIZE + 2);
      const remaining = health - i * 2;
      this.drawHeart(hx, heartsY, remaining >= 2, remaining === 1);
    }

    // Armor above hearts
    if (armor > 0) {
      const armorY = heartsY - 12;
      const totalArmor = Math.ceil(armor / 2);
      for (let i = 0; i < Math.min(10, totalArmor); i++) {
        this.drawArmorIcon(hotbarX + i * (HEART_SIZE + 2), armorY);
      }
    }

    // Hunger
    const totalHunger = Math.ceil(maxHunger / 2);
    for (let i = 0; i < totalHunger; i++) {
      const hx = hotbarX + hotbarWidth - (i + 1) * (HUNGER_SIZE + 2);
      const remaining = hunger - i * 2;
      this.drawHungerIcon(hx, heartsY, remaining >= 2, remaining === 1);
    }

    // Hotbar slots
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const sx = hotbarX + i * HOTBAR_SLOT_SIZE;
      const selected = i === selectedSlot;
      this.drawSlot(sx, hotbarY, HOTBAR_SLOT_SIZE, hotbar[i], selected);
    }
  }

  renderInventoryScreen(
    inventory: (ItemStack | null)[],
    armor: (ItemStack | null)[],
    craftingGrid: (ItemStack | null)[],
    craftingResult: ItemStack | null,
    cursor: ItemStack | null,
    mouseX: number,
    mouseY: number,
  ): void {
    const { ctx, canvas } = this;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelW = INV_SLOT_SIZE * 11;
    const panelH = INV_SLOT_SIZE * 8;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2;

    // Panel background
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    this.drawText('Inventory', panelX + panelW / 2, panelY + 12, '#404040', 14, 'center');

    // Armor slots (left side)
    const armorX = panelX + INV_SLOT_SIZE * 0.5;
    const armorStartY = panelY + INV_SLOT_SIZE;
    for (let i = 0; i < 4; i++) {
      const ay = armorStartY + i * INV_SLOT_SIZE;
      const hovered = mouseX >= armorX && mouseX < armorX + INV_SLOT_SIZE &&
                      mouseY >= ay && mouseY < ay + INV_SLOT_SIZE;
      this.drawSlot(armorX, ay, INV_SLOT_SIZE, armor[i], hovered);
    }

    // 2x2 crafting grid (top right area)
    const craftX = panelX + INV_SLOT_SIZE * 6;
    const craftY = panelY + INV_SLOT_SIZE;
    this.drawText('Crafting', craftX + INV_SLOT_SIZE, craftY - 6, '#404040', 10, 'center');
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const idx = r * 2 + c;
        const sx = craftX + c * INV_SLOT_SIZE;
        const sy = craftY + r * INV_SLOT_SIZE;
        const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                        mouseY >= sy && mouseY < sy + INV_SLOT_SIZE;
        this.drawSlot(sx, sy, INV_SLOT_SIZE, craftingGrid[idx], hovered);
      }
    }

    // Arrow
    const arrowX = craftX + INV_SLOT_SIZE * 2.3;
    const arrowY = craftY + INV_SLOT_SIZE * 0.5;
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 16, arrowY + 10);
    ctx.lineTo(arrowX, arrowY + 20);
    ctx.fill();

    // Result slot
    const resultX = craftX + INV_SLOT_SIZE * 3;
    const resultY = craftY + INV_SLOT_SIZE * 0.25;
    const resultHovered = mouseX >= resultX && mouseX < resultX + INV_SLOT_SIZE &&
                          mouseY >= resultY && mouseY < resultY + INV_SLOT_SIZE;
    this.drawSlot(resultX, resultY, INV_SLOT_SIZE, craftingResult, resultHovered);

    // Main inventory (3 rows of 9)
    const invStartX = panelX + INV_SLOT_SIZE;
    const invStartY = panelY + panelH - INV_SLOT_SIZE * 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = 9 + r * 9 + c;
        const sx = invStartX + c * INV_SLOT_SIZE;
        const sy = invStartY + r * INV_SLOT_SIZE;
        const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                        mouseY >= sy && mouseY < sy + INV_SLOT_SIZE;
        this.drawSlot(sx, sy, INV_SLOT_SIZE, inventory[idx] ?? null, hovered);
      }
    }

    // Hotbar row (bottom)
    const hotbarStartY = invStartY + INV_SLOT_SIZE * 3 + 6;
    for (let c = 0; c < 9; c++) {
      const sx = invStartX + c * INV_SLOT_SIZE;
      const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                      mouseY >= hotbarStartY && mouseY < hotbarStartY + INV_SLOT_SIZE;
      this.drawSlot(sx, hotbarStartY, INV_SLOT_SIZE, inventory[c] ?? null, hovered);
    }

    // Cursor item
    if (cursor) {
      this.drawItemIcon(mouseX - INV_SLOT_SIZE / 2, mouseY - INV_SLOT_SIZE / 2, INV_SLOT_SIZE - 4, cursor);
    }
  }

  renderCraftingTableScreen(
    inventory: (ItemStack | null)[],
    armor: (ItemStack | null)[],
    craftingGrid: (ItemStack | null)[],
    craftingResult: ItemStack | null,
    cursor: ItemStack | null,
    mouseX: number,
    mouseY: number,
  ): void {
    const { ctx, canvas } = this;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelW = INV_SLOT_SIZE * 11;
    const panelH = INV_SLOT_SIZE * 9;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2;

    // Panel background
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    this.drawText('Crafting Table', panelX + panelW / 2, panelY + 12, '#404040', 14, 'center');

    // 3x3 crafting grid
    const craftX = panelX + INV_SLOT_SIZE * 1.5;
    const craftY = panelY + INV_SLOT_SIZE;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const sx = craftX + c * INV_SLOT_SIZE;
        const sy = craftY + r * INV_SLOT_SIZE;
        const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                        mouseY >= sy && mouseY < sy + INV_SLOT_SIZE;
        this.drawSlot(sx, sy, INV_SLOT_SIZE, craftingGrid[idx] ?? null, hovered);
      }
    }

    // Arrow
    const arrowX = craftX + INV_SLOT_SIZE * 3.3;
    const arrowY = craftY + INV_SLOT_SIZE * 1;
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 20, arrowY + 14);
    ctx.lineTo(arrowX, arrowY + 28);
    ctx.fill();

    // Result slot
    const resultX = craftX + INV_SLOT_SIZE * 4.5;
    const resultY = craftY + INV_SLOT_SIZE * 0.75;
    const resultHovered = mouseX >= resultX && mouseX < resultX + INV_SLOT_SIZE &&
                          mouseY >= resultY && mouseY < resultY + INV_SLOT_SIZE;
    this.drawSlot(resultX, resultY, INV_SLOT_SIZE, craftingResult, resultHovered);

    // Main inventory (3 rows of 9)
    const invStartX = panelX + INV_SLOT_SIZE;
    const invStartY = panelY + panelH - INV_SLOT_SIZE * 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = 9 + r * 9 + c;
        const sx = invStartX + c * INV_SLOT_SIZE;
        const sy = invStartY + r * INV_SLOT_SIZE;
        const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                        mouseY >= sy && mouseY < sy + INV_SLOT_SIZE;
        this.drawSlot(sx, sy, INV_SLOT_SIZE, inventory[idx] ?? null, hovered);
      }
    }

    // Hotbar row
    const hotbarStartY = invStartY + INV_SLOT_SIZE * 3 + 6;
    for (let c = 0; c < 9; c++) {
      const sx = invStartX + c * INV_SLOT_SIZE;
      const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                      mouseY >= hotbarStartY && mouseY < hotbarStartY + INV_SLOT_SIZE;
      this.drawSlot(sx, hotbarStartY, INV_SLOT_SIZE, inventory[c] ?? null, hovered);
    }

    // Cursor item
    if (cursor) {
      this.drawItemIcon(mouseX - INV_SLOT_SIZE / 2, mouseY - INV_SLOT_SIZE / 2, INV_SLOT_SIZE - 4, cursor);
    }
  }

  renderFurnaceScreen(
    inventory: (ItemStack | null)[],
    furnaceInput: ItemStack | null,
    furnaceFuel: ItemStack | null,
    furnaceOutput: ItemStack | null,
    burnProgress: number,
    cookProgress: number,
    cursor: ItemStack | null,
    mouseX: number,
    mouseY: number,
  ): void {
    const { ctx, canvas } = this;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelW = INV_SLOT_SIZE * 11;
    const panelH = INV_SLOT_SIZE * 9;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2;

    // Panel background
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    this.drawText('Furnace', panelX + panelW / 2, panelY + 12, '#404040', 14, 'center');

    const furnaceAreaX = panelX + INV_SLOT_SIZE * 3;
    const furnaceAreaY = panelY + INV_SLOT_SIZE;

    // Input slot (top)
    const inputX = furnaceAreaX;
    const inputY = furnaceAreaY;
    const inputHovered = mouseX >= inputX && mouseX < inputX + INV_SLOT_SIZE &&
                         mouseY >= inputY && mouseY < inputY + INV_SLOT_SIZE;
    this.drawSlot(inputX, inputY, INV_SLOT_SIZE, furnaceInput, inputHovered);

    // Fuel slot (bottom-left)
    const fuelX = furnaceAreaX;
    const fuelY = furnaceAreaY + INV_SLOT_SIZE * 2;
    const fuelHovered = mouseX >= fuelX && mouseX < fuelX + INV_SLOT_SIZE &&
                        mouseY >= fuelY && mouseY < fuelY + INV_SLOT_SIZE;
    this.drawSlot(fuelX, fuelY, INV_SLOT_SIZE, furnaceFuel, fuelHovered);

    // Fire icon between input and fuel
    const fireX = furnaceAreaX + INV_SLOT_SIZE * 0.2;
    const fireY = furnaceAreaY + INV_SLOT_SIZE * 1.1;
    const fireSize = INV_SLOT_SIZE * 0.6;
    ctx.fillStyle = '#444444';
    ctx.fillRect(fireX, fireY, fireSize, fireSize);
    if (burnProgress > 0) {
      const burnH = fireSize * burnProgress;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(fireX, fireY + fireSize - burnH, fireSize, burnH);
    }

    // Arrow between input/fuel area and output
    const arrowX = furnaceAreaX + INV_SLOT_SIZE * 1.5;
    const arrowY = furnaceAreaY + INV_SLOT_SIZE * 0.8;
    const arrowW = INV_SLOT_SIZE * 1.2;
    const arrowH = 20;
    ctx.fillStyle = '#555555';
    ctx.fillRect(arrowX, arrowY, arrowW, arrowH);
    if (cookProgress > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(arrowX, arrowY, arrowW * cookProgress, arrowH);
    }
    // Arrow head
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowW, arrowY - 6);
    ctx.lineTo(arrowX + arrowW + 12, arrowY + arrowH / 2);
    ctx.lineTo(arrowX + arrowW, arrowY + arrowH + 6);
    ctx.fill();

    // Output slot (right)
    const outputX = furnaceAreaX + INV_SLOT_SIZE * 3.2;
    const outputY = furnaceAreaY + INV_SLOT_SIZE * 0.5;
    const outputHovered = mouseX >= outputX && mouseX < outputX + INV_SLOT_SIZE &&
                          mouseY >= outputY && mouseY < outputY + INV_SLOT_SIZE;
    this.drawSlot(outputX, outputY, INV_SLOT_SIZE, furnaceOutput, outputHovered);

    // Main inventory (3 rows of 9)
    const invStartX = panelX + INV_SLOT_SIZE;
    const invStartY = panelY + panelH - INV_SLOT_SIZE * 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = 9 + r * 9 + c;
        const sx = invStartX + c * INV_SLOT_SIZE;
        const sy = invStartY + r * INV_SLOT_SIZE;
        const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                        mouseY >= sy && mouseY < sy + INV_SLOT_SIZE;
        this.drawSlot(sx, sy, INV_SLOT_SIZE, inventory[idx] ?? null, hovered);
      }
    }

    // Hotbar row
    const hotbarStartY = invStartY + INV_SLOT_SIZE * 3 + 6;
    for (let c = 0; c < 9; c++) {
      const sx = invStartX + c * INV_SLOT_SIZE;
      const hovered = mouseX >= sx && mouseX < sx + INV_SLOT_SIZE &&
                      mouseY >= hotbarStartY && mouseY < hotbarStartY + INV_SLOT_SIZE;
      this.drawSlot(sx, hotbarStartY, INV_SLOT_SIZE, inventory[c] ?? null, hovered);
    }

    // Cursor item
    if (cursor) {
      this.drawItemIcon(mouseX - INV_SLOT_SIZE / 2, mouseY - INV_SLOT_SIZE / 2, INV_SLOT_SIZE - 4, cursor);
    }
  }

  renderBossBar(name: string, percent: number): void {
    const { ctx, canvas } = this;
    const barW = 300;
    const barH = 12;
    const barX = (canvas.width - barW) / 2;
    const barY = 20;

    // Name
    this.drawText(name, canvas.width / 2, barY - 4, '#ffffff', 14, 'center');

    // Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(barX, barY + 14, barW, barH);

    // Fill (purple for dragon)
    ctx.fillStyle = '#9933ff';
    ctx.fillRect(barX, barY + 14, barW * Math.max(0, Math.min(1, percent)), barH);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY + 14, barW, barH);
  }

  renderMiningProgress(bx: number, by: number, progress: number): void {
    const { ctx } = this;
    const scale = TILE_SIZE * this.camera.zoom;
    const screenPos = this.camera.worldToScreen(bx, by + 1);

    // Cracking overlay - draw increasingly dense cracks
    const stage = Math.floor(progress * 8);
    ctx.strokeStyle = `rgba(0,0,0,${0.2 + progress * 0.6})`;
    ctx.lineWidth = 1;

    const sx = screenPos.x;
    const sy = screenPos.y;
    const sw = scale;
    const sh = scale;

    // Draw cracks based on stage
    if (stage >= 1) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.5, sy + sh * 0.2);
      ctx.lineTo(sx + sw * 0.4, sy + sh * 0.6);
      ctx.stroke();
    }
    if (stage >= 2) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.4, sy + sh * 0.6);
      ctx.lineTo(sx + sw * 0.2, sy + sh * 0.9);
      ctx.stroke();
    }
    if (stage >= 3) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.5, sy + sh * 0.2);
      ctx.lineTo(sx + sw * 0.7, sy + sh * 0.5);
      ctx.stroke();
    }
    if (stage >= 4) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.7, sy + sh * 0.5);
      ctx.lineTo(sx + sw * 0.9, sy + sh * 0.8);
      ctx.stroke();
    }
    if (stage >= 5) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.3, sy + sh * 0.3);
      ctx.lineTo(sx + sw * 0.1, sy + sh * 0.7);
      ctx.stroke();
    }
    if (stage >= 6) {
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.6, sy + sh * 0.1);
      ctx.lineTo(sx + sw * 0.8, sy + sh * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + sw * 0.4, sy + sh * 0.6);
      ctx.lineTo(sx + sw * 0.6, sy + sh * 0.8);
      ctx.stroke();
    }
    if (stage >= 7) {
      // Heavy cracking overlay
      ctx.fillStyle = `rgba(0,0,0,${progress * 0.3})`;
      ctx.fillRect(sx, sy, sw, sh);
    }
  }

  renderBlockHighlight(bx: number, by: number): void {
    const { ctx } = this;
    const scale = TILE_SIZE * this.camera.zoom;
    const screenPos = this.camera.worldToScreen(bx, by + 1);

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenPos.x, screenPos.y, scale, scale);
  }

  renderDeathScreen(): void {
    const { ctx, canvas } = this;

    // Red overlay
    ctx.fillStyle = 'rgba(180,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // "You Died!" text
    this.drawText('You Died!', canvas.width / 2, canvas.height / 2 - 40, '#ffffff', 36, 'center');

    // Respawn button
    const btnW = 180;
    const btnH = 40;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = canvas.height / 2 + 20;
    ctx.fillStyle = '#555555';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    this.drawText('Respawn', canvas.width / 2, btnY + 14, '#ffffff', 18, 'center');
  }

  renderVictoryScreen(timer: number): void {
    const { ctx, canvas } = this;

    // Darken
    const alpha = Math.min(0.8, timer * 0.1);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scrolling credits
    const scrollY = canvas.height - timer * 30;

    const lines = [
      'THE END',
      '',
      'You defeated the Ender Dragon!',
      '',
      'MINECRAFT 2D',
      '',
      'Programming',
      '  You',
      '',
      'Art Direction',
      '  Procedural Generation',
      '',
      'Sound Design',
      '  Your Imagination',
      '',
      'Thank you for playing!',
    ];

    for (let i = 0; i < lines.length; i++) {
      const ly = scrollY + i * 30;
      if (ly < -20 || ly > canvas.height + 20) continue;
      const size = i === 0 ? 32 : 16;
      const color = i === 0 ? '#ffdd00' : '#ffffff';
      this.drawText(lines[i], canvas.width / 2, ly, color, size, 'center');
    }

    // XP fountain particles at bottom
    if (Math.random() < 0.3) {
      this.spawnXpParticles(
        this.camera.screenToWorld(canvas.width / 2, canvas.height).x,
        this.camera.screenToWorld(canvas.width / 2, canvas.height).y,
        1,
      );
    }
  }

  renderMainMenu(hasSave: boolean): void {
    const { ctx, canvas } = this;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(0.5, '#2d1a0a');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    this.renderStars(0.5);

    // Title
    this.drawText('MINECRAFT 2D', canvas.width / 2, canvas.height * 0.22, '#ffffff', 42, 'center');
    this.drawText('MINECRAFT 2D', canvas.width / 2 + 2, canvas.height * 0.22 + 2, '#333333', 42, 'center');

    // Subtitle
    this.drawText('Browser Edition', canvas.width / 2, canvas.height * 0.22 + 40, '#aaaaaa', 16, 'center');

    // Buttons
    const btnW = 220;
    const btnH = 44;
    const btnX = (canvas.width - btnW) / 2;

    // New World button
    const newBtnY = canvas.height * 0.5;
    this.drawMenuButton(btnX, newBtnY, btnW, btnH, 'New World');

    // Continue button (if save exists)
    if (hasSave) {
      const contBtnY = canvas.height * 0.5 + 60;
      this.drawMenuButton(btnX, contBtnY, btnW, btnH, 'Continue');
    }

    // Version
    this.drawText('v0.1.0', 6, canvas.height - 10, '#666666', 10, 'left');
  }

  private drawMenuButton(x: number, y: number, w: number, h: number, text: string): void {
    const { ctx } = this;
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    this.drawText(text, x + w / 2, y + 14, '#ffffff', 18, 'center');
  }

  renderPauseMenu(): void {
    const { ctx, canvas } = this;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    this.drawText('Paused', canvas.width / 2, canvas.height * 0.3, '#ffffff', 30, 'center');

    const btnW = 200;
    const btnH = 40;
    const btnX = (canvas.width - btnW) / 2;

    // Resume
    this.drawMenuButton(btnX, canvas.height * 0.45, btnW, btnH, 'Resume');

    // Save & Quit
    this.drawMenuButton(btnX, canvas.height * 0.45 + 56, btnW, btnH, 'Save & Quit');
  }

  renderLoadingScreen(message: string): void {
    const { ctx, canvas } = this;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.drawText(message, canvas.width / 2, canvas.height / 2 - 20, '#ffffff', 20, 'center');

    // Loading bar animation
    const barW = 200;
    const barH = 8;
    const barX = (canvas.width - barW) / 2;
    const barY = canvas.height / 2 + 10;
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barW, barH);
    const fillW = (Math.sin(this.animTime * 2) * 0.5 + 0.5) * barW;
    ctx.fillStyle = '#55bb55';
    ctx.fillRect(barX, barY, fillW, barH);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  drawText(
    text: string,
    x: number,
    y: number,
    color: string,
    size: number,
    align: CanvasTextAlign = 'left',
  ): void {
    const { ctx } = this;
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';

    // Shadow
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x + 1, y + 1);

    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  drawSlot(
    x: number,
    y: number,
    size: number,
    item: ItemStack | null,
    highlight: boolean,
  ): void {
    const { ctx } = this;

    // Background
    ctx.fillStyle = highlight ? '#6e6e8e' : '#555555';
    ctx.fillRect(x, y, size, size);

    // Inner area
    ctx.fillStyle = highlight ? '#5a5a7a' : '#8b8b8b';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    if (item) {
      const padding = 4;
      this.drawItemIcon(x + padding, y + padding, size - padding * 2, item);

      // Stack count
      if (item.count > 1) {
        this.drawText(
          `${item.count}`,
          x + size - 6,
          y + size - 14,
          '#ffffff',
          10,
          'right',
        );
      }
    }
  }

  drawItemIcon(x: number, y: number, size: number, item: ItemStack): void {
    this.drawItemIconRaw(this.ctx, x, y, size, item);
  }

  private drawItemIconRaw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    item: ItemStack,
  ): void {
    const texture = this.textures.getItem(item.type);
    if (texture) {
      ctx.drawImage(texture, x, y, size, size);
    } else {
      // Fallback: draw colored square with label
      const data = ITEM_DATA[item.type];
      ctx.fillStyle = (data as any).color ?? '#ff00ff';
      ctx.fillRect(x, y, size, size);

      // Tiny text abbreviation
      const name = (data as any).name ?? '?';
      const abbr = name.substring(0, 2).toUpperCase();
      ctx.font = `bold ${Math.max(6, size * 0.35)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(abbr, x + size / 2, y + size / 2);
    }
  }

  drawHeart(x: number, y: number, full: boolean, half: boolean): void {
    const { ctx } = this;
    const s = HEART_SIZE;

    // Background (empty heart)
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(x, y, s, s);
    ctx.fillRect(x + 1, y - 1, s - 2, 1);

    if (full) {
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
      ctx.fillRect(x, y + 2, s, s - 4);
      // Highlight
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(x + 2, y + 1, 2, 2);
    } else if (half) {
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(x + 1, y + 1, (s - 2) / 2, s - 2);
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(x + 2, y + 1, 1, 2);
    }
  }

  drawHungerIcon(x: number, y: number, full: boolean, half: boolean): void {
    const { ctx } = this;
    const s = HUNGER_SIZE;

    // Background
    ctx.fillStyle = '#3a2a0a';
    ctx.fillRect(x, y, s, s);

    if (full) {
      ctx.fillStyle = '#c87030';
      ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
      // Highlight
      ctx.fillStyle = '#dda050';
      ctx.fillRect(x + 2, y + 2, 2, 2);
    } else if (half) {
      ctx.fillStyle = '#c87030';
      ctx.fillRect(x + 1, y + 1, (s - 2) / 2, s - 2);
    }
  }

  drawArmorIcon(x: number, y: number): void {
    const { ctx } = this;
    const s = HEART_SIZE;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(x, y + 2, s, s - 2);
    ctx.fillRect(x + 1, y, s - 2, s);
    // Highlight
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + 2, y + 2, 2, 2);
  }

  // ─────────────────────────────────────────────
  // SLOT HIT DETECTION
  // ─────────────────────────────────────────────

  getInventorySlotAt(mx: number, my: number, state: GameState): number {
    const { canvas } = this;

    const panelW = INV_SLOT_SIZE * 11;
    const panelH = state === GameState.INVENTORY ? INV_SLOT_SIZE * 8 : INV_SLOT_SIZE * 9;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2;

    // Main inventory (slots 9-35): 3 rows of 9
    const invStartX = panelX + INV_SLOT_SIZE;
    const invStartY = panelY + panelH - INV_SLOT_SIZE * 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        const sx = invStartX + c * INV_SLOT_SIZE;
        const sy = invStartY + r * INV_SLOT_SIZE;
        if (mx >= sx && mx < sx + INV_SLOT_SIZE && my >= sy && my < sy + INV_SLOT_SIZE) {
          return 9 + r * 9 + c;
        }
      }
    }

    // Hotbar (slots 0-8)
    const hotbarStartY = invStartY + INV_SLOT_SIZE * 3 + 6;
    for (let c = 0; c < 9; c++) {
      const sx = invStartX + c * INV_SLOT_SIZE;
      if (mx >= sx && mx < sx + INV_SLOT_SIZE && my >= hotbarStartY && my < hotbarStartY + INV_SLOT_SIZE) {
        return c;
      }
    }

    // Armor slots (inventory screen only)
    if (state === GameState.INVENTORY) {
      const armorX = panelX + INV_SLOT_SIZE * 0.5;
      const armorStartY = panelY + INV_SLOT_SIZE;
      for (let i = 0; i < 4; i++) {
        const ay = armorStartY + i * INV_SLOT_SIZE;
        if (mx >= armorX && mx < armorX + INV_SLOT_SIZE && my >= ay && my < ay + INV_SLOT_SIZE) {
          return 36 + i; // armor slots 36-39
        }
      }
    }

    return -1;
  }

  getCraftingSlotAt(mx: number, my: number, state: GameState): number {
    const { canvas } = this;

    if (state === GameState.INVENTORY) {
      // 2x2 crafting grid
      const panelW = INV_SLOT_SIZE * 11;
      const panelH = INV_SLOT_SIZE * 8;
      const panelX = (canvas.width - panelW) / 2;
      const panelY = (canvas.height - panelH) / 2;
      const craftX = panelX + INV_SLOT_SIZE * 6;
      const craftY = panelY + INV_SLOT_SIZE;

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const sx = craftX + c * INV_SLOT_SIZE;
          const sy = craftY + r * INV_SLOT_SIZE;
          if (mx >= sx && mx < sx + INV_SLOT_SIZE && my >= sy && my < sy + INV_SLOT_SIZE) {
            return 100 + r * 2 + c;
          }
        }
      }

      // Result slot
      const resultX = craftX + INV_SLOT_SIZE * 3;
      const resultY = craftY + INV_SLOT_SIZE * 0.25;
      if (mx >= resultX && mx < resultX + INV_SLOT_SIZE && my >= resultY && my < resultY + INV_SLOT_SIZE) {
        return 200;
      }
    } else if (state === GameState.CRAFTING) {
      // 3x3 crafting grid
      const panelW = INV_SLOT_SIZE * 11;
      const panelH = INV_SLOT_SIZE * 9;
      const panelX = (canvas.width - panelW) / 2;
      const panelY = (canvas.height - panelH) / 2;
      const craftX = panelX + INV_SLOT_SIZE * 1.5;
      const craftY = panelY + INV_SLOT_SIZE;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const sx = craftX + c * INV_SLOT_SIZE;
          const sy = craftY + r * INV_SLOT_SIZE;
          if (mx >= sx && mx < sx + INV_SLOT_SIZE && my >= sy && my < sy + INV_SLOT_SIZE) {
            return 100 + r * 3 + c;
          }
        }
      }

      // Result slot
      const resultX = craftX + INV_SLOT_SIZE * 4.5;
      const resultY = craftY + INV_SLOT_SIZE * 0.75;
      if (mx >= resultX && mx < resultX + INV_SLOT_SIZE && my >= resultY && my < resultY + INV_SLOT_SIZE) {
        return 200;
      }
    }

    return -1;
  }

  getFurnaceSlotAt(mx: number, my: number): number {
    const { canvas } = this;

    const panelW = INV_SLOT_SIZE * 11;
    const panelH = INV_SLOT_SIZE * 9;
    const panelX = (canvas.width - panelW) / 2;
    const panelY = (canvas.height - panelH) / 2;
    const furnaceAreaX = panelX + INV_SLOT_SIZE * 3;
    const furnaceAreaY = panelY + INV_SLOT_SIZE;

    // Input slot (300)
    const inputX = furnaceAreaX;
    const inputY = furnaceAreaY;
    if (mx >= inputX && mx < inputX + INV_SLOT_SIZE && my >= inputY && my < inputY + INV_SLOT_SIZE) {
      return 300;
    }

    // Fuel slot (301)
    const fuelX = furnaceAreaX;
    const fuelY = furnaceAreaY + INV_SLOT_SIZE * 2;
    if (mx >= fuelX && mx < fuelX + INV_SLOT_SIZE && my >= fuelY && my < fuelY + INV_SLOT_SIZE) {
      return 301;
    }

    // Output slot (302)
    const outputX = furnaceAreaX + INV_SLOT_SIZE * 3.2;
    const outputY = furnaceAreaY + INV_SLOT_SIZE * 0.5;
    if (mx >= outputX && mx < outputX + INV_SLOT_SIZE && my >= outputY && my < outputY + INV_SLOT_SIZE) {
      return 302;
    }

    return -1;
  }

  // ─────────────────────────────────────────────
  // COLOR UTILS
  // ─────────────────────────────────────────────

  private lerpColor(a: string, b: string, t: number): string {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);

    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bv = Math.round(ab + (bb - ab) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
  }

  invalidateChunkCache(chunkKey: string): void {
    // Remove all cached canvases for this chunk (across dimensions)
    for (const [key] of this.chunkCanvases) {
      if (key.startsWith(chunkKey + '_')) {
        this.chunkCanvases.delete(key);
      }
    }
  }

  clearChunkCache(): void {
    this.chunkCanvases.clear();
  }
}
