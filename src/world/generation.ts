import { PerlinNoise, SeededRandom } from '../noise';
import {
  BlockType,
  Dimension,
  BiomeType,
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  SEA_LEVEL,
  BEDROCK_LEVEL,
} from '../constants';
import { Chunk } from './chunk';

export class WorldGenerator {
  private terrain: PerlinNoise;
  private cave: PerlinNoise;
  private biome: PerlinNoise;
  private ore: PerlinNoise;
  private rand: SeededRandom;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.terrain = new PerlinNoise(seed);
    this.cave = new PerlinNoise(seed + 1);
    this.biome = new PerlinNoise(seed + 2);
    this.ore = new PerlinNoise(seed + 3);
    this.rand = new SeededRandom(seed);
  }

  generateChunk(cx: number, dimension: Dimension): Chunk {
    const chunk = new Chunk(cx);

    switch (dimension) {
      case Dimension.OVERWORLD:
        this.generateOverworld(chunk);
        break;
      case Dimension.NETHER:
        this.generateNether(chunk);
        break;
      case Dimension.END:
        this.generateEnd(chunk);
        break;
    }

    chunk.generated = true;
    chunk.dirty = true;
    return chunk;
  }

  private generateOverworld(chunk: Chunk): void {
    const cx = chunk.cx;

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      const worldX = cx * CHUNK_WIDTH + lx;
      const biome = this.getBiome(worldX);
      const height = this.getHeight(worldX, biome);
      const intHeight = Math.floor(height);

      // Generate bedrock layer (y=0 to 4, random pattern)
      for (let y = 0; y <= BEDROCK_LEVEL; y++) {
        this.rand.seed = this.seed + worldX * 997 + y * 131;
        if (y === 0 || this.rand.next() < (1 - y / (BEDROCK_LEVEL + 1))) {
          chunk.setBlock(lx, y, BlockType.BEDROCK);
        } else {
          chunk.setBlock(lx, y, BlockType.STONE);
        }
      }

      // Fill stone from bedrock top to surface
      for (let y = BEDROCK_LEVEL + 1; y <= intHeight; y++) {
        chunk.setBlock(lx, y, BlockType.STONE);
      }

      // Apply surface blocks based on biome
      if (biome === BiomeType.DESERT) {
        // Desert: sand on top, sandstone below
        if (intHeight >= 0) {
          chunk.setBlock(lx, intHeight, BlockType.SAND);
          const sandstoneDepth = 3 + Math.floor(this.seededRandom(worldX, intHeight) * 2);
          for (let d = 1; d <= sandstoneDepth && intHeight - d > BEDROCK_LEVEL; d++) {
            chunk.setBlock(lx, intHeight - d, BlockType.SANDSTONE);
          }
        }
      } else {
        // Standard biomes: grass on top, dirt below
        if (intHeight >= 0) {
          if (intHeight >= SEA_LEVEL) {
            chunk.setBlock(lx, intHeight, BlockType.GRASS);
          } else {
            chunk.setBlock(lx, intHeight, BlockType.DIRT);
          }
          const dirtDepth = 3 + Math.floor(this.seededRandom(worldX, intHeight) * 2);
          for (let d = 1; d <= dirtDepth && intHeight - d > BEDROCK_LEVEL; d++) {
            chunk.setBlock(lx, intHeight - d, BlockType.DIRT);
          }
        }
      }

      // Fill water in oceans up to SEA_LEVEL
      if (biome === BiomeType.OCEAN || intHeight < SEA_LEVEL) {
        for (let y = intHeight + 1; y <= SEA_LEVEL; y++) {
          if (chunk.getBlock(lx, y) === BlockType.AIR) {
            chunk.setBlock(lx, y, BlockType.WATER);
          }
        }
        // Convert grass to dirt if underwater
        if (intHeight < SEA_LEVEL && chunk.getBlock(lx, intHeight) === BlockType.GRASS) {
          chunk.setBlock(lx, intHeight, BlockType.DIRT);
        }
      }

      // Place decorations on top of surface (only above sea level)
      if (intHeight >= SEA_LEVEL && biome !== BiomeType.DESERT && biome !== BiomeType.OCEAN) {
        this.rand.seed = this.seed + worldX * 7919 + 53;
        const decorRoll = this.rand.next();

        // Trees (check no trunk nearby to avoid overlapping)
        const hasNearbyTree = (checkLx: number): boolean => {
          for (let dx = -4; dx <= 4; dx++) {
            const cx2 = checkLx + dx;
            if (cx2 < 0 || cx2 >= CHUNK_WIDTH || cx2 === checkLx) continue;
            const b = chunk.getBlock(cx2, intHeight + 1);
            if (b === BlockType.OAK_LOG || b === BlockType.BIRCH_LOG) return true;
          }
          return false;
        };

        if (biome === BiomeType.FOREST || biome === BiomeType.TAIGA) {
          if (decorRoll < 0.08 && lx >= 3 && lx <= CHUNK_WIDTH - 4 && !hasNearbyTree(lx)) {
            const isBirch = biome === BiomeType.FOREST && this.rand.next() < 0.3;
            this.generateTree(chunk, lx, intHeight + 1, isBirch);
          }
        } else if (biome === BiomeType.PLAINS) {
          if (decorRoll < 0.015 && lx >= 3 && lx <= CHUNK_WIDTH - 4 && !hasNearbyTree(lx)) {
            const isBirch = this.rand.next() < 0.2;
            this.generateTree(chunk, lx, intHeight + 1, isBirch);
          } else if (decorRoll < 0.12) {
            // Flowers
            chunk.setBlock(lx, intHeight + 1, Math.random() < 0.5 ? BlockType.FLOWER_RED : BlockType.FLOWER_YELLOW);
          } else if (decorRoll < 0.25) {
            // Tall grass
            chunk.setBlock(lx, intHeight + 1, BlockType.TALL_GRASS);
          }
        } else if (biome === BiomeType.MOUNTAINS) {
          if (decorRoll < 0.02 && lx >= 2 && lx <= CHUNK_WIDTH - 3) {
            this.generateTree(chunk, lx, intHeight + 1, false);
          }
        }

        // Scattered flowers/tall grass in forests
        if (biome === BiomeType.FOREST && decorRoll >= 0.15) {
          this.rand.seed = this.seed + worldX * 3571 + 97;
          const flowerRoll = this.rand.next();
          if (flowerRoll < 0.08) {
            chunk.setBlock(lx, intHeight + 1, Math.random() < 0.5 ? BlockType.FLOWER_RED : BlockType.FLOWER_YELLOW);
          } else if (flowerRoll < 0.2) {
            chunk.setBlock(lx, intHeight + 1, BlockType.TALL_GRASS);
          }
        }
      }
    }

    // Generate caves
    this.generateCaves(chunk);

    // Generate ores
    this.generateOres(chunk);

    // Generate stronghold if in range
    this.generateStronghold(chunk);
  }

  private generateNether(chunk: Chunk): void {
    const cx = chunk.cx;
    const ceilingHeight = 128;

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      const worldX = cx * CHUNK_WIDTH + lx;

      // Bedrock floor and ceiling
      chunk.setBlock(lx, 0, BlockType.BEDROCK);
      chunk.setBlock(lx, ceilingHeight, BlockType.BEDROCK);

      this.rand.seed = this.seed + worldX * 997 + 7;
      for (let y = 1; y <= 3; y++) {
        if (this.rand.next() < (1 - y / 4)) {
          chunk.setBlock(lx, y, BlockType.BEDROCK);
        } else {
          chunk.setBlock(lx, y, BlockType.NETHERRACK);
        }
      }

      for (let y = ceilingHeight - 1; y >= ceilingHeight - 3; y--) {
        this.rand.seed = this.seed + worldX * 557 + y * 131;
        if (this.rand.next() < (1 - (ceilingHeight - y) / 4)) {
          chunk.setBlock(lx, y, BlockType.BEDROCK);
        } else {
          chunk.setBlock(lx, y, BlockType.NETHERRACK);
        }
      }

      // Fill netherrack
      for (let y = 4; y < ceilingHeight - 3; y++) {
        chunk.setBlock(lx, y, BlockType.NETHERRACK);
      }

      // Carve caves using noise
      for (let y = 4; y < ceilingHeight - 3; y++) {
        const caveVal = this.cave.noise2D(worldX * 0.05, y * 0.05);
        const caveVal2 = this.cave.noise2D(worldX * 0.08 + 500, y * 0.08 + 500);
        if (caveVal > 0.2 && caveVal2 > 0.1) {
          // Lava ocean at y=31
          if (y <= 31) {
            chunk.setBlock(lx, y, BlockType.LAVA);
          } else {
            chunk.setBlock(lx, y, BlockType.AIR);
          }
        }
      }

      // Soul sand patches at low elevations
      this.rand.seed = this.seed + worldX * 1231 + 19;
      for (let y = 32; y <= 40; y++) {
        if (chunk.getBlock(lx, y) === BlockType.NETHERRACK && this.rand.next() < 0.3) {
          const below = chunk.getBlock(lx, y - 1);
          if (below === BlockType.AIR || below === BlockType.LAVA) {
            chunk.setBlock(lx, y, BlockType.SOUL_SAND);
          }
        }
      }

      // Glowstone clusters on ceiling
      this.rand.seed = this.seed + worldX * 2939 + 41;
      if (this.rand.next() < 0.08) {
        const clusterSize = 1 + Math.floor(this.rand.next() * 3);
        for (let dy = 0; dy < clusterSize; dy++) {
          const gy = ceilingHeight - 4 - dy;
          if (chunk.getBlock(lx, gy) === BlockType.NETHERRACK) {
            chunk.setBlock(lx, gy, BlockType.GLOWSTONE);
          }
        }
      }

      // Quartz ore scattered
      this.rand.seed = this.seed + worldX * 4201 + 67;
      for (let y = 10; y < 100; y++) {
        if (chunk.getBlock(lx, y) === BlockType.NETHERRACK && this.rand.next() < 0.01) {
          chunk.setBlock(lx, y, BlockType.QUARTZ_ORE);
        }
        // Advance random regardless
        this.rand.seed = this.seed + worldX * 4201 + y * 67;
      }
    }

    // Nether fortress around chunks 5-10
    if (cx >= 5 && cx <= 10) {
      this.generateNetherFortress(chunk);
    }
  }

  private generateNetherFortress(chunk: Chunk): void {
    const baseY = 50;

    // Build corridors and platforms from nether bricks
    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      // Floor
      for (let y = baseY; y <= baseY + 1; y++) {
        chunk.setBlock(lx, y, BlockType.NETHER_BRICKS);
      }
      // Walls on edges every 8 blocks
      if (lx % 8 === 0 || lx % 8 === 7) {
        for (let y = baseY + 2; y <= baseY + 5; y++) {
          chunk.setBlock(lx, y, BlockType.NETHER_BRICKS);
        }
      }
      // Ceiling
      chunk.setBlock(lx, baseY + 6, BlockType.NETHER_BRICKS);
    }

    // Blaze spawner in the middle of the fortress
    if (chunk.cx === 7 || chunk.cx === 8) {
      chunk.setBlock(8, baseY + 2, BlockType.SPAWNER);
    }

    // Upper walkway
    const upperY = baseY + 10;
    for (let lx = 3; lx < 13; lx++) {
      chunk.setBlock(lx, upperY, BlockType.NETHER_BRICKS);
      chunk.setBlock(lx, upperY + 1, BlockType.AIR);
      chunk.setBlock(lx, upperY + 2, BlockType.AIR);
      chunk.setBlock(lx, upperY + 3, BlockType.AIR);
    }
    // Railing walls
    for (let y = upperY + 1; y <= upperY + 3; y++) {
      chunk.setBlock(3, y, BlockType.NETHER_BRICKS);
      chunk.setBlock(12, y, BlockType.NETHER_BRICKS);
    }
  }

  private generateEnd(chunk: Chunk): void {
    const cx = chunk.cx;

    // Main island: chunks -3 to 3
    if (cx >= -3 && cx <= 3) {
      this.generateEndMainIsland(chunk);
    }
    // Otherwise the chunk is void (all air), which is the default
  }

  private generateEndMainIsland(chunk: Chunk): void {
    const cx = chunk.cx;
    const islandCenter = 0; // world x = 0
    const islandRadius = 3.5 * CHUNK_WIDTH; // covers chunks -3 to 3

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      const worldX = cx * CHUNK_WIDTH + lx;
      const distFromCenter = Math.abs(worldX - islandCenter);
      const normalizedDist = distFromCenter / islandRadius;

      if (normalizedDist > 1) continue;

      // Island height varies: thicker in center, thinner at edges
      const islandThickness = Math.floor(10 * (1 - normalizedDist * normalizedDist));
      const baseY = 60;
      const topY = baseY + islandThickness;

      for (let y = baseY; y <= topY; y++) {
        chunk.setBlock(lx, y, BlockType.END_STONE);
      }
    }

    // Obsidian pillars (10 pillars spread across the island)
    const pillarPositions = [
      { chunkX: -2, localX: 8, height: 30 },
      { chunkX: -1, localX: 4, height: 45 },
      { chunkX: -1, localX: 12, height: 25 },
      { chunkX: 0, localX: 3, height: 50 },
      { chunkX: 0, localX: 10, height: 35 },
      { chunkX: 0, localX: 14, height: 55 },
      { chunkX: 1, localX: 2, height: 40 },
      { chunkX: 1, localX: 9, height: 28 },
      { chunkX: 2, localX: 5, height: 38 },
      { chunkX: 2, localX: 12, height: 48 },
    ];

    for (const pillar of pillarPositions) {
      if (pillar.chunkX !== cx) continue;
      const plx = pillar.localX;
      const pillarBase = 70;
      const pillarTop = pillarBase + pillar.height;

      // 3-wide pillar (plx-1, plx, plx+1)
      for (let y = pillarBase; y <= pillarTop; y++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = plx + dx;
          if (px >= 0 && px < CHUNK_WIDTH) {
            chunk.setBlock(px, y, BlockType.OBSIDIAN);
          }
        }
      }

      // End crystal on top
      chunk.setBlock(plx, pillarTop + 1, BlockType.END_CRYSTAL_BLOCK);
    }

    // End portal frame at center (chunk 0)
    if (cx === 0) {
      this.generateEndPortalFrame(chunk);
    }
  }

  private generateEndPortalFrame(chunk: Chunk): void {
    const centerX = 8;
    const portalY = 71;

    // 3x3 ring with corners removed (forms a plus/cross pattern of portal frames)
    // Bottom row
    chunk.setBlock(centerX - 1, portalY, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX, portalY, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY, BlockType.END_PORTAL_FRAME);
    // Middle row (sides only)
    chunk.setBlock(centerX - 1, portalY + 1, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY + 1, BlockType.END_PORTAL_FRAME);
    // Top row
    chunk.setBlock(centerX - 1, portalY + 2, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX, portalY + 2, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY + 2, BlockType.END_PORTAL_FRAME);
  }

  private getBiome(worldX: number): BiomeType {
    const biomeVal = this.biome.noise2D(worldX * 0.005, 0);
    const moisture = this.biome.noise2D(worldX * 0.003 + 1000, 500);

    if (biomeVal < -0.5) {
      return BiomeType.OCEAN;
    } else if (biomeVal < -0.2) {
      return moisture > 0.2 ? BiomeType.TAIGA : BiomeType.PLAINS;
    } else if (biomeVal < 0.1) {
      return moisture > 0 ? BiomeType.FOREST : BiomeType.PLAINS;
    } else if (biomeVal < 0.35) {
      return BiomeType.MOUNTAINS;
    } else {
      return moisture < -0.1 ? BiomeType.DESERT : BiomeType.PLAINS;
    }
  }

  private getHeight(worldX: number, _biome: BiomeType): number {
    // Blend heights from nearby positions for smooth biome transitions
    const blendRadius = 8;
    let totalHeight = 0;
    let totalWeight = 0;

    for (let dx = -blendRadius; dx <= blendRadius; dx++) {
      const sampleX = worldX + dx;
      const weight = 1 - Math.abs(dx) / (blendRadius + 1);
      const sampleBiome = this.getBiome(sampleX);
      const baseNoise = this.fbm(sampleX * 0.01, 0, 6, 0.5, 2.0);
      const h = this.getBiomeHeight(sampleBiome, baseNoise);
      totalHeight += h * weight;
      totalWeight += weight;
    }

    return totalHeight / totalWeight;
  }

  private getBiomeHeight(biome: BiomeType, noise: number): number {
    switch (biome) {
      case BiomeType.PLAINS:
        return 64 + noise * 4;
      case BiomeType.FOREST:
        return 64 + noise * 8;
      case BiomeType.DESERT:
        return 63 + noise * 3;
      case BiomeType.MOUNTAINS:
        return 70 + noise * 20;
      case BiomeType.TAIGA:
        return 64 + noise * 6;
      case BiomeType.OCEAN:
        return 45 + (noise + 1) * 6;
      default:
        return 64 + noise * 4;
    }
  }

  private fbm(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
  ): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.terrain.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue; // normalized to roughly -1..1
  }

  private generateCaves(chunk: Chunk): void {
    const cx = chunk.cx;

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      const worldX = cx * CHUNK_WIDTH + lx;

      for (let y = BEDROCK_LEVEL + 1; y < 50; y++) {
        const caveVal = this.cave.noise2D(worldX * 0.05, y * 0.07);
        const caveVal2 = this.cave.noise2D(worldX * 0.08 + 300, y * 0.08 + 300);
        const combined = (caveVal + caveVal2) / 2;

        if (combined > 0.3) {
          const currentBlock = chunk.getBlock(lx, y);
          // Don't carve through bedrock, water, or air
          if (
            currentBlock !== BlockType.BEDROCK &&
            currentBlock !== BlockType.WATER &&
            currentBlock !== BlockType.AIR
          ) {
            chunk.setBlock(lx, y, BlockType.AIR);
          }
        }
      }
    }
  }

  private generateOres(chunk: Chunk): void {
    const cx = chunk.cx;

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      const worldX = cx * CHUNK_WIDTH + lx;

      for (let y = BEDROCK_LEVEL + 1; y < 80; y++) {
        if (chunk.getBlock(lx, y) !== BlockType.STONE) continue;

        this.rand.seed = this.seed + worldX * 6271 + y * 311;
        const roll = this.rand.next();
        const oreNoise = this.ore.noise2D(worldX * 0.1 + y * 0.1, y * 0.1 + worldX * 0.05);

        // Coal: y < 80, most common
        if (y < 80 && roll < 0.02 && oreNoise > 0.2) {
          chunk.setBlock(lx, y, BlockType.COAL_ORE);
          continue;
        }

        // Iron: y < 50
        if (y < 50 && roll < 0.015 && oreNoise > 0.25) {
          chunk.setBlock(lx, y, BlockType.IRON_ORE);
          continue;
        }

        // Gold: y < 30
        if (y < 30 && roll < 0.008 && oreNoise > 0.3) {
          chunk.setBlock(lx, y, BlockType.GOLD_ORE);
          continue;
        }

        // Lapis: y < 30
        if (y < 30 && roll > 0.98 && oreNoise > 0.3) {
          chunk.setBlock(lx, y, BlockType.LAPIS_ORE);
          continue;
        }

        // Redstone: y < 16
        if (y < 16 && roll < 0.012 && oreNoise > 0.2) {
          chunk.setBlock(lx, y, BlockType.REDSTONE_ORE);
          continue;
        }

        // Emerald: y < 32
        if (y < 32 && roll > 0.995 && oreNoise > 0.4) {
          chunk.setBlock(lx, y, BlockType.EMERALD_ORE);
          continue;
        }

        // Diamond: y < 16, rarest
        if (y < 16 && roll > 0.99 && oreNoise > 0.35) {
          chunk.setBlock(lx, y, BlockType.DIAMOND_ORE);
        }
      }
    }
  }

  private generateTree(chunk: Chunk, lx: number, y: number, birch: boolean): void {
    this.rand.seed = this.seed + (chunk.cx * CHUNK_WIDTH + lx) * 9371 + y * 47;
    const trunkHeight = 4 + Math.floor(this.rand.next() * 4); // 4-7

    const logType = birch ? BlockType.BIRCH_LOG : BlockType.OAK_LOG;
    const leafType = birch ? BlockType.BIRCH_LEAVES : BlockType.OAK_LEAVES;

    // Check space available
    if (y + trunkHeight + 2 >= CHUNK_HEIGHT) return;

    // Place trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      chunk.setBlock(lx, y + dy, logType);
    }

    // Place leaves blob (around top of trunk)
    const leafStart = y + trunkHeight - 2;
    const leafEnd = y + trunkHeight + 1;

    for (let ly = leafStart; ly <= leafEnd; ly++) {
      const distFromTop = leafEnd - ly;
      let leafRadius: number;

      if (ly === leafEnd) {
        leafRadius = 1; // top layer: narrow
      } else if (distFromTop <= 1) {
        leafRadius = 2; // upper layers: medium
      } else {
        leafRadius = 2; // lower layers: wide
      }

      for (let dx = -leafRadius; dx <= leafRadius; dx++) {
        const px = lx + dx;
        if (px < 0 || px >= CHUNK_WIDTH) continue;

        // Skip corners on wider layers for a rounder look
        if (Math.abs(dx) === leafRadius && leafRadius === 2 && ly === leafStart) {
          this.rand.seed = this.seed + px * 113 + ly * 337;
          if (this.rand.next() < 0.5) continue;
        }

        // Don't overwrite trunk
        if (dx === 0 && ly < y + trunkHeight) continue;

        if (chunk.getBlock(px, ly) === BlockType.AIR) {
          chunk.setBlock(px, ly, leafType);
        }
      }
    }
  }

  private generateStronghold(chunk: Chunk): void {
    const cx = chunk.cx;
    // Stronghold at chunks 20-25 (worldX 320-400), underground at y=20-40
    if (cx < 20 || cx > 25) return;

    const baseY = 25;
    const hallHeight = 6;
    const hallTop = baseY + hallHeight;

    for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
      // Floor
      chunk.setBlock(lx, baseY - 1, BlockType.STONE_BRICKS);

      // Walls
      if (lx === 0 || lx === CHUNK_WIDTH - 1) {
        for (let y = baseY; y <= hallTop; y++) {
          this.rand.seed = this.seed + (cx * CHUNK_WIDTH + lx) * 431 + y * 73;
          const block =
            this.rand.next() < 0.3
              ? BlockType.MOSSY_COBBLESTONE
              : BlockType.STONE_BRICKS;
          chunk.setBlock(lx, y, block);
        }
      } else {
        // Interior: clear space
        for (let y = baseY; y <= hallTop; y++) {
          chunk.setBlock(lx, y, BlockType.AIR);
        }
      }

      // Ceiling
      this.rand.seed = this.seed + (cx * CHUNK_WIDTH + lx) * 619 + hallTop * 37;
      const ceilingBlock =
        this.rand.next() < 0.2
          ? BlockType.MOSSY_COBBLESTONE
          : BlockType.STONE_BRICKS;
      chunk.setBlock(lx, hallTop + 1, ceilingBlock);
    }

    // End portal room in chunk 22
    if (cx === 22) {
      this.generateEndPortalRoom(chunk, baseY);
    }

    // Spawner in chunks 21 and 24
    if (cx === 21 || cx === 24) {
      chunk.setBlock(8, baseY, BlockType.SPAWNER);
    }
  }

  private generateEndPortalRoom(chunk: Chunk, baseY: number): void {
    const centerX = 8;
    const portalY = baseY;

    // End portal frame in a ring: 3x3 with corners removed
    // Bottom row
    chunk.setBlock(centerX - 1, portalY, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX, portalY, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY, BlockType.END_PORTAL_FRAME);
    // Middle (sides only)
    chunk.setBlock(centerX - 1, portalY + 1, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY + 1, BlockType.END_PORTAL_FRAME);
    // Top row
    chunk.setBlock(centerX - 1, portalY + 2, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX, portalY + 2, BlockType.END_PORTAL_FRAME);
    chunk.setBlock(centerX + 1, portalY + 2, BlockType.END_PORTAL_FRAME);

    // Lava pool beneath portal
    for (let dx = -1; dx <= 1; dx++) {
      chunk.setBlock(centerX + dx, portalY - 1, BlockType.LAVA);
    }

    // Stairway up to portal
    for (let step = 0; step < 3; step++) {
      chunk.setBlock(centerX - 3 + step, portalY + step, BlockType.STONE_BRICKS);
      chunk.setBlock(centerX + 3 - step, portalY + step, BlockType.STONE_BRICKS);
    }
  }

  private seededRandom(x: number, y: number): number {
    this.rand.seed = this.seed + x * 12979 + y * 6577;
    return this.rand.next();
  }
}
