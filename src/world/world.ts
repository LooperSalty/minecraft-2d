import {
  BlockType,
  Dimension,
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  BLOCK_DATA,
  MAX_LIGHT,
  RENDER_DISTANCE,
  SEA_LEVEL,
  ItemType,
  ItemStack,
  DroppedItem,
  ITEM_DATA,
  getBlockItem,
  getItemBlock,
} from '../constants';
import { Chunk } from './chunk';
import { WorldGenerator } from './generation';

export interface FurnaceState {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTime: number;
  burnTimeMax: number;
  cookProgress: number;
  cookTimeTotal: number;
}

const DAY_LENGTH = 24000;
const DROP_DESPAWN_TIME = 300; // 300 seconds = 5 minutes
const DROP_PICKUP_DELAY = 0.5; // 0.5 seconds before pickup

const SMELTING_RECIPES: ReadonlyArray<{ input: ItemType; output: ItemType; cookTime: number }> = [
  { input: ItemType.IRON_ORE, output: ItemType.IRON_INGOT, cookTime: 200 },
  { input: ItemType.GOLD_ORE, output: ItemType.GOLD_INGOT, cookTime: 200 },
  { input: ItemType.BLOCK_SAND, output: ItemType.BLOCK_GLASS, cookTime: 200 },
  { input: ItemType.BLOCK_COBBLESTONE, output: ItemType.BLOCK_STONE, cookTime: 200 },
  { input: ItemType.BLOCK_OAK_LOG, output: ItemType.COAL, cookTime: 200 },
  { input: ItemType.RAW_PORKCHOP, output: ItemType.COOKED_PORKCHOP, cookTime: 200 },
  { input: ItemType.RAW_BEEF, output: ItemType.COOKED_BEEF, cookTime: 200 },
];

const FUEL_VALUES: ReadonlyMap<ItemType, number> = new Map([
  [ItemType.BLOCK_OAK_LOG, 300],
  [ItemType.BLOCK_OAK_PLANKS, 200],
  [ItemType.STICK, 100],
  [ItemType.COAL, 1600],
]);

export class World {
  chunks: Map<string, Chunk>;
  generator: WorldGenerator;
  currentDimension: Dimension;
  droppedItems: DroppedItem[];
  time: number;
  weather: 'clear' | 'rain';
  weatherTimer: number;
  seed: number;
  chestContents: Map<string, (ItemStack | null)[]>;
  furnaceStates: Map<string, FurnaceState>;

  constructor(seed: number) {
    this.seed = seed;
    this.chunks = new Map();
    this.generator = new WorldGenerator(seed);
    this.currentDimension = Dimension.OVERWORLD;
    this.droppedItems = [];
    this.time = 0;
    this.weather = 'clear';
    this.weatherTimer = 3000 + Math.random() * 6000;
    this.chestContents = new Map();
    this.furnaceStates = new Map();
  }

  // ─── Chunk Management ───────────────────────────────────────────

  getChunkKey(dim: Dimension, cx: number): string {
    return `${dim}_${cx}`;
  }

  ensureChunk(cx: number): Chunk {
    const key = this.getChunkKey(this.currentDimension, cx);
    const existing = this.chunks.get(key);
    if (existing) {
      return existing;
    }
    const chunk = this.generator.generateChunk(cx, this.currentDimension);
    this.chunks.set(key, chunk);
    this.updateLighting(cx);
    return chunk;
  }

  getChunk(cx: number): Chunk | undefined {
    const key = this.getChunkKey(this.currentDimension, cx);
    return this.chunks.get(key);
  }

