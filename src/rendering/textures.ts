import { BlockType, ItemType, MobType } from '../constants';

export class TextureManager {
  private blockTextures: Map<BlockType, HTMLCanvasElement>;
  private itemTextures: Map<ItemType, HTMLCanvasElement>;
  private mobTextures: Map<MobType, HTMLCanvasElement>;
  private playerTexture: HTMLCanvasElement;
  private playerTextureLeft: HTMLCanvasElement;

  constructor() {
    this.blockTextures = new Map();
    this.itemTextures = new Map();
    this.mobTextures = new Map();
    this.playerTexture = this.create().canvas;
    this.playerTextureLeft = this.create().canvas;
    this.generateAll();
  }

  private generateAll(): void {
    this.generateBlockTextures();
    this.generateItemTextures();
    this.generateMobTextures();
    this.generatePlayerTextures();
  }

  getBlock(type: BlockType): HTMLCanvasElement | undefined {
    return this.blockTextures.get(type);
  }

  getItem(type: ItemType): HTMLCanvasElement | undefined {
    return this.itemTextures.get(type);
  }

  getMob(type: MobType): HTMLCanvasElement | undefined {
    return this.mobTextures.get(type);
  }

  getPlayer(facing: number): HTMLCanvasElement {
    return facing < 0 ? this.playerTextureLeft : this.playerTexture;
  }