  loadChunksAround(centerX: number): void {
    const centerChunkX = Math.floor(centerX / CHUNK_WIDTH);
    const minCx = centerChunkX - RENDER_DISTANCE;
    const maxCx = centerChunkX + RENDER_DISTANCE;

    for (let cx = minCx; cx <= maxCx; cx++) {
      this.ensureChunk(cx);
    }

    const unloadMin = centerChunkX - (RENDER_DISTANCE + 2);
    const unloadMax = centerChunkX + (RENDER_DISTANCE + 2);

    for (const [key, _chunk] of this.chunks) {
      const parts = key.split('_');
      const dim = parseInt(parts[0], 10) as Dimension;
      const cx = parseInt(parts[1], 10);
      if (dim === this.currentDimension && (cx < unloadMin || cx > unloadMax)) {
        this.chunks.delete(key);
      }
    }
  }

  // ─── Block Access (World Coordinates) ───────────────────────────

  getBlock(x: number, y: number): BlockType {
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return BlockType.AIR;
    }
    const cx = Math.floor(x / CHUNK_WIDTH);
    const localX = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const chunk = this.getChunk(cx);
    if (!chunk) {
      return BlockType.AIR;
    }
    return chunk.getBlock(localX, y);
  }

  setBlock(x: number, y: number, block: BlockType): void {
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return;
    }
    const cx = Math.floor(x / CHUNK_WIDTH);
    const localX = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const chunk = this.ensureChunk(cx);
    chunk.setBlock(localX, y, block);
    this.updateLighting(cx);

    if (localX === 0) {
      const leftChunk = this.getChunk(cx - 1);
      if (leftChunk) {
        this.updateLighting(cx - 1);
      }
    }
    if (localX === CHUNK_WIDTH - 1) {
      const rightChunk = this.getChunk(cx + 1);
      if (rightChunk) {
        this.updateLighting(cx + 1);
      }
    }
  }

  getLight(x: number, y: number): number {
    if (y < 0 || y >= CHUNK_HEIGHT) {
      return MAX_LIGHT;
    }
    const cx = Math.floor(x / CHUNK_WIDTH);
    const localX = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
    const chunk = this.getChunk(cx);
    if (!chunk) {
      return MAX_LIGHT;
    }
    return chunk.getLight(localX, y);
  }

  // ─── Block Interaction ──────────────────────────────────────────

  breakBlock(x: number, y: number): DroppedItem | null {
    const block = this.getBlock(x, y);
    if (block === BlockType.AIR) {
      return null;
    }

    const data = BLOCK_DATA[block];
    if (!data || data.hardness === -1) {
      return null;
    }

    this.setBlock(x, y, BlockType.AIR);

    const chestKey = `${x}_${y}_${this.currentDimension}`;
    this.chestContents.delete(chestKey);
    this.furnaceStates.delete(chestKey);

    const dropItemType = getBlockItem(block);
    if (dropItemType === undefined || dropItemType === null) {
      return null;
    }

    const droppedItem: DroppedItem = {
      x: x + 0.5,
      y: y + 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: -2,
      item: { type: dropItemType, count: 1, durability: 0 },
      age: 0,
      pickupDelay: DROP_PICKUP_DELAY,
    };

    this.droppedItems = [...this.droppedItems, droppedItem];
    return droppedItem;
  }

  placeBlock(x: number, y: number, blockType: BlockType): boolean {
    const existing = this.getBlock(x, y);
    if (existing !== BlockType.AIR && existing !== BlockType.WATER && existing !== BlockType.LAVA) {
      return false;
    }

    if (y < 0 || y >= CHUNK_HEIGHT) {
      return false;
    }

    this.setBlock(x, y, blockType);

    if (blockType === BlockType.CHEST) {
      const key = `${x}_${y}_${this.currentDimension}`;
      this.chestContents.set(key, new Array(27).fill(null));
    }

    if (blockType === BlockType.FURNACE) {
      const key = `${x}_${y}_${this.currentDimension}`;
      this.furnaceStates.set(key, {
        input: null,
        fuel: null,
        output: null,
        burnTime: 0,
        burnTimeMax: 0,
        cookProgress: 0,
        cookTimeTotal: 0,
      });
    }

    return true;
  }

  // ─── Lighting ───────────────────────────────────────────────────

  updateLighting(cx: number): void {
    const chunk = this.getChunk(cx);
    if (!chunk) {
      return;
    }

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
        chunk.setLight(lx, ly, 0);
      }
    }

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      let sunLevel = MAX_LIGHT;
      for (let ly = CHUNK_HEIGHT - 1; ly >= 0; ly--) {
        const block = chunk.getBlock(lx, ly);
        const data = BLOCK_DATA[block];
        const isTransparent = data ? data.transparent : true;

        if (!isTransparent) {
          sunLevel = Math.max(sunLevel - 1, 0);
        }

        const currentLight = chunk.getLight(lx, ly);
        const skyContribution = Math.floor(sunLevel * this.getDaylight());
        if (skyContribution > currentLight) {
          chunk.setLight(lx, ly, skyContribution);
        }

        if (data && data.lightLevel && data.lightLevel > 0) {
          if (data.lightLevel > chunk.getLight(lx, ly)) {
            chunk.setLight(lx, ly, data.lightLevel);
          }
          const worldX = cx * CHUNK_WIDTH + lx;
          this.propagateLight(worldX, ly, data.lightLevel);
        }
      }
    }
  }

  propagateLight(startX: number, startY: number, level: number): void {
    const queue: Array<{ x: number; y: number; light: number }> = [
      { x: startX, y: startY, light: level },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const { x, y, light } = current;

      if (light <= 0) {
        continue;
      }
      if (y < 0 || y >= CHUNK_HEIGHT) {
        continue;
      }

      const posKey = `${x}_${y}`;
      if (visited.has(posKey)) {
        continue;
      }
      visited.add(posKey);

      const block = this.getBlock(x, y);
      const data = BLOCK_DATA[block];
      const isTransparent = data ? data.transparent : true;

      if (!isTransparent && !(x === startX && y === startY)) {
        continue;
      }

      const cx = Math.floor(x / CHUNK_WIDTH);
      const localX = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
      const chunk = this.getChunk(cx);
      if (!chunk) {
        continue;
      }

      const currentLight = chunk.getLight(localX, y);
      if (light > currentLight) {
        chunk.setLight(localX, y, light);
      } else {
        continue;
      }

      const nextLight = light - 1;
      if (nextLight > 0) {
        queue.push({ x: x - 1, y, light: nextLight });
        queue.push({ x: x + 1, y, light: nextLight });
        queue.push({ x, y: y - 1, light: nextLight });
        queue.push({ x, y: y + 1, light: nextLight });
      }
    }
  }

  // ─── Day/Night Cycle ────────────────────────────────────────────

  updateTime(dt: number): void {
    this.time = (this.time + dt) % DAY_LENGTH;

    this.weatherTimer -= 1;
    if (this.weatherTimer <= 0) {
      this.weather = this.weather === 'clear' ? 'rain' : 'clear';
      this.weatherTimer = 3000 + Math.random() * 6000;
    }
  }

  getDaylight(): number {
    if (this.currentDimension === Dimension.NETHER) {
      return 0.1;
    }
    if (this.currentDimension === Dimension.END) {
      return 0.3;
    }

    if (this.time < 12000) {
      return 1.0;
    }
    if (this.time < 13000) {
      return 1.0 - (this.time - 12000) / 1000;
    }
    if (this.time < 23000) {
      return 0.0;
    }
    return (this.time - 23000) / 1000;
  }

  isNight(): boolean {
    return this.time >= 13000 && this.time < 23000;
  }

  // ─── Dimension Transitions ─────────────────────────────────────

  switchDimension(
    dim: Dimension,
    playerX: number,
    playerY: number,
  ): { x: number; y: number } {
    const previousDimension = this.currentDimension;
    this.currentDimension = dim;

    if (dim === Dimension.END) {
      this.loadChunksAround(0);
      return { x: 0, y: 70 };
    }

    if (previousDimension === Dimension.END) {
      this.loadChunksAround(0);
      return { x: 0, y: SEA_LEVEL };
    }

    if (dim === Dimension.NETHER && previousDimension === Dimension.OVERWORLD) {
      const netherX = Math.floor(playerX / 8);
      const targetX = this.findNetherPortalTarget(netherX);
      this.loadChunksAround(targetX);
      return { x: targetX, y: 70 };
    }

    if (dim === Dimension.OVERWORLD && previousDimension === Dimension.NETHER) {
      const overworldX = playerX * 8;
      const targetX = this.findNetherPortalTarget(overworldX);
      this.loadChunksAround(targetX);
      return { x: targetX, y: SEA_LEVEL };
    }

    this.loadChunksAround(playerX);
    return { x: playerX, y: playerY };
  }

  findNetherPortalTarget(x: number): number {
    const searchRange = 16;
    for (let dx = 0; dx <= searchRange; dx++) {
      const checkPositive = x + dx;
      const checkNegative = x - dx;

      for (let y = 60; y < 80; y++) {
        if (this.getBlock(checkPositive, y) === BlockType.OBSIDIAN) {
          return checkPositive;
        }
        if (dx !== 0 && this.getBlock(checkNegative, y) === BlockType.OBSIDIAN) {
          return checkNegative;
        }
      }
    }

    const portalY = 70;
    this.setBlock(x, portalY - 1, BlockType.OBSIDIAN);
    this.setBlock(x - 1, portalY - 1, BlockType.OBSIDIAN);
    this.setBlock(x + 1, portalY - 1, BlockType.OBSIDIAN);
    this.setBlock(x + 2, portalY - 1, BlockType.OBSIDIAN);

    for (let py = portalY; py < portalY + 4; py++) {
      this.setBlock(x - 1, py, BlockType.OBSIDIAN);
      this.setBlock(x + 2, py, BlockType.OBSIDIAN);
    }

    this.setBlock(x, portalY + 4, BlockType.OBSIDIAN);
    this.setBlock(x - 1, portalY + 4, BlockType.OBSIDIAN);
    this.setBlock(x + 1, portalY + 4, BlockType.OBSIDIAN);
    this.setBlock(x + 2, portalY + 4, BlockType.OBSIDIAN);

    this.setBlock(x, portalY, BlockType.NETHER_PORTAL);
    this.setBlock(x, portalY + 1, BlockType.NETHER_PORTAL);
    this.setBlock(x, portalY + 2, BlockType.NETHER_PORTAL);
    this.setBlock(x, portalY + 3, BlockType.NETHER_PORTAL);
    this.setBlock(x + 1, portalY, BlockType.NETHER_PORTAL);
    this.setBlock(x + 1, portalY + 1, BlockType.NETHER_PORTAL);
    this.setBlock(x + 1, portalY + 2, BlockType.NETHER_PORTAL);
    this.setBlock(x + 1, portalY + 3, BlockType.NETHER_PORTAL);

    return x;
  }

  // ─── Dropped Items ─────────────────────────────────────────────

  updateDroppedItems(dt: number): void {
    const DROP_GRAVITY = 20;
    this.droppedItems = this.droppedItems
      .map((drop) => {
        const newAge = drop.age + dt;
        if (newAge >= DROP_DESPAWN_TIME) {
          return null;
        }

        // Y-up: gravity pulls down (negative)
        let newVy = drop.vy - DROP_GRAVITY * dt;
        let newX = drop.x + drop.vx * dt;
        let newY = drop.y + newVy * dt;
        let newVx = drop.vx * 0.95;

        // Check block below item (Y-up: lower Y = below)
        const blockBelowY = Math.floor(newY - 0.01);
        const blockBelow = this.getBlock(Math.floor(newX), blockBelowY);
        const belowData = BLOCK_DATA[blockBelow];
        if (belowData && belowData.solid && newVy < 0) {
          newY = blockBelowY + 1; // snap to top of block
          newVy = 0;
        }

        // Check horizontal collision
        const blockAtX = this.getBlock(Math.floor(newX), Math.floor(newY));
        const atData = BLOCK_DATA[blockAtX];
        if (atData && atData.solid) {
          newX = drop.x;
          newVx = 0;
        }

        return {
          ...drop,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          age: newAge,
          pickupDelay: Math.max(0, drop.pickupDelay - dt),
        };
      })
      .filter((drop): drop is DroppedItem => drop !== null);
  }

  spawnDrop(x: number, y: number, item: ItemStack): void {
    const droppedItem: DroppedItem = {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: 3, // pop upward (Y-up)
      item: { ...item },
      age: 0,
      pickupDelay: DROP_PICKUP_DELAY,
    };
    this.droppedItems = [...this.droppedItems, droppedItem];
  }

  // ─── Fluid Simulation ──────────────────────────────────────────

  updateFluids(): void {
    for (const [key, chunk] of this.chunks) {
      const parts = key.split('_');
      const dim = parseInt(parts[0], 10) as Dimension;
      if (dim !== this.currentDimension) {
        continue;
      }
      const cx = parseInt(parts[1], 10);

      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
          const block = chunk.getBlock(lx, ly);
          if (block !== BlockType.WATER && block !== BlockType.LAVA) {
            continue;
          }

          const worldX = cx * CHUNK_WIDTH + lx;

          if (ly + 1 < CHUNK_HEIGHT) {
            const below = this.getBlock(worldX, ly + 1);
            if (below === BlockType.AIR) {
              this.setBlock(worldX, ly + 1, block);
              continue;
            }

            if (
              (block === BlockType.WATER && below === BlockType.LAVA) ||
              (block === BlockType.LAVA && below === BlockType.WATER)
            ) {
              this.setBlock(worldX, ly + 1, BlockType.COBBLESTONE);
              continue;
            }
          }

          const maxSpread = block === BlockType.WATER ? 4 : 2;
          for (let spread = 1; spread <= maxSpread; spread++) {
            const leftX = worldX - spread;
            const rightX = worldX + spread;

            const leftBlock = this.getBlock(leftX, ly);
            if (leftBlock === BlockType.AIR) {
              this.setBlock(leftX, ly, block);
              break;
            }

            const rightBlock = this.getBlock(rightX, ly);
            if (rightBlock === BlockType.AIR) {
              this.setBlock(rightX, ly, block);
              break;
            }
          }
        }
      }
    }
  }

  // ─── Furnace Processing ────────────────────────────────────────

  updateFurnaces(dt: number): void {
    for (const [key, state] of this.furnaceStates) {
      const updatedState = this.tickFurnace(state, dt);
      this.furnaceStates.set(key, updatedState);
    }
  }

  private tickFurnace(state: FurnaceState, dt: number): FurnaceState {
    let { input, fuel, output, burnTime, burnTimeMax, cookProgress, cookTimeTotal } = state;

    input = input ? { ...input } : null;
    fuel = fuel ? { ...fuel } : null;
    output = output ? { ...output } : null;

    const recipe = input ? this.findSmeltingRecipe(input.type) : null;

    if (burnTime > 0) {
      burnTime = Math.max(0, burnTime - dt);
    }

    if (burnTime <= 0 && recipe && input) {
      const canOutput =
        !output || (output.type === recipe.output && output.count < 64);
      if (canOutput && fuel) {
        const fuelValue = FUEL_VALUES.get(fuel.type);
        if (fuelValue && fuelValue > 0) {
          burnTime = fuelValue;
          burnTimeMax = fuelValue;
          fuel = fuel.count > 1 ? { ...fuel, count: fuel.count - 1 } : null;
        }
      }
    }

    if (burnTime > 0 && recipe && input) {
      const canOutput =
        !output || (output.type === recipe.output && output.count < 64);
      if (canOutput) {
        if (cookTimeTotal <= 0) {
          cookTimeTotal = recipe.cookTime;
          cookProgress = 0;
        }
        cookProgress += dt;
        if (cookProgress >= cookTimeTotal) {
          cookProgress = 0;
          cookTimeTotal = 0;
          input = input.count > 1 ? { ...input, count: input.count - 1 } : null;
          output = output
            ? { ...output, count: output.count + 1 }
            : { type: recipe.output, count: 1, durability: 0 };
        }
      } else {
        cookProgress = 0;
        cookTimeTotal = 0;
      }
    } else {
      cookProgress = 0;
      cookTimeTotal = 0;
    }

    return { input, fuel, output, burnTime, burnTimeMax, cookProgress, cookTimeTotal };
  }

  private findSmeltingRecipe(
    inputType: ItemType,
  ): { input: ItemType; output: ItemType; cookTime: number } | null {
    return SMELTING_RECIPES.find((r) => r.input === inputType) ?? null;
  }

  // ─── Serialization ─────────────────────────────────────────────

  serialize(): object {
    const chunksData: Record<string, object> = {};
    for (const [key, chunk] of this.chunks) {
      chunksData[key] = {
        cx: chunk.cx,
        blocks: Array.from(chunk.blocks),
        lightMap: Array.from(chunk.lightMap),
      };
    }

    const chestsData: Record<string, (ItemStack | null)[]> = {};
    for (const [key, contents] of this.chestContents) {
      chestsData[key] = contents;
    }

    const furnacesData: Record<string, FurnaceState> = {};
    for (const [key, state] of this.furnaceStates) {
      furnacesData[key] = state;
    }

    const droppedItemsData = this.droppedItems.map((drop) => ({
      x: drop.x,
      y: drop.y,
      vx: drop.vx,
      vy: drop.vy,
      item: { type: drop.item.type, count: drop.item.count, durability: drop.item.durability },
      age: drop.age,
      pickupDelay: drop.pickupDelay,
    }));

    return {
      seed: this.seed,
      currentDimension: this.currentDimension,
      time: this.time,
      weather: this.weather,
      weatherTimer: this.weatherTimer,
      chunks: chunksData,
      chestContents: chestsData,
      furnaceStates: furnacesData,
      droppedItems: droppedItemsData,
    };
  }

  static deserialize(data: any): World {
    const world = new World(data.seed);
    world.currentDimension = data.currentDimension ?? Dimension.OVERWORLD;
    world.time = data.time ?? 0;
    world.weather = data.weather ?? 'clear';
    world.weatherTimer = data.weatherTimer ?? 3000;

    if (data.chunks) {
      for (const [key, chunkData] of Object.entries(data.chunks)) {
        const cd = chunkData as any;
        const chunk = new Chunk(cd.cx ?? 0);
        chunk.blocks = new Uint16Array(cd.blocks);
        chunk.lightMap = new Uint8Array(cd.lightMap);
        world.chunks.set(key, chunk);
      }
    }

    if (data.chestContents) {
      for (const [key, contents] of Object.entries(data.chestContents)) {
        world.chestContents.set(key, contents as (ItemStack | null)[]);
      }
    }

    if (data.furnaceStates) {
      for (const [key, state] of Object.entries(data.furnaceStates)) {
        world.furnaceStates.set(key, state as FurnaceState);
      }
    }

    if (data.droppedItems) {
      world.droppedItems = (data.droppedItems as any[]).map((d) => ({
        x: d.x,
        y: d.y,
        vx: d.vx,
        vy: d.vy,
        item: { type: d.item.type, count: d.item.count, durability: d.item.durability ?? 0 },
        age: d.age,
        pickupDelay: d.pickupDelay ?? 0,
      }));
    }

    return world;
  }
}