  private create(w = 16, h = 16): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  private fill(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  private rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  private noisy(ctx: CanvasRenderingContext2D, baseColor: string, variation: number): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const base = this.hexToRgb(baseColor);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = Math.floor(Math.random() * variation * 2) - variation;
        const r = Math.min(255, Math.max(0, base.r + v));
        const g = Math.min(255, Math.max(0, base.g + v));
        const b = Math.min(255, Math.max(0, base.b + v));
        this.pixel(ctx, x, y, `rgb(${r},${g},${b})`);
      }
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const full = h.length === 3
      ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
      : h;
    return {
      r: parseInt(full.substring(0, 2), 16),
      g: parseInt(full.substring(2, 4), 16),
      b: parseInt(full.substring(4, 6), 16),
    };
  }

  private stoneBase(ctx: CanvasRenderingContext2D): void {
    this.noisy(ctx, '#808080', 15);
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(Math.random() * 16);
      const y = Math.floor(Math.random() * 16);
      this.pixel(ctx, x, y, Math.random() > 0.5 ? '#707070' : '#909090');
    }
  }

  private oreSpots(ctx: CanvasRenderingContext2D, color: string, count: number): void {
    this.stoneBase(ctx);
    for (let i = 0; i < count; i++) {
      const cx = 3 + Math.floor(Math.random() * 10);
      const cy = 3 + Math.floor(Math.random() * 10);
      this.pixel(ctx, cx, cy, color);
      this.pixel(ctx, cx + 1, cy, color);
      this.pixel(ctx, cx, cy + 1, color);
      if (Math.random() > 0.3) this.pixel(ctx, cx + 1, cy + 1, color);
    }
  }

  // ─── BLOCK TEXTURES ───
  private generateBlockTextures(): void {
    // STONE
    {
      const { canvas, ctx } = this.create();
      this.stoneBase(ctx);
      this.blockTextures.set(BlockType.STONE, canvas);
    }
    // DIRT
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#8B6914', 12);
      for (let i = 0; i < 10; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#7A5C10');
      }
      this.blockTextures.set(BlockType.DIRT, canvas);
    }
    // GRASS
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#8B6914', 10);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 16; x++) {
          this.pixel(ctx, x, y, Math.random() > 0.3 ? '#4CAF50' : '#66BB6A');
        }
      }
      this.blockTextures.set(BlockType.GRASS, canvas);
    }
    // SAND
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#E8D5A3', 8);
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#DBC896');
      }
      this.blockTextures.set(BlockType.SAND, canvas);
    }
    // GRAVEL
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#878787', 15);
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 14);
        const y = Math.floor(Math.random() * 14);
        const s = 1 + Math.floor(Math.random() * 2);
        this.rect(ctx, x, y, s, s, Math.random() > 0.5 ? '#777' : '#999');
      }
      this.blockTextures.set(BlockType.GRAVEL, canvas);
    }
    // BEDROCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#333333', 12);
      for (let i = 0; i < 20; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#111111');
      }
      this.blockTextures.set(BlockType.BEDROCK, canvas);
    }
    // WATER
    {
      const { canvas, ctx } = this.create();
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const a = 0.55 + Math.random() * 0.15;
          ctx.fillStyle = `rgba(51,102,204,${a})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      this.blockTextures.set(BlockType.WATER, canvas);
    }
    // LAVA
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#FF4500');
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        this.pixel(ctx, x, y, Math.random() > 0.5 ? '#FFD700' : '#FF6600');
      }
      for (let i = 0; i < 6; i++) {
        const sx = Math.floor(Math.random() * 14);
        const sy = Math.floor(Math.random() * 14);
        this.rect(ctx, sx, sy, 2, 1, '#FFD700');
      }
      this.blockTextures.set(BlockType.LAVA, canvas);
    }
    // OAK_LOG
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#6B4423', 8);
      this.rect(ctx, 6, 0, 4, 16, '#C4A56E');
      for (let y = 0; y < 16; y += 3) {
        this.rect(ctx, 7, y, 2, 1, '#B8975A');
      }
      this.blockTextures.set(BlockType.OAK_LOG, canvas);
    }
    // OAK_LEAVES
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      const greens = ['#228B22', '#2E8B2E', '#1E7A1E'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (Math.random() > 0.15) {
            this.pixel(ctx, x, y, greens[Math.floor(Math.random() * greens.length)]);
          }
        }
      }
      this.blockTextures.set(BlockType.OAK_LEAVES, canvas);
    }
    // OAK_PLANKS
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#C4A56E');
      for (let y = 3; y < 16; y += 4) {
        this.rect(ctx, 0, y, 16, 1, '#B8975A');
      }
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#BFA060');
      }
      this.blockTextures.set(BlockType.OAK_PLANKS, canvas);
    }
    // BIRCH_LOG
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#E0DDD0');
      for (let y = 1; y < 16; y += 3) {
        const x0 = Math.floor(Math.random() * 4);
        const w = 4 + Math.floor(Math.random() * 8);
        this.rect(ctx, x0, y, w, 1, '#333333');
      }
      this.blockTextures.set(BlockType.BIRCH_LOG, canvas);
    }
    // BIRCH_LEAVES
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      const greens = ['#7CCD7C', '#8FD88F', '#6BBF6B'];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (Math.random() > 0.15) {
            this.pixel(ctx, x, y, greens[Math.floor(Math.random() * greens.length)]);
          }
        }
      }
      this.blockTextures.set(BlockType.BIRCH_LEAVES, canvas);
    }
    // BIRCH_PLANKS
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#DDD5C0');
      for (let y = 3; y < 16; y += 4) {
        this.rect(ctx, 0, y, 16, 1, '#CCC5B0');
      }
      this.blockTextures.set(BlockType.BIRCH_PLANKS, canvas);
    }
    // COBBLESTONE
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#888888');
      const shapes = [
        [0, 0, 5, 4], [6, 0, 4, 3], [11, 0, 5, 5],
        [0, 5, 4, 4], [5, 4, 6, 4], [12, 6, 4, 4],
        [0, 10, 5, 6], [6, 9, 5, 4], [12, 11, 4, 5],
        [6, 13, 5, 3],
      ];
      for (const [rx, ry, rw, rh] of shapes) {
        const shade = 0x77 + Math.floor(Math.random() * 0x33);
        const c = `rgb(${shade},${shade},${shade})`;
        this.rect(ctx, rx + 1, ry + 1, rw - 1, rh - 1, c);
        this.rect(ctx, rx, ry, rw, 1, '#666');
        this.rect(ctx, rx, ry, 1, rh, '#666');
      }
      this.blockTextures.set(BlockType.COBBLESTONE, canvas);
    }
    // MOSSY_COBBLESTONE
    {
      const { canvas, ctx } = this.create();
      const cob = this.blockTextures.get(BlockType.COBBLESTONE)!;
      ctx.drawImage(cob, 0, 0);
      for (let i = 0; i < 20; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16),
          Math.random() > 0.5 ? '#4CAF50' : '#388E3C');
      }
      this.blockTextures.set(BlockType.MOSSY_COBBLESTONE, canvas);
    }
    // ORES
    {
      const { canvas: c1, ctx: x1 } = this.create();
      this.oreSpots(x1, '#222222', 4);
      this.blockTextures.set(BlockType.COAL_ORE, c1);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#C4A56E', 3);
      this.blockTextures.set(BlockType.IRON_ORE, canvas);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#FFD700', 3);
      this.blockTextures.set(BlockType.GOLD_ORE, canvas);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#00CED1', 3);
      this.blockTextures.set(BlockType.DIAMOND_ORE, canvas);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#00C853', 3);
      this.blockTextures.set(BlockType.EMERALD_ORE, canvas);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#FF1744', 3);
      this.blockTextures.set(BlockType.REDSTONE_ORE, canvas);
    }
    {
      const { canvas, ctx } = this.create();
      this.oreSpots(ctx, '#1565C0', 3);
      this.blockTextures.set(BlockType.LAPIS_ORE, canvas);
    }
    // OBSIDIAN
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#1A0A2E', 8);
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * 14);
        const y = Math.floor(Math.random() * 16);
        this.rect(ctx, x, y, 2 + Math.floor(Math.random() * 2), 1, '#2D1B4E');
      }
      this.blockTextures.set(BlockType.OBSIDIAN, canvas);
    }
    // GLASS
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 0, 0, 16, 1, '#ADD8E6');
      this.rect(ctx, 0, 15, 16, 1, '#ADD8E6');
      this.rect(ctx, 0, 0, 1, 16, '#ADD8E6');
      this.rect(ctx, 15, 0, 1, 16, '#ADD8E6');
      this.pixel(ctx, 1, 1, '#C8E8F0');
      this.pixel(ctx, 2, 1, '#C8E8F0');
      this.pixel(ctx, 1, 2, '#C8E8F0');
      this.blockTextures.set(BlockType.GLASS, canvas);
    }
    // TORCH
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 6, 2, 6, '#8B4513');
      this.rect(ctx, 6, 3, 4, 4, '#FFD700');
      this.rect(ctx, 7, 2, 2, 2, '#FF8C00');
      this.pixel(ctx, 7, 4, '#FF8C00');
      this.pixel(ctx, 8, 4, '#FF8C00');
      this.blockTextures.set(BlockType.TORCH, canvas);
    }
    // CRAFTING_TABLE
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#6B4423');
      this.rect(ctx, 1, 1, 14, 4, '#C4A56E');
      for (let gx = 0; gx < 3; gx++) {
        for (let gy = 0; gy < 3; gy++) {
          this.rect(ctx, 2 + gx * 4, 1 + gy * 1, 3, 1, '#B8975A');
        }
      }
      this.rect(ctx, 5, 1, 1, 4, '#8B6914');
      this.rect(ctx, 10, 1, 1, 4, '#8B6914');
      this.blockTextures.set(BlockType.CRAFTING_TABLE, canvas);
    }
    // FURNACE
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#808080', 8);
      this.rect(ctx, 4, 5, 8, 8, '#555555');
      this.rect(ctx, 5, 6, 6, 6, '#333333');
      this.blockTextures.set(BlockType.FURNACE, canvas);
    }
    // FURNACE_LIT
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#808080', 8);
      this.rect(ctx, 4, 5, 8, 8, '#555555');
      this.rect(ctx, 5, 6, 6, 6, '#FF6600');
      this.rect(ctx, 6, 7, 4, 4, '#FFAA00');
      this.blockTextures.set(BlockType.FURNACE_LIT, canvas);
    }
    // CHEST
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#8B6914');
      this.rect(ctx, 0, 0, 16, 2, '#6B4423');
      this.rect(ctx, 0, 14, 16, 2, '#6B4423');
      this.rect(ctx, 0, 0, 2, 16, '#6B4423');
      this.rect(ctx, 14, 0, 2, 16, '#6B4423');
      this.rect(ctx, 7, 7, 2, 3, '#FFD700');
      this.pixel(ctx, 7, 7, '#DAA520');
      this.blockTextures.set(BlockType.CHEST, canvas);
    }
    // ENCHANTING_TABLE
    {
      const { canvas, ctx } = this.create();
      this.rect(ctx, 0, 10, 16, 6, '#1A0A2E');
      this.rect(ctx, 1, 4, 14, 6, '#8B0000');
      this.rect(ctx, 4, 2, 8, 3, '#DDD5C0');
      this.rect(ctx, 5, 1, 6, 2, '#C4A56E');
      this.noisy(ctx, '#1A0A2E', 5);
      this.rect(ctx, 1, 4, 14, 6, '#8B0000');
      this.rect(ctx, 4, 2, 8, 3, '#DDD5C0');
      this.blockTextures.set(BlockType.ENCHANTING_TABLE, canvas);
    }
    // BREWING_STAND
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 2, 2, 10, '#808080');
      this.rect(ctx, 3, 12, 10, 2, '#808080');
      this.rect(ctx, 2, 10, 3, 4, '#6666CC');
      this.rect(ctx, 11, 10, 3, 4, '#CC6666');
      this.rect(ctx, 6, 10, 4, 4, '#66CC66');
      this.blockTextures.set(BlockType.BREWING_STAND, canvas);
    }
    // ANVIL
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 2, 12, 12, 4, '#555555');
      this.rect(ctx, 5, 8, 6, 4, '#666666');
      this.rect(ctx, 3, 4, 10, 4, '#555555');
      this.rect(ctx, 1, 2, 14, 2, '#444444');
      this.blockTextures.set(BlockType.ANVIL, canvas);
    }
    // IRON_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#C0C0C0', 8);
      this.rect(ctx, 0, 0, 16, 1, '#D0D0D0');
      this.rect(ctx, 0, 0, 1, 16, '#D0D0D0');
      this.blockTextures.set(BlockType.IRON_BLOCK, canvas);
    }
    // GOLD_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#FFD700', 10);
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#FFE44D');
      }
      this.blockTextures.set(BlockType.GOLD_BLOCK, canvas);
    }
    // DIAMOND_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#00CED1', 10);
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#7FFFD4');
      }
      this.blockTextures.set(BlockType.DIAMOND_BLOCK, canvas);
    }
    // EMERALD_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#00C853', 10);
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#69F0AE');
      }
      this.blockTextures.set(BlockType.EMERALD_BLOCK, canvas);
    }
    // SNOW
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#FAFAFA', 4);
      for (let i = 0; i < 6; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#F0F0FF');
      }
      this.blockTextures.set(BlockType.SNOW, canvas);
    }
    // ICE
    {
      const { canvas, ctx } = this.create();
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = `rgba(179,229,252,${0.6 + Math.random() * 0.2})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // white cracks
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, 2);
      ctx.lineTo(8, 7);
      ctx.lineTo(12, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 10);
      ctx.lineTo(10, 13);
      ctx.stroke();
      this.blockTextures.set(BlockType.ICE, canvas);
    }
    // CLAY
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#9EA3A8', 8);
      this.blockTextures.set(BlockType.CLAY, canvas);
    }
    // SANDSTONE
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#E8D5A3', 6);
      this.rect(ctx, 0, 12, 16, 1, '#D4C090');
      this.rect(ctx, 0, 4, 16, 1, '#D4C090');
      this.blockTextures.set(BlockType.SANDSTONE, canvas);
    }
    // CACTUS
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#2E7D32');
      for (let i = 0; i < 12; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#1B5E20');
      }
      this.rect(ctx, 0, 0, 1, 16, '#1B5E20');
      this.rect(ctx, 15, 0, 1, 16, '#1B5E20');
      this.blockTextures.set(BlockType.CACTUS, canvas);
    }
    // SUGAR_CANE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 0, 2, 16, '#66BB6A');
      this.rect(ctx, 7, 0, 2, 16, '#4CAF50');
      this.rect(ctx, 11, 0, 2, 16, '#66BB6A');
      for (let y = 3; y < 16; y += 4) {
        this.rect(ctx, 2, y, 4, 1, '#388E3C');
        this.rect(ctx, 6, y + 2, 4, 1, '#388E3C');
        this.rect(ctx, 10, y, 4, 1, '#388E3C');
      }
      this.blockTextures.set(BlockType.SUGAR_CANE, canvas);
    }
    // PUMPKIN
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#FF8F00');
      this.rect(ctx, 6, 0, 4, 2, '#2E7D32');
      this.rect(ctx, 4, 5, 2, 3, '#CC7000');
      this.rect(ctx, 10, 5, 2, 3, '#CC7000');
      this.rect(ctx, 6, 10, 4, 2, '#CC7000');
      for (let i = 0; i < 6; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#E68A00');
      }
      this.blockTextures.set(BlockType.PUMPKIN, canvas);
    }
    // MELON
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#4CAF50');
      for (let x = 2; x < 16; x += 4) {
        this.rect(ctx, x, 0, 2, 16, '#81C784');
      }
      for (let i = 0; i < 6; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#388E3C');
      }
      this.blockTextures.set(BlockType.MELON, canvas);
    }
    // FARMLAND
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#6B4423');
      for (let y = 2; y < 16; y += 3) {
        this.rect(ctx, 0, y, 16, 1, '#5A3A1E');
      }
      this.noisy(ctx, '#6B4423', 6);
      for (let y = 2; y < 16; y += 3) {
        this.rect(ctx, 0, y, 16, 1, '#5A3A1E');
      }
      this.blockTextures.set(BlockType.FARMLAND, canvas);
    }
    // WHEAT
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let x = 1; x < 16; x += 3) {
        this.rect(ctx, x, 2, 1, 14, '#DAA520');
        this.rect(ctx, x, 0, 2, 3, '#DAA520');
      }
      this.blockTextures.set(BlockType.WHEAT, canvas);
    }
    // TALL_GRASS
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      const blades = [2, 4, 6, 8, 10, 12, 14];
      for (const bx of blades) {
        const h = 6 + Math.floor(Math.random() * 8);
        const startY = 16 - h;
        for (let y = startY; y < 16; y++) {
          const lean = y < startY + 3 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          this.pixel(ctx, bx + lean, y, Math.random() > 0.3 ? '#4CAF50' : '#66BB6A');
        }
      }
      this.blockTextures.set(BlockType.TALL_GRASS, canvas);
    }
    // FLOWER_RED
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 7, 2, 9, '#4CAF50');
      this.rect(ctx, 6, 3, 4, 4, '#F44336');
      this.rect(ctx, 5, 4, 1, 2, '#F44336');
      this.rect(ctx, 10, 4, 1, 2, '#F44336');
      this.pixel(ctx, 7, 4, '#FFEB3B');
      this.pixel(ctx, 8, 4, '#FFEB3B');
      this.blockTextures.set(BlockType.FLOWER_RED, canvas);
    }
    // FLOWER_YELLOW
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 7, 2, 9, '#4CAF50');
      this.rect(ctx, 6, 3, 4, 4, '#FFEB3B');
      this.rect(ctx, 5, 4, 1, 2, '#FFEB3B');
      this.rect(ctx, 10, 4, 1, 2, '#FFEB3B');
      this.pixel(ctx, 7, 4, '#FF8F00');
      this.pixel(ctx, 8, 4, '#FF8F00');
      this.blockTextures.set(BlockType.FLOWER_YELLOW, canvas);
    }
    // NETHER_PORTAL
    {
      const { canvas, ctx } = this.create();
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const v = Math.sin(x * 0.5 + y * 0.3) * 0.5 + 0.5;
          ctx.fillStyle = v > 0.5 ? `rgba(156,39,176,${0.7 + Math.random() * 0.2})` : `rgba(206,147,216,${0.5 + Math.random() * 0.3})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      this.blockTextures.set(BlockType.NETHER_PORTAL, canvas);
    }
    // NETHERRACK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#8B2500', 15);
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16),
          Math.random() > 0.5 ? '#6B1B00' : '#AB3010');
      }
      this.blockTextures.set(BlockType.NETHERRACK, canvas);
    }
    // SOUL_SAND
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#5C4033', 8);
      this.pixel(ctx, 4, 5, '#3D2B22');
      this.pixel(ctx, 5, 5, '#3D2B22');
      this.pixel(ctx, 10, 5, '#3D2B22');
      this.pixel(ctx, 11, 5, '#3D2B22');
      this.rect(ctx, 6, 8, 4, 1, '#3D2B22');
      this.rect(ctx, 5, 9, 6, 1, '#3D2B22');
      this.blockTextures.set(BlockType.SOUL_SAND, canvas);
    }
    // GLOWSTONE
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#FFD54F', 15);
      for (let i = 0; i < 10; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16),
          Math.random() > 0.5 ? '#FFEB3B' : '#FFA000');
      }
      this.blockTextures.set(BlockType.GLOWSTONE, canvas);
    }
    // NETHER_BRICKS
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#3D1F1F');
      for (let y = 0; y < 16; y += 4) {
        this.rect(ctx, 0, y, 16, 1, '#2A1515');
        const off = (y % 8 === 0) ? 0 : 4;
        for (let x = off; x < 16; x += 8) {
          this.rect(ctx, x, y, 1, 4, '#2A1515');
        }
      }
      this.blockTextures.set(BlockType.NETHER_BRICKS, canvas);
    }
    // QUARTZ_ORE
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#8B2500', 10);
      for (let i = 0; i < 4; i++) {
        const cx = 3 + Math.floor(Math.random() * 10);
        const cy = 3 + Math.floor(Math.random() * 10);
        this.pixel(ctx, cx, cy, '#FFFDE7');
        this.pixel(ctx, cx + 1, cy, '#FFFDE7');
        this.pixel(ctx, cx, cy + 1, '#FFFDE7');
      }
      this.blockTextures.set(BlockType.QUARTZ_ORE, canvas);
    }
    // MAGMA_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#8B0000');
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * 14);
        const y = Math.floor(Math.random() * 14);
        const len = 1 + Math.floor(Math.random() * 3);
        this.rect(ctx, x, y, len, 1, '#FF6600');
      }
      for (let i = 0; i < 5; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#FFD700');
      }
      this.blockTextures.set(BlockType.MAGMA_BLOCK, canvas);
    }
    // NETHER_WART_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#8B0000', 12);
      this.blockTextures.set(BlockType.NETHER_WART_BLOCK, canvas);
    }
    // END_PORTAL
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#000000');
      for (let i = 0; i < 25; i++) {
        const colors = ['#FFFFFF', '#E0E0FF', '#AAAAFF', '#FFFF88'];
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16),
          colors[Math.floor(Math.random() * colors.length)]);
      }
      this.blockTextures.set(BlockType.END_PORTAL, canvas);
    }
    // END_PORTAL_FRAME
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#008B8B');
      this.noisy(ctx, '#008B8B', 8);
      this.rect(ctx, 4, 2, 8, 5, '#006666');
      this.rect(ctx, 6, 3, 4, 3, '#004444');
      this.pixel(ctx, 7, 4, '#00CED1');
      this.pixel(ctx, 8, 4, '#00CED1');
      this.blockTextures.set(BlockType.END_PORTAL_FRAME, canvas);
    }
    // END_STONE
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#FFFDE7', 6);
      for (let i = 0; i < 6; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#E8F5E9');
      }
      this.blockTextures.set(BlockType.END_STONE, canvas);
    }
    // PURPUR_BLOCK
    {
      const { canvas, ctx } = this.create();
      this.noisy(ctx, '#AA7CB8', 8);
      for (let y = 3; y < 16; y += 4) {
        this.rect(ctx, 0, y, 16, 1, '#9966AA');
      }
      this.blockTextures.set(BlockType.PURPUR_BLOCK, canvas);
    }
    // TNT
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#FF0000');
      this.rect(ctx, 0, 0, 16, 3, '#8B4513');
      this.rect(ctx, 0, 13, 16, 3, '#8B4513');
      this.rect(ctx, 3, 5, 10, 6, '#FFFFFF');
      // T
      this.rect(ctx, 4, 6, 3, 1, '#FF0000');
      this.rect(ctx, 5, 6, 1, 4, '#FF0000');
      // N
      this.rect(ctx, 8, 6, 1, 4, '#FF0000');
      this.rect(ctx, 8, 6, 2, 1, '#FF0000');
      this.rect(ctx, 10, 6, 1, 4, '#FF0000');
      // T
      this.rect(ctx, 11, 6, 3, 1, '#FF0000');
      this.rect(ctx, 12, 6, 1, 4, '#FF0000');
      this.blockTextures.set(BlockType.TNT, canvas);
    }
    // BOOKSHELF
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#C4A56E');
      this.rect(ctx, 0, 0, 16, 2, '#C4A56E');
      this.rect(ctx, 0, 14, 16, 2, '#C4A56E');
      this.rect(ctx, 0, 7, 16, 1, '#B8975A');
      const bookColors = ['#8B4513', '#1A237E', '#B71C1C', '#1B5E20', '#4A148C', '#E65100'];
      for (let x = 1; x < 15; x += 2) {
        const c = bookColors[Math.floor(Math.random() * bookColors.length)];
        this.rect(ctx, x, 2, 2, 5, c);
        const c2 = bookColors[Math.floor(Math.random() * bookColors.length)];
        this.rect(ctx, x, 8, 2, 6, c2);
      }
      this.blockTextures.set(BlockType.BOOKSHELF, canvas);
    }
    // SPAWNER
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#333333');
      for (let x = 0; x < 16; x += 4) {
        for (let y = 0; y < 16; y += 4) {
          this.rect(ctx, x, y, 1, 4, '#222222');
          this.rect(ctx, x, y, 4, 1, '#222222');
        }
      }
      this.rect(ctx, 5, 5, 6, 6, '#111111');
      this.blockTextures.set(BlockType.SPAWNER, canvas);
    }
    // LADDER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 0, 2, 16, '#8B4513');
      this.rect(ctx, 11, 0, 2, 16, '#8B4513');
      for (let y = 2; y < 16; y += 4) {
        this.rect(ctx, 3, y, 10, 2, '#A0522D');
      }
      this.blockTextures.set(BlockType.LADDER, canvas);
    }
    // STONE_BRICKS
    {
      const { canvas, ctx } = this.create();
      this.fill(ctx, '#888888');
      for (let y = 0; y < 16; y += 4) {
        this.rect(ctx, 0, y, 16, 1, '#777777');
        const off = (y % 8 === 0) ? 0 : 4;
        for (let x = off; x < 16; x += 8) {
          this.rect(ctx, x, y, 1, 4, '#777777');
        }
      }
      for (let i = 0; i < 10; i++) {
        this.pixel(ctx, Math.floor(Math.random() * 16), Math.floor(Math.random() * 16),
          Math.random() > 0.5 ? '#808080' : '#909090');
      }
      this.blockTextures.set(BlockType.STONE_BRICKS, canvas);
    }
    // IRON_BARS
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let x = 3; x < 16; x += 5) {
        this.rect(ctx, x, 0, 1, 16, '#AAAAAA');
      }
      this.rect(ctx, 0, 3, 16, 1, '#AAAAAA');
      this.rect(ctx, 0, 12, 16, 1, '#AAAAAA');
      this.blockTextures.set(BlockType.IRON_BARS, canvas);
    }
    // END_CRYSTAL_BLOCK
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 8, '#E040FB');
      this.rect(ctx, 6, 2, 4, 12, '#E040FB');
      this.rect(ctx, 2, 6, 12, 4, '#E040FB');
      this.rect(ctx, 6, 6, 4, 4, '#F8BBD0');
      this.pixel(ctx, 7, 7, '#FFFFFF');
      this.pixel(ctx, 8, 7, '#FFFFFF');
      this.blockTextures.set(BlockType.END_CRYSTAL_BLOCK, canvas);
    }
    // AIR is not rendered
  }

  // ─── ITEM TEXTURES ───
  private generateItemTextures(): void {
    // Block items reuse block textures
    const blockItemMap: Array<[ItemType, BlockType]> = [
      [ItemType.BLOCK_STONE, BlockType.STONE],
      [ItemType.BLOCK_DIRT, BlockType.DIRT],
      [ItemType.BLOCK_GRASS, BlockType.GRASS],
      [ItemType.BLOCK_SAND, BlockType.SAND],
      [ItemType.BLOCK_GRAVEL, BlockType.GRAVEL],
      [ItemType.BLOCK_OAK_LOG, BlockType.OAK_LOG],
      [ItemType.BLOCK_OAK_PLANKS, BlockType.OAK_PLANKS],
      [ItemType.BLOCK_BIRCH_LOG, BlockType.BIRCH_LOG],
      [ItemType.BLOCK_BIRCH_PLANKS, BlockType.BIRCH_PLANKS],
      [ItemType.BLOCK_COBBLESTONE, BlockType.COBBLESTONE],
      [ItemType.BLOCK_MOSSY_COBBLESTONE, BlockType.MOSSY_COBBLESTONE],
      [ItemType.BLOCK_OBSIDIAN, BlockType.OBSIDIAN],
      [ItemType.BLOCK_GLASS, BlockType.GLASS],
      [ItemType.BLOCK_TORCH, BlockType.TORCH],
      [ItemType.BLOCK_CRAFTING_TABLE, BlockType.CRAFTING_TABLE],
      [ItemType.BLOCK_FURNACE, BlockType.FURNACE],
      [ItemType.BLOCK_CHEST, BlockType.CHEST],
      [ItemType.BLOCK_ENCHANTING_TABLE, BlockType.ENCHANTING_TABLE],
      [ItemType.BLOCK_BREWING_STAND, BlockType.BREWING_STAND],
      [ItemType.BLOCK_ANVIL, BlockType.ANVIL],
      [ItemType.BLOCK_IRON_BLOCK, BlockType.IRON_BLOCK],
      [ItemType.BLOCK_GOLD_BLOCK, BlockType.GOLD_BLOCK],
      [ItemType.BLOCK_DIAMOND_BLOCK, BlockType.DIAMOND_BLOCK],
      [ItemType.BLOCK_EMERALD_BLOCK, BlockType.EMERALD_BLOCK],
      [ItemType.BLOCK_SANDSTONE, BlockType.SANDSTONE],
      [ItemType.BLOCK_SNOW, BlockType.SNOW],
      [ItemType.BLOCK_ICE, BlockType.ICE],
      [ItemType.BLOCK_CLAY, BlockType.CLAY],
      [ItemType.BLOCK_NETHER_BRICKS, BlockType.NETHER_BRICKS],
      [ItemType.BLOCK_GLOWSTONE, BlockType.GLOWSTONE],
      [ItemType.BLOCK_SOUL_SAND, BlockType.SOUL_SAND],
      [ItemType.BLOCK_END_STONE, BlockType.END_STONE],
      [ItemType.BLOCK_PURPUR_BLOCK, BlockType.PURPUR_BLOCK],
      [ItemType.BLOCK_TNT, BlockType.TNT],
      [ItemType.BLOCK_BOOKSHELF, BlockType.BOOKSHELF],
      [ItemType.BLOCK_LADDER, BlockType.LADDER],
      [ItemType.BLOCK_PUMPKIN, BlockType.PUMPKIN],
      [ItemType.BLOCK_MELON, BlockType.MELON],
      [ItemType.BLOCK_CACTUS, BlockType.CACTUS],
      [ItemType.BLOCK_STONE_BRICKS, BlockType.STONE_BRICKS],
      [ItemType.BLOCK_IRON_BARS, BlockType.IRON_BARS],
      [ItemType.BLOCK_NETHERRACK, BlockType.NETHERRACK],
      [ItemType.BLOCK_MAGMA_BLOCK, BlockType.MAGMA_BLOCK],
    ];
    for (const [itemType, blockType] of blockItemMap) {
      const bt = this.blockTextures.get(blockType);
      if (bt) {
        this.itemTextures.set(itemType, bt);
      }
    }

    // Tool material colors
    const matColors: Record<string, string> = {
      wood: '#C4A56E', stone: '#888888', iron: '#C0C0C0', gold: '#FFD700', diamond: '#00CED1',
    };
    const handleColor = '#8B4513';

    // Pickaxes
    const pickaxes: Array<[ItemType, string]> = [
      [ItemType.WOODEN_PICKAXE, 'wood'], [ItemType.STONE_PICKAXE, 'stone'],
      [ItemType.IRON_PICKAXE, 'iron'], [ItemType.GOLD_PICKAXE, 'gold'],
      [ItemType.DIAMOND_PICKAXE, 'diamond'],
    ];
    for (const [it, mat] of pickaxes) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // handle diagonal
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, 4 + i, 8 + i, handleColor);
        this.pixel(ctx, 5 + i, 8 + i, handleColor);
      }
      // head
      this.rect(ctx, 2, 2, 12, 2, matColors[mat]);
      this.rect(ctx, 2, 4, 2, 2, matColors[mat]);
      this.rect(ctx, 12, 4, 2, 2, matColors[mat]);
      this.rect(ctx, 6, 4, 2, 3, matColors[mat]);
      this.itemTextures.set(it, canvas);
    }

    // Axes
    const axes: Array<[ItemType, string]> = [
      [ItemType.WOODEN_AXE, 'wood'], [ItemType.STONE_AXE, 'stone'],
      [ItemType.IRON_AXE, 'iron'], [ItemType.GOLD_AXE, 'gold'],
      [ItemType.DIAMOND_AXE, 'diamond'],
    ];
    for (const [it, mat] of axes) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 9; i++) {
        this.pixel(ctx, 4 + i, 7 + i, handleColor);
        this.pixel(ctx, 5 + i, 7 + i, handleColor);
      }
      this.rect(ctx, 3, 2, 5, 2, matColors[mat]);
      this.rect(ctx, 2, 4, 4, 3, matColors[mat]);
      this.rect(ctx, 2, 3, 2, 1, matColors[mat]);
      this.itemTextures.set(it, canvas);
    }

    // Swords
    const swords: Array<[ItemType, string]> = [
      [ItemType.WOODEN_SWORD, 'wood'], [ItemType.STONE_SWORD, 'stone'],
      [ItemType.IRON_SWORD, 'iron'], [ItemType.GOLD_SWORD, 'gold'],
      [ItemType.DIAMOND_SWORD, 'diamond'],
    ];
    for (const [it, mat] of swords) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // handle
      this.rect(ctx, 7, 12, 2, 4, handleColor);
      // crossguard
      this.rect(ctx, 4, 11, 8, 1, '#555555');
      // blade
      this.rect(ctx, 7, 1, 2, 10, matColors[mat]);
      this.pixel(ctx, 7, 0, matColors[mat]);
      this.itemTextures.set(it, canvas);
    }

    // Shovels
    const shovels: Array<[ItemType, string]> = [
      [ItemType.WOODEN_SHOVEL, 'wood'], [ItemType.STONE_SHOVEL, 'stone'],
      [ItemType.IRON_SHOVEL, 'iron'], [ItemType.GOLD_SHOVEL, 'gold'],
      [ItemType.DIAMOND_SHOVEL, 'diamond'],
    ];
    for (const [it, mat] of shovels) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 6, 2, 10, handleColor);
      this.rect(ctx, 6, 1, 4, 5, matColors[mat]);
      this.pixel(ctx, 7, 0, matColors[mat]);
      this.pixel(ctx, 8, 0, matColors[mat]);
      this.itemTextures.set(it, canvas);
    }

    // Hoes
    const hoes: Array<[ItemType, string]> = [
      [ItemType.WOODEN_HOE, 'wood'], [ItemType.STONE_HOE, 'stone'],
      [ItemType.IRON_HOE, 'iron'], [ItemType.GOLD_HOE, 'gold'],
      [ItemType.DIAMOND_HOE, 'diamond'],
    ];
    for (const [it, mat] of hoes) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 9; i++) {
        this.pixel(ctx, 5 + i, 7 + i, handleColor);
        this.pixel(ctx, 6 + i, 7 + i, handleColor);
      }
      this.rect(ctx, 3, 2, 6, 2, matColors[mat]);
      this.rect(ctx, 3, 4, 2, 2, matColors[mat]);
      this.itemTextures.set(it, canvas);
    }

    // Armor items (simplified icons)
    const armorMats: Array<[string, string]> = [
      ['leather', '#8B4513'], ['iron', '#C0C0C0'], ['gold', '#FFD700'], ['diamond', '#00CED1'],
    ];
    const armorItems: Array<[string, ItemType[]]> = [
      ['leather', [ItemType.LEATHER_HELMET, ItemType.LEATHER_CHESTPLATE, ItemType.LEATHER_LEGGINGS, ItemType.LEATHER_BOOTS]],
      ['iron', [ItemType.IRON_HELMET, ItemType.IRON_CHESTPLATE, ItemType.IRON_LEGGINGS, ItemType.IRON_BOOTS]],
      ['gold', [ItemType.GOLD_HELMET, ItemType.GOLD_CHESTPLATE, ItemType.GOLD_LEGGINGS, ItemType.GOLD_BOOTS]],
      ['diamond', [ItemType.DIAMOND_HELMET, ItemType.DIAMOND_CHESTPLATE, ItemType.DIAMOND_LEGGINGS, ItemType.DIAMOND_BOOTS]],
    ];
    for (const [matName, items] of armorItems) {
      const color = armorMats.find(m => m[0] === matName)![1];
      // Helmet
      {
        const { canvas, ctx } = this.create();
        ctx.clearRect(0, 0, 16, 16);
        this.rect(ctx, 3, 3, 10, 8, color);
        this.rect(ctx, 4, 2, 8, 1, color);
        this.rect(ctx, 5, 11, 6, 2, '#111');
        this.itemTextures.set(items[0], canvas);
      }
      // Chestplate
      {
        const { canvas, ctx } = this.create();
        ctx.clearRect(0, 0, 16, 16);
        this.rect(ctx, 2, 1, 5, 3, color);
        this.rect(ctx, 9, 1, 5, 3, color);
        this.rect(ctx, 2, 4, 12, 10, color);
        this.rect(ctx, 5, 4, 6, 4, '#111');
        this.itemTextures.set(items[1], canvas);
      }
      // Leggings
      {
        const { canvas, ctx } = this.create();
        ctx.clearRect(0, 0, 16, 16);
        this.rect(ctx, 3, 1, 10, 5, color);
        this.rect(ctx, 3, 6, 4, 9, color);
        this.rect(ctx, 9, 6, 4, 9, color);
        this.itemTextures.set(items[2], canvas);
      }
      // Boots
      {
        const { canvas, ctx } = this.create();
        ctx.clearRect(0, 0, 16, 16);
        this.rect(ctx, 2, 4, 4, 8, color);
        this.rect(ctx, 10, 4, 4, 8, color);
        this.rect(ctx, 1, 12, 5, 3, color);
        this.rect(ctx, 10, 12, 5, 3, color);
        this.itemTextures.set(items[3], canvas);
      }
    }

    // BOW
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // string
      this.rect(ctx, 12, 1, 1, 14, '#CCCCCC');
      // bow body curve
      for (let y = 1; y < 15; y++) {
        const x = Math.round(4 + 6 * Math.sin((y - 1) / 14 * Math.PI));
        this.pixel(ctx, x, y, '#8B4513');
        this.pixel(ctx, x - 1, y, '#8B4513');
      }
      this.itemTextures.set(ItemType.BOW, canvas);
    }
    // ARROW
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // shaft
      for (let i = 0; i < 12; i++) {
        this.pixel(ctx, 2 + i, 13 - i, '#8B4513');
      }
      // tip
      this.pixel(ctx, 14, 1, '#AAAAAA');
      this.pixel(ctx, 13, 1, '#AAAAAA');
      this.pixel(ctx, 14, 2, '#AAAAAA');
      // feathers
      this.pixel(ctx, 2, 14, '#FFFFFF');
      this.pixel(ctx, 1, 14, '#FFFFFF');
      this.pixel(ctx, 3, 14, '#FFFFFF');
      this.pixel(ctx, 2, 15, '#FFFFFF');
      this.itemTextures.set(ItemType.ARROW, canvas);
    }

    // FLINT_AND_STEEL
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 5, 4, 8, '#555555');
      this.rect(ctx, 9, 3, 4, 10, '#C0C0C0');
      this.pixel(ctx, 7, 3, '#FF8C00');
      this.pixel(ctx, 8, 2, '#FFD700');
      this.itemTextures.set(ItemType.FLINT_AND_STEEL, canvas);
    }
    // SHEARS
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 2, 3, 8, '#C0C0C0');
      this.rect(ctx, 9, 2, 3, 8, '#C0C0C0');
      this.rect(ctx, 5, 10, 2, 4, '#8B4513');
      this.rect(ctx, 9, 10, 2, 4, '#8B4513');
      this.itemTextures.set(ItemType.SHEARS, canvas);
    }
    // BUCKET
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 10, '#C0C0C0');
      this.rect(ctx, 5, 5, 6, 8, '#AAAAAA');
      this.rect(ctx, 3, 3, 10, 1, '#C0C0C0');
      this.itemTextures.set(ItemType.BUCKET, canvas);
    }
    // WATER_BUCKET
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 10, '#C0C0C0');
      this.rect(ctx, 5, 5, 6, 8, '#3366CC');
      this.rect(ctx, 3, 3, 10, 1, '#C0C0C0');
      this.itemTextures.set(ItemType.WATER_BUCKET, canvas);
    }
    // LAVA_BUCKET
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 10, '#C0C0C0');
      this.rect(ctx, 5, 5, 6, 8, '#FF4500');
      this.rect(ctx, 3, 3, 10, 1, '#C0C0C0');
      this.itemTextures.set(ItemType.LAVA_BUCKET, canvas);
    }
    // COAL
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 5, 8, 7, '#222222');
      this.rect(ctx, 5, 4, 6, 1, '#333333');
      this.rect(ctx, 5, 12, 6, 1, '#111111');
      this.pixel(ctx, 6, 7, '#444444');
      this.pixel(ctx, 9, 9, '#444444');
      this.itemTextures.set(ItemType.COAL, canvas);
    }
    // IRON_INGOT
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 6, 10, 5, '#C0C0C0');
      this.rect(ctx, 4, 5, 8, 1, '#D0D0D0');
      this.rect(ctx, 5, 11, 6, 1, '#AAAAAA');
      this.pixel(ctx, 5, 7, '#D8D8D8');
      this.itemTextures.set(ItemType.IRON_INGOT, canvas);
    }
    // GOLD_INGOT
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 6, 10, 5, '#FFD700');
      this.rect(ctx, 4, 5, 8, 1, '#FFE44D');
      this.rect(ctx, 5, 11, 6, 1, '#DAA520');
      this.pixel(ctx, 5, 7, '#FFEC80');
      this.itemTextures.set(ItemType.GOLD_INGOT, canvas);
    }
    // DIAMOND
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // rotated square (diamond shape)
      this.rect(ctx, 7, 3, 2, 2, '#00CED1');
      this.rect(ctx, 5, 5, 6, 2, '#00CED1');
      this.rect(ctx, 3, 7, 10, 2, '#00CED1');
      this.rect(ctx, 5, 9, 6, 2, '#00CED1');
      this.rect(ctx, 7, 11, 2, 2, '#00CED1');
      this.pixel(ctx, 6, 7, '#7FFFD4');
      this.pixel(ctx, 7, 6, '#7FFFD4');
      this.itemTextures.set(ItemType.DIAMOND, canvas);
    }
    // EMERALD
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 2, 4, 2, '#00C853');
      this.rect(ctx, 4, 4, 8, 3, '#00C853');
      this.rect(ctx, 3, 6, 10, 4, '#00C853');
      this.rect(ctx, 4, 10, 8, 2, '#00C853');
      this.rect(ctx, 6, 12, 4, 2, '#00C853');
      this.pixel(ctx, 6, 6, '#69F0AE');
      this.pixel(ctx, 7, 5, '#69F0AE');
      this.itemTextures.set(ItemType.EMERALD, canvas);
    }
    // REDSTONE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 5, 6, 6, '#FF1744');
      this.pixel(ctx, 7, 4, '#FF1744');
      this.pixel(ctx, 8, 4, '#FF1744');
      this.pixel(ctx, 4, 7, '#FF1744');
      this.pixel(ctx, 11, 8, '#FF1744');
      this.pixel(ctx, 6, 6, '#FF5252');
      this.itemTextures.set(ItemType.REDSTONE, canvas);
    }
    // LAPIS_LAZULI
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 4, 6, 8, '#1565C0');
      this.rect(ctx, 6, 3, 4, 1, '#1565C0');
      this.rect(ctx, 6, 12, 4, 1, '#1565C0');
      this.pixel(ctx, 7, 6, '#42A5F5');
      this.itemTextures.set(ItemType.LAPIS_LAZULI, canvas);
    }
    // QUARTZ
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 4, 6, 8, '#FFFDE7');
      this.rect(ctx, 6, 3, 4, 1, '#FFFDE7');
      this.pixel(ctx, 7, 6, '#FFFFFF');
      this.itemTextures.set(ItemType.QUARTZ, canvas);
    }
    // FLINT
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 3, 4, 3, '#555555');
      this.rect(ctx, 5, 6, 6, 4, '#444444');
      this.rect(ctx, 6, 10, 4, 3, '#333333');
      this.itemTextures.set(ItemType.FLINT, canvas);
    }
    // STICK
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 12; i++) {
        this.pixel(ctx, 6 + Math.floor(i / 3), 2 + i, '#8B4513');
        this.pixel(ctx, 7 + Math.floor(i / 3), 2 + i, '#8B4513');
      }
      this.itemTextures.set(ItemType.STICK, canvas);
    }
    // STRING
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 14; i++) {
        this.pixel(ctx, 7 + (i % 2 === 0 ? 0 : 1), 1 + i, '#CCCCCC');
      }
      this.itemTextures.set(ItemType.STRING, canvas);
    }
    // FEATHER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 12; i++) {
        this.pixel(ctx, 8 - Math.floor(i / 3), 2 + i, '#FFFFFF');
      }
      this.rect(ctx, 4, 4, 3, 6, '#E0E0E0');
      this.rect(ctx, 8, 3, 3, 5, '#E0E0E0');
      this.itemTextures.set(ItemType.FEATHER, canvas);
    }
    // LEATHER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 3, 8, 10, '#8B4513');
      this.rect(ctx, 5, 4, 6, 8, '#A0522D');
      this.itemTextures.set(ItemType.LEATHER, canvas);
    }
    // BONE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 4, 4, 8, '#F5F5F5');
      this.rect(ctx, 5, 3, 2, 2, '#F5F5F5');
      this.rect(ctx, 9, 3, 2, 2, '#F5F5F5');
      this.rect(ctx, 5, 11, 2, 2, '#F5F5F5');
      this.rect(ctx, 9, 11, 2, 2, '#F5F5F5');
      this.itemTextures.set(ItemType.BONE, canvas);
    }
    // GUNPOWDER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 20; i++) {
        this.pixel(ctx, 4 + Math.floor(Math.random() * 8), 4 + Math.floor(Math.random() * 8), '#444444');
      }
      this.itemTextures.set(ItemType.GUNPOWDER, canvas);
    }
    // ENDER_PEARL
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 4, 6, 8, '#004D40');
      this.rect(ctx, 4, 6, 8, 4, '#004D40');
      this.rect(ctx, 6, 3, 4, 1, '#004D40');
      this.rect(ctx, 6, 12, 4, 1, '#004D40');
      this.rect(ctx, 6, 6, 4, 4, '#00897B');
      this.pixel(ctx, 7, 7, '#4DB6AC');
      this.pixel(ctx, 8, 8, '#4DB6AC');
      this.itemTextures.set(ItemType.ENDER_PEARL, canvas);
    }
    // BLAZE_ROD
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 1, 2, 14, '#FF8C00');
      this.pixel(ctx, 6, 3, '#FFD700');
      this.pixel(ctx, 9, 3, '#FFD700');
      this.pixel(ctx, 6, 8, '#FFD700');
      this.pixel(ctx, 9, 8, '#FFD700');
      this.pixel(ctx, 7, 2, '#FFD54F');
      this.pixel(ctx, 8, 2, '#FFD54F');
      this.itemTextures.set(ItemType.BLAZE_ROD, canvas);
    }
    // BLAZE_POWDER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 16; i++) {
        this.pixel(ctx, 4 + Math.floor(Math.random() * 8), 4 + Math.floor(Math.random() * 8),
          Math.random() > 0.5 ? '#FFD700' : '#FF8C00');
      }
      this.itemTextures.set(ItemType.BLAZE_POWDER, canvas);
    }
    // GHAST_TEAR
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 3, 4, 6, '#E0E0FF');
      this.rect(ctx, 7, 9, 2, 4, '#E0E0FF');
      this.pixel(ctx, 7, 13, '#E0E0FF');
      this.pixel(ctx, 7, 5, '#FFFFFF');
      this.itemTextures.set(ItemType.GHAST_TEAR, canvas);
    }
    // NETHER_WART
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 8, 6, 6, '#8B0000');
      this.rect(ctx, 4, 6, 3, 3, '#8B0000');
      this.rect(ctx, 9, 6, 3, 3, '#8B0000');
      this.rect(ctx, 6, 4, 4, 3, '#8B0000');
      this.itemTextures.set(ItemType.NETHER_WART, canvas);
    }
    // EYE_OF_ENDER
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 5, 8, 6, '#00C853');
      this.rect(ctx, 5, 4, 6, 1, '#00C853');
      this.rect(ctx, 5, 11, 6, 1, '#00C853');
      this.rect(ctx, 6, 6, 4, 4, '#004D40');
      this.pixel(ctx, 7, 7, '#111111');
      this.pixel(ctx, 8, 8, '#111111');
      this.itemTextures.set(ItemType.EYE_OF_ENDER, canvas);
    }
    // BOOK
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 2, 10, 12, '#8B4513');
      this.rect(ctx, 4, 3, 8, 10, '#DDD5C0');
      this.rect(ctx, 5, 5, 6, 1, '#888');
      this.rect(ctx, 5, 7, 6, 1, '#888');
      this.rect(ctx, 5, 9, 4, 1, '#888');
      this.itemTextures.set(ItemType.BOOK, canvas);
    }

    // Food items
    // RAW_BEEF
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 4, 10, 8, '#CC3333');
      this.rect(ctx, 5, 5, 3, 4, '#FFCCCC');
      this.rect(ctx, 9, 6, 2, 3, '#FF6666');
      this.itemTextures.set(ItemType.RAW_BEEF, canvas);
    }
    // COOKED_BEEF
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 4, 10, 8, '#8B4513');
      this.rect(ctx, 5, 5, 3, 4, '#A0522D');
      this.rect(ctx, 9, 6, 2, 3, '#6B3410');
      this.itemTextures.set(ItemType.COOKED_BEEF, canvas);
    }
    // RAW_PORKCHOP
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 5, 10, 7, '#FFCCCC');
      this.rect(ctx, 4, 6, 4, 3, '#FF8888');
      this.rect(ctx, 9, 7, 3, 2, '#FFAAAA');
      this.itemTextures.set(ItemType.RAW_PORKCHOP, canvas);
    }
    // COOKED_PORKCHOP
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 5, 10, 7, '#A0522D');
      this.rect(ctx, 4, 6, 4, 3, '#8B4513');
      this.rect(ctx, 9, 7, 3, 2, '#6B3410');
      this.itemTextures.set(ItemType.COOKED_PORKCHOP, canvas);
    }
    // RAW_CHICKEN
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 8, '#FFCCAA');
      this.rect(ctx, 7, 12, 2, 3, '#8B4513');
      this.pixel(ctx, 6, 5, '#FFE0CC');
      this.itemTextures.set(ItemType.RAW_CHICKEN, canvas);
    }
    // COOKED_CHICKEN
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 4, 4, 8, 8, '#CD853F');
      this.rect(ctx, 7, 12, 2, 3, '#8B4513');
      this.pixel(ctx, 6, 5, '#DAA520');
      this.itemTextures.set(ItemType.COOKED_CHICKEN, canvas);
    }
    // BREAD
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 2, 7, 12, 5, '#DAA520');
      this.rect(ctx, 3, 6, 10, 1, '#C4A56E');
      this.rect(ctx, 4, 5, 8, 1, '#C4A56E');
      this.rect(ctx, 3, 8, 10, 2, '#E8C860');
      this.itemTextures.set(ItemType.BREAD, canvas);
    }
    // APPLE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 5, 6, 7, '#F44336');
      this.rect(ctx, 4, 6, 8, 5, '#F44336');
      this.rect(ctx, 7, 3, 2, 2, '#4CAF50');
      this.rect(ctx, 7, 2, 1, 2, '#8B4513');
      this.pixel(ctx, 6, 6, '#FF6659');
      this.itemTextures.set(ItemType.APPLE, canvas);
    }
    // GOLDEN_APPLE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 5, 5, 6, 7, '#FFD700');
      this.rect(ctx, 4, 6, 8, 5, '#FFD700');
      this.rect(ctx, 7, 3, 2, 2, '#4CAF50');
      this.rect(ctx, 7, 2, 1, 2, '#8B4513');
      this.pixel(ctx, 6, 6, '#FFE44D');
      this.itemTextures.set(ItemType.GOLDEN_APPLE, canvas);
    }
    // MELON_SLICE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 3, 5, 10, 7, '#FF6659');
      this.rect(ctx, 3, 11, 10, 2, '#4CAF50');
      for (let i = 0; i < 4; i++) {
        this.pixel(ctx, 5 + i * 2, 8, '#333');
      }
      this.itemTextures.set(ItemType.MELON_SLICE, canvas);
    }

    // Potions
    const potionColors: Array<[ItemType, string]> = [
      [ItemType.POTION_HEALING, '#FF1744'],
      [ItemType.POTION_STRENGTH, '#8B0000'],
      [ItemType.POTION_SPEED, '#03A9F4'],
      [ItemType.POTION_FIRE_RESISTANCE, '#FF6600'],
    ];
    for (const [it, color] of potionColors) {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 2, 4, 3, '#E0E0E0');
      this.rect(ctx, 4, 5, 8, 8, color);
      this.rect(ctx, 5, 13, 6, 1, color);
      this.pixel(ctx, 6, 6, '#FFFFFF');
      this.itemTextures.set(it, canvas);
    }
    // GLASS_BOTTLE
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 2, 4, 3, '#E0E0E0');
      this.rect(ctx, 4, 5, 1, 8, '#ADD8E6');
      this.rect(ctx, 11, 5, 1, 8, '#ADD8E6');
      this.rect(ctx, 5, 13, 6, 1, '#ADD8E6');
      this.rect(ctx, 4, 5, 8, 1, '#ADD8E6');
      this.itemTextures.set(ItemType.GLASS_BOTTLE, canvas);
    }

    // Special items
    // DRAGON_BREATH
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 2, 4, 3, '#E0E0E0');
      this.rect(ctx, 4, 5, 8, 8, '#9C27B0');
      this.rect(ctx, 5, 13, 6, 1, '#9C27B0');
      this.pixel(ctx, 6, 6, '#E040FB');
      this.itemTextures.set(ItemType.DRAGON_BREATH, canvas);
    }
    // NETHER_STAR
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      // star shape
      this.rect(ctx, 7, 2, 2, 12, '#FFFDE7');
      this.rect(ctx, 2, 7, 12, 2, '#FFFDE7');
      this.rect(ctx, 4, 4, 2, 2, '#FFFDE7');
      this.rect(ctx, 10, 4, 2, 2, '#FFFDE7');
      this.rect(ctx, 4, 10, 2, 2, '#FFFDE7');
      this.rect(ctx, 10, 10, 2, 2, '#FFFDE7');
      this.rect(ctx, 6, 6, 4, 4, '#FFFFFF');
      this.itemTextures.set(ItemType.NETHER_STAR, canvas);
    }
    // OAK_SAPLING
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 9, 2, 6, '#8B4513');
      this.rect(ctx, 5, 4, 6, 5, '#4CAF50');
      this.rect(ctx, 6, 2, 4, 3, '#66BB6A');
      this.itemTextures.set(ItemType.OAK_SAPLING, canvas);
    }
    // BIRCH_SAPLING
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 7, 9, 2, 6, '#E0DDD0');
      this.rect(ctx, 5, 4, 6, 5, '#7CCD7C');
      this.rect(ctx, 6, 2, 4, 3, '#8FD88F');
      this.itemTextures.set(ItemType.BIRCH_SAPLING, canvas);
    }
    // WHEAT_SEEDS
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      const positions = [[5, 7], [8, 6], [7, 9], [10, 8], [6, 11], [9, 10]];
      for (const [sx, sy] of positions) {
        this.pixel(ctx, sx, sy, '#4CAF50');
        this.pixel(ctx, sx + 1, sy, '#66BB6A');
      }
      this.itemTextures.set(ItemType.WHEAT_SEEDS, canvas);
    }
    // SUGAR_CANE_ITEM
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      this.rect(ctx, 6, 1, 3, 14, '#66BB6A');
      this.rect(ctx, 5, 4, 5, 1, '#388E3C');
      this.rect(ctx, 5, 9, 5, 1, '#388E3C');
      this.itemTextures.set(ItemType.SUGAR_CANE_ITEM, canvas);
    }
    // BONE_MEAL
    {
      const { canvas, ctx } = this.create();
      ctx.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 16; i++) {
        this.pixel(ctx, 4 + Math.floor(Math.random() * 8), 4 + Math.floor(Math.random() * 8), '#F5F5F5');
      }
      this.itemTextures.set(ItemType.BONE_MEAL, canvas);
    }
    // IRON_ORE / GOLD_ORE items
    {
      const io = this.blockTextures.get(BlockType.IRON_ORE);
      if (io) this.itemTextures.set(ItemType.IRON_ORE, io);
      const go = this.blockTextures.get(BlockType.GOLD_ORE);
      if (go) this.itemTextures.set(ItemType.GOLD_ORE, go);
    }
  }

  // ─── MOB TEXTURES ───
  private generateMobTextures(): void {
    // ZOMBIE (10x32)
    {
      const { canvas, ctx } = this.create(10, 32);
      ctx.clearRect(0, 0, 10, 32);
      // head 8x8 centered
      this.rect(ctx, 1, 0, 8, 8, '#4CAF50');
      // eyes
      this.rect(ctx, 2, 3, 2, 2, '#111111');
      this.rect(ctx, 6, 3, 2, 2, '#111111');
      // mouth
      this.rect(ctx, 3, 6, 4, 1, '#333333');
      // body
      this.rect(ctx, 1, 8, 8, 12, '#1565C0');
      // torn shirt detail
      this.pixel(ctx, 2, 18, '#4CAF50');
      this.pixel(ctx, 7, 17, '#4CAF50');
      this.pixel(ctx, 3, 19, '#1565C0');
      // arms
      this.rect(ctx, 0, 8, 1, 10, '#4CAF50');
      this.rect(ctx, 9, 8, 1, 10, '#4CAF50');
      // legs
      this.rect(ctx, 1, 20, 3, 12, '#795548');
      this.rect(ctx, 6, 20, 3, 12, '#795548');
      this.mobTextures.set(MobType.ZOMBIE, canvas);
    }
    // SKELETON (10x32)
    {
      const { canvas, ctx } = this.create(10, 32);
      ctx.clearRect(0, 0, 10, 32);
      // head
      this.rect(ctx, 1, 0, 8, 8, '#F5F5F5');
      this.rect(ctx, 2, 3, 2, 2, '#111111');
      this.rect(ctx, 6, 3, 2, 2, '#111111');
      this.rect(ctx, 3, 6, 4, 1, '#333333');
      this.pixel(ctx, 4, 6, '#111111');
      this.pixel(ctx, 6, 6, '#111111');
      // spine
      this.rect(ctx, 4, 8, 2, 12, '#F5F5F5');
      // ribs
      this.rect(ctx, 2, 9, 6, 1, '#E0E0E0');
      this.rect(ctx, 2, 11, 6, 1, '#E0E0E0');
      this.rect(ctx, 2, 13, 6, 1, '#E0E0E0');
      // arms
      this.rect(ctx, 0, 8, 1, 10, '#E0E0E0');
      this.rect(ctx, 9, 8, 1, 10, '#E0E0E0');
      // legs
      this.rect(ctx, 2, 20, 2, 12, '#F5F5F5');
      this.rect(ctx, 6, 20, 2, 12, '#F5F5F5');
      this.mobTextures.set(MobType.SKELETON, canvas);
    }
    // CREEPER (10x28)
    {
      const { canvas, ctx } = this.create(10, 28);
      ctx.clearRect(0, 0, 10, 28);
      // head
      this.rect(ctx, 1, 0, 8, 8, '#4CAF50');
      // face - creeper face pattern
      this.rect(ctx, 2, 2, 2, 2, '#388E3C');
      this.rect(ctx, 6, 2, 2, 2, '#388E3C');
      this.rect(ctx, 4, 4, 2, 2, '#388E3C');
      this.rect(ctx, 3, 6, 4, 2, '#388E3C');
      this.rect(ctx, 3, 5, 1, 1, '#388E3C');
      this.rect(ctx, 6, 5, 1, 1, '#388E3C');
      // body
      this.rect(ctx, 1, 8, 8, 12, '#4CAF50');
      for (let i = 0; i < 8; i++) {
        this.pixel(ctx, 1 + Math.floor(Math.random() * 8), 8 + Math.floor(Math.random() * 12), '#388E3C');
      }
      // legs (4 short legs)
      this.rect(ctx, 1, 20, 3, 8, '#4CAF50');
      this.rect(ctx, 6, 20, 3, 8, '#4CAF50');
      this.mobTextures.set(MobType.CREEPER, canvas);
    }
    // SPIDER (20x12)
    {
      const { canvas, ctx } = this.create(20, 12);
      ctx.clearRect(0, 0, 20, 12);
      // body
      this.rect(ctx, 7, 2, 6, 8, '#3E2723');
      // head
      this.rect(ctx, 4, 3, 4, 6, '#3E2723');
      // eyes
      this.rect(ctx, 4, 4, 2, 2, '#F44336');
      this.rect(ctx, 4, 7, 2, 2, '#F44336');
      // legs
      for (let i = 0; i < 4; i++) {
        const ly = 3 + i * 2;
        // left legs
        this.rect(ctx, 0, ly, 4, 1, '#3E2723');
        // right legs
        this.rect(ctx, 16, ly, 4, 1, '#3E2723');
      }
      this.mobTextures.set(MobType.SPIDER, canvas);
    }
    // ENDERMAN (10x46)
    {
      const { canvas, ctx } = this.create(10, 46);
      ctx.clearRect(0, 0, 10, 46);
      // head
      this.rect(ctx, 1, 0, 8, 8, '#111111');
      // purple eyes
      this.rect(ctx, 2, 3, 2, 2, '#9C27B0');
      this.rect(ctx, 6, 3, 2, 2, '#9C27B0');
      // thin body
      this.rect(ctx, 3, 8, 4, 18, '#111111');
      // arms
      this.rect(ctx, 0, 8, 2, 16, '#111111');
      this.rect(ctx, 8, 8, 2, 16, '#111111');
      // long legs
      this.rect(ctx, 2, 26, 2, 20, '#111111');
      this.rect(ctx, 6, 26, 2, 20, '#111111');
      this.mobTextures.set(MobType.ENDERMAN, canvas);
    }
    // PIG (16x12)
    {
      const { canvas, ctx } = this.create(16, 12);
      ctx.clearRect(0, 0, 16, 12);
      // body
      this.rect(ctx, 2, 2, 12, 6, '#FFCDD2');
      // head
      this.rect(ctx, 0, 1, 4, 5, '#FFCDD2');
      // snout
      this.rect(ctx, 0, 3, 2, 2, '#F8BBD0');
      this.pixel(ctx, 0, 3, '#333');
      this.pixel(ctx, 0, 4, '#333');
      // eye
      this.pixel(ctx, 2, 2, '#111');
      // legs
      this.rect(ctx, 3, 8, 2, 4, '#F8BBD0');
      this.rect(ctx, 7, 8, 2, 4, '#F8BBD0');
      this.rect(ctx, 11, 8, 2, 4, '#F8BBD0');
      // tail curl
      this.pixel(ctx, 14, 2, '#FFCDD2');
      this.pixel(ctx, 15, 3, '#FFCDD2');
      this.mobTextures.set(MobType.PIG, canvas);
    }
    // COW (16x14)
    {
      const { canvas, ctx } = this.create(16, 14);
      ctx.clearRect(0, 0, 16, 14);
      // body
      this.rect(ctx, 2, 2, 12, 7, '#FAFAFA');
      // brown patches
      this.rect(ctx, 4, 3, 4, 3, '#795548');
      this.rect(ctx, 10, 4, 3, 3, '#795548');
      // head
      this.rect(ctx, 0, 1, 4, 6, '#795548');
      this.pixel(ctx, 2, 2, '#111');
      // horns
      this.pixel(ctx, 1, 0, '#E0E0E0');
      this.pixel(ctx, 3, 0, '#E0E0E0');
      // udder
      this.rect(ctx, 8, 8, 3, 2, '#FFCDD2');
      // legs
      this.rect(ctx, 3, 9, 2, 5, '#795548');
      this.rect(ctx, 7, 9, 2, 5, '#FAFAFA');
      this.rect(ctx, 11, 9, 2, 5, '#795548');
      this.mobTextures.set(MobType.COW, canvas);
    }
    // SHEEP (16x14)
    {
      const { canvas, ctx } = this.create(16, 14);
      ctx.clearRect(0, 0, 16, 14);
      // fluffy body
      this.rect(ctx, 2, 2, 12, 7, '#FAFAFA');
      for (let i = 0; i < 10; i++) {
        this.pixel(ctx, 2 + Math.floor(Math.random() * 12), 2 + Math.floor(Math.random() * 7), '#F0F0F0');
      }
      // head
      this.rect(ctx, 0, 2, 4, 5, '#9E9E9E');
      this.pixel(ctx, 1, 3, '#111');
      // legs
      this.rect(ctx, 3, 9, 2, 5, '#9E9E9E');
      this.rect(ctx, 7, 9, 2, 5, '#9E9E9E');
      this.rect(ctx, 11, 9, 2, 5, '#9E9E9E');
      this.mobTextures.set(MobType.SHEEP, canvas);
    }
    // CHICKEN (10x10)
    {
      const { canvas, ctx } = this.create(10, 10);
      ctx.clearRect(0, 0, 10, 10);
      // body
      this.rect(ctx, 2, 3, 6, 4, '#FAFAFA');
      // head
      this.rect(ctx, 1, 0, 4, 4, '#FAFAFA');
      // comb
      this.rect(ctx, 2, 0, 2, 1, '#F44336');
      this.pixel(ctx, 3, -1 < 0 ? 0 : 0, '#F44336');
      // beak
      this.pixel(ctx, 0, 2, '#FFC107');
      this.pixel(ctx, 0, 3, '#FFC107');
      // eye
      this.pixel(ctx, 2, 1, '#111');
      // wattle
      this.pixel(ctx, 1, 4, '#F44336');
      // tail
      this.rect(ctx, 8, 2, 2, 3, '#F5F5F5');
      // legs
      this.rect(ctx, 3, 7, 1, 3, '#FFC107');
      this.rect(ctx, 6, 7, 1, 3, '#FFC107');
      // feet
      this.rect(ctx, 2, 9, 3, 1, '#FFC107');
      this.rect(ctx, 5, 9, 3, 1, '#FFC107');
      this.mobTextures.set(MobType.CHICKEN, canvas);
    }
    // GHAST (32x32)
    {
      const { canvas, ctx } = this.create(32, 32);
      ctx.clearRect(0, 0, 32, 32);
      // body
      this.rect(ctx, 4, 2, 24, 20, '#F5F5F5');
      this.rect(ctx, 6, 0, 20, 2, '#F5F5F5');
      // eyes - tear-drop shape
      this.rect(ctx, 8, 8, 4, 5, '#333333');
      this.rect(ctx, 9, 13, 2, 2, '#333333');
      this.rect(ctx, 20, 8, 4, 5, '#333333');
      this.rect(ctx, 21, 13, 2, 2, '#333333');
      // mouth
      this.rect(ctx, 13, 14, 6, 3, '#888888');
      // tentacles
      for (let t = 0; t < 6; t++) {
        const tx = 6 + t * 4;
        const h = 6 + Math.floor(Math.random() * 6);
        this.rect(ctx, tx, 22, 2, h, '#E0E0E0');
      }
      this.mobTextures.set(MobType.GHAST, canvas);
    }
    // BLAZE (12x18)
    {
      const { canvas, ctx } = this.create(12, 18);
      ctx.clearRect(0, 0, 12, 18);
      // head
      this.rect(ctx, 2, 0, 8, 8, '#FFD54F');
      this.rect(ctx, 3, 2, 2, 2, '#111');
      this.rect(ctx, 7, 2, 2, 2, '#111');
      this.rect(ctx, 4, 5, 4, 1, '#FF8C00');
      // body core (smoke/fire)
      this.rect(ctx, 4, 8, 4, 6, '#FF8C00');
      // rods around body
      this.rect(ctx, 0, 4, 2, 6, '#FFD54F');
      this.rect(ctx, 10, 4, 2, 6, '#FFD54F');
      this.rect(ctx, 0, 12, 2, 4, '#FF8C00');
      this.rect(ctx, 10, 12, 2, 4, '#FF8C00');
      this.rect(ctx, 3, 14, 2, 4, '#FFD54F');
      this.rect(ctx, 7, 14, 2, 4, '#FFD54F');
      this.mobTextures.set(MobType.BLAZE, canvas);
    }
    // ZOMBIE_PIGLIN (10x32)
    {
      const { canvas, ctx } = this.create(10, 32);
      ctx.clearRect(0, 0, 10, 32);
      // head
      this.rect(ctx, 1, 0, 8, 8, '#FFCDD2');
      // zombie green patches
      this.rect(ctx, 2, 1, 3, 3, '#4CAF50');
      // eyes
      this.rect(ctx, 2, 3, 2, 2, '#111');
      this.rect(ctx, 6, 3, 2, 2, '#111');
      // snout
      this.rect(ctx, 3, 5, 4, 2, '#F8BBD0');
      // body
      this.rect(ctx, 1, 8, 8, 12, '#795548');
      // gold sword
      this.rect(ctx, 0, 6, 1, 14, '#FFD700');
      // legs
      this.rect(ctx, 1, 20, 3, 12, '#795548');
      this.rect(ctx, 6, 20, 3, 12, '#795548');
      this.mobTextures.set(MobType.ZOMBIE_PIGLIN, canvas);
    }
    // ENDER_DRAGON (48x32)
    {
      const { canvas, ctx } = this.create(48, 32);
      ctx.clearRect(0, 0, 48, 32);
      // body
      this.rect(ctx, 14, 10, 20, 12, '#111111');
      // head
      this.rect(ctx, 2, 8, 12, 10, '#111111');
      this.rect(ctx, 0, 10, 3, 6, '#111111');
      // eyes
      this.rect(ctx, 4, 11, 3, 3, '#9C27B0');
      this.rect(ctx, 9, 11, 3, 3, '#9C27B0');
      // mouth
      this.rect(ctx, 1, 16, 8, 2, '#222222');
      // wing bones
      this.rect(ctx, 18, 2, 2, 8, '#555555');
      this.rect(ctx, 28, 2, 2, 8, '#555555');
      this.rect(ctx, 18, 2, 14, 2, '#555555');
      // wing membranes
      for (let x = 18; x < 34; x++) {
        for (let y = 4; y < 10; y++) {
          if (Math.random() > 0.2) {
            this.pixel(ctx, x, y, '#9C27B0');
          }
        }
      }
      // right wing
      this.rect(ctx, 34, 4, 2, 8, '#555555');
      this.rect(ctx, 42, 2, 2, 8, '#555555');
      this.rect(ctx, 34, 2, 12, 2, '#555555');
      for (let x = 34; x < 46; x++) {
        for (let y = 4; y < 10; y++) {
          if (Math.random() > 0.2) {
            this.pixel(ctx, x, y, '#9C27B0');
          }
        }
      }
      // tail
      this.rect(ctx, 34, 14, 10, 4, '#111111');
      this.rect(ctx, 42, 13, 4, 6, '#111111');
      // legs
      this.rect(ctx, 16, 22, 3, 10, '#111111');
      this.rect(ctx, 28, 22, 3, 10, '#111111');
      // claws
      this.rect(ctx, 15, 30, 5, 2, '#555555');
      this.rect(ctx, 27, 30, 5, 2, '#555555');
      this.mobTextures.set(MobType.ENDER_DRAGON, canvas);
    }
  }

  // ─── PLAYER TEXTURE ───
  private generatePlayerTextures(): void {
    // Right-facing player (10x32)
    {
      const { canvas, ctx } = this.create(10, 32);
      ctx.clearRect(0, 0, 10, 32);
      // head (8x8)
      this.rect(ctx, 1, 0, 8, 8, '#FFCCBC');
      // hair
      this.rect(ctx, 1, 0, 8, 3, '#5D4037');
      this.rect(ctx, 1, 3, 2, 1, '#5D4037');
      // eyes
      this.rect(ctx, 3, 4, 2, 1, '#111');
      this.rect(ctx, 6, 4, 2, 1, '#111');
      // mouth
      this.pixel(ctx, 4, 6, '#E0A090');
      this.pixel(ctx, 5, 6, '#E0A090');
      // body (shirt)
      this.rect(ctx, 1, 8, 8, 12, '#1565C0');
      // arms
      this.rect(ctx, 0, 8, 1, 10, '#FFCCBC');
      this.rect(ctx, 9, 8, 1, 10, '#FFCCBC');
      // legs
      this.rect(ctx, 1, 20, 3, 12, '#795548');
      this.rect(ctx, 6, 20, 3, 12, '#795548');
      // shoes
      this.rect(ctx, 1, 30, 3, 2, '#555');
      this.rect(ctx, 6, 30, 3, 2, '#555');
      this.playerTexture = canvas;
    }
    // Left-facing player (mirrored)
    {
      const { canvas, ctx } = this.create(10, 32);
      ctx.clearRect(0, 0, 10, 32);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(this.playerTexture, -10, 0);
      ctx.restore();
      this.playerTextureLeft = canvas;
    }
  }
}
