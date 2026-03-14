// ─── GAME CONSTANTS ───
export const TILE_SIZE = 16;
export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 256;
export const RENDER_DISTANCE = 6;
export const SEA_LEVEL = 64;
export const BEDROCK_LEVEL = 5;
export const MAX_LIGHT = 15;
export const DAY_LENGTH = 24000;
export const TICK_RATE = 20;
export const GRAVITY = 28;
export const PLAYER_SPEED = 4.3;
export const JUMP_FORCE = 12;
export const TERMINAL_VELOCITY = 20;
export const PLAYER_REACH = 5;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const SPAWN_X = 0;
export const SPAWN_Y = 80;
export const INVENTORY_SIZE = 36;
export const HOTBAR_SIZE = 9;
export const ARMOR_SLOTS = 4;

// ─── ENUMS ───
export enum Dimension { OVERWORLD, NETHER, END }

export enum GameState { MENU, LOADING, PLAYING, INVENTORY, CRAFTING, FURNACE, PAUSED, DEAD, VICTORY }

export enum BiomeType { PLAINS, FOREST, DESERT, TAIGA, SWAMP, MOUNTAINS, OCEAN }

export enum MobType {
  PIG, COW, SHEEP, CHICKEN,
  ZOMBIE, SKELETON, CREEPER, SPIDER, ENDERMAN,
  GHAST, BLAZE, ZOMBIE_PIGLIN,
  ENDER_DRAGON
}

export enum ToolType { NONE, PICKAXE, AXE, SHOVEL, SWORD, HOE }
export enum ArmorSlot { HELMET, CHESTPLATE, LEGGINGS, BOOTS }
export enum Direction { LEFT = -1, RIGHT = 1 }

export enum BlockType {
  AIR, STONE, DIRT, GRASS, SAND, GRAVEL, BEDROCK, WATER, LAVA,
  OAK_LOG, OAK_LEAVES, OAK_PLANKS, BIRCH_LOG, BIRCH_LEAVES, BIRCH_PLANKS,
  COBBLESTONE, MOSSY_COBBLESTONE,
  COAL_ORE, IRON_ORE, GOLD_ORE, DIAMOND_ORE, EMERALD_ORE, REDSTONE_ORE, LAPIS_ORE,
  OBSIDIAN, GLASS, TORCH,
  CRAFTING_TABLE, FURNACE, FURNACE_LIT, CHEST, ENCHANTING_TABLE, BREWING_STAND, ANVIL,
  IRON_BLOCK, GOLD_BLOCK, DIAMOND_BLOCK, EMERALD_BLOCK,
  SNOW, ICE, CLAY, SANDSTONE, CACTUS, SUGAR_CANE,
  PUMPKIN, MELON, FARMLAND,
  WHEAT, TALL_GRASS, FLOWER_RED, FLOWER_YELLOW,
  NETHER_PORTAL, NETHERRACK, SOUL_SAND, GLOWSTONE, NETHER_BRICKS, QUARTZ_ORE, MAGMA_BLOCK, NETHER_WART_BLOCK,
  END_PORTAL, END_PORTAL_FRAME, END_STONE, PURPUR_BLOCK,
  TNT, BOOKSHELF, SPAWNER, LADDER,
  STONE_BRICKS, IRON_BARS,
  END_CRYSTAL_BLOCK
}

export enum ItemType {
  // Block items (same order as BlockType for easy mapping)
  BLOCK_STONE, BLOCK_DIRT, BLOCK_GRASS, BLOCK_SAND, BLOCK_GRAVEL,
  BLOCK_OAK_LOG, BLOCK_OAK_PLANKS, BLOCK_BIRCH_LOG, BLOCK_BIRCH_PLANKS,
  BLOCK_COBBLESTONE, BLOCK_MOSSY_COBBLESTONE,
  BLOCK_OBSIDIAN, BLOCK_GLASS, BLOCK_TORCH,
  BLOCK_CRAFTING_TABLE, BLOCK_FURNACE, BLOCK_CHEST,
  BLOCK_ENCHANTING_TABLE, BLOCK_BREWING_STAND, BLOCK_ANVIL,
  BLOCK_IRON_BLOCK, BLOCK_GOLD_BLOCK, BLOCK_DIAMOND_BLOCK, BLOCK_EMERALD_BLOCK,
  BLOCK_SANDSTONE, BLOCK_SNOW, BLOCK_ICE, BLOCK_CLAY,
  BLOCK_NETHER_BRICKS, BLOCK_GLOWSTONE, BLOCK_SOUL_SAND,
  BLOCK_END_STONE, BLOCK_PURPUR_BLOCK,
  BLOCK_TNT, BLOCK_BOOKSHELF, BLOCK_LADDER,
  BLOCK_PUMPKIN, BLOCK_MELON, BLOCK_CACTUS,
  BLOCK_STONE_BRICKS, BLOCK_IRON_BARS, BLOCK_NETHERRACK, BLOCK_MAGMA_BLOCK,
  // Pickaxes
  WOODEN_PICKAXE, STONE_PICKAXE, IRON_PICKAXE, GOLD_PICKAXE, DIAMOND_PICKAXE,
  // Axes
  WOODEN_AXE, STONE_AXE, IRON_AXE, GOLD_AXE, DIAMOND_AXE,
  // Shovels
  WOODEN_SHOVEL, STONE_SHOVEL, IRON_SHOVEL, GOLD_SHOVEL, DIAMOND_SHOVEL,
  // Swords
  WOODEN_SWORD, STONE_SWORD, IRON_SWORD, GOLD_SWORD, DIAMOND_SWORD,
  // Hoes
  WOODEN_HOE, STONE_HOE, IRON_HOE, GOLD_HOE, DIAMOND_HOE,
  // Armor
  LEATHER_HELMET, LEATHER_CHESTPLATE, LEATHER_LEGGINGS, LEATHER_BOOTS,
  IRON_HELMET, IRON_CHESTPLATE, IRON_LEGGINGS, IRON_BOOTS,
  GOLD_HELMET, GOLD_CHESTPLATE, GOLD_LEGGINGS, GOLD_BOOTS,
  DIAMOND_HELMET, DIAMOND_CHESTPLATE, DIAMOND_LEGGINGS, DIAMOND_BOOTS,
  // Ranged
  BOW, ARROW,
  // Tools
  FLINT_AND_STEEL, SHEARS, BUCKET, WATER_BUCKET, LAVA_BUCKET,
  // Materials
  COAL, IRON_INGOT, GOLD_INGOT, DIAMOND, EMERALD, REDSTONE, LAPIS_LAZULI, QUARTZ, FLINT,
  STICK, STRING, FEATHER, LEATHER, BONE, GUNPOWDER,
  ENDER_PEARL, BLAZE_ROD, BLAZE_POWDER, GHAST_TEAR, NETHER_WART,
  EYE_OF_ENDER, BOOK,
  // Food
  RAW_BEEF, COOKED_BEEF, RAW_PORKCHOP, COOKED_PORKCHOP,
  RAW_CHICKEN, COOKED_CHICKEN, BREAD, APPLE, GOLDEN_APPLE, MELON_SLICE,
  // Potions
  GLASS_BOTTLE, POTION_HEALING, POTION_STRENGTH, POTION_SPEED, POTION_FIRE_RESISTANCE,
  // Special
  DRAGON_BREATH, NETHER_STAR,
  // Saplings/seeds
  OAK_SAPLING, BIRCH_SAPLING, WHEAT_SEEDS,
  SUGAR_CANE_ITEM, BONE_MEAL,
  // Raw ores (for smelting)
  IRON_ORE, GOLD_ORE,
}

// ─── INTERFACES ───
export interface BlockData {
  hardness: number;
  tool: ToolType;
  minTier: number; // 0=hand, 1=wood, 2=stone, 3=iron, 4=gold, 5=diamond
  transparent: boolean;
  solid: boolean;
  lightLevel: number;
  drops: ItemType | null;
  dropCount: number;
  replaceable: boolean;
  flammable: boolean;
  fluid: boolean;
}

export interface ItemData {
  name: string;
  stackSize: number;
  durability: number;
  damage: number;
  armorValue: number;
  armorSlot: ArmorSlot | null;
  toolType: ToolType;
  toolTier: number;
  foodValue: number;
  saturation: number;
  blockType: BlockType | null; // for placeable items
  fuelValue: number; // burn time in ticks
}

export interface ItemStack {
  type: ItemType;
  count: number;
  durability: number;
}

export interface CraftingRecipe {
  width: number;
  height: number;
  pattern: (ItemType | null)[];
  result: ItemType;
  resultCount: number;
}

export interface SmeltingRecipe {
  input: ItemType;
  output: ItemType;
  xp: number;
  cookTime: number;
}

export interface MobData {
  name: string;
  health: number;
  damage: number;
  speed: number;
  hostile: boolean;
  width: number;
  height: number;
  drops: { item: ItemType; min: number; max: number; chance: number }[];
  xpDrop: number;
  spawnLight: number; // max light level for spawning (-1 = any)
  dimension: Dimension;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
  gravity: boolean;
}

export interface Entity {
  x: number; y: number;
  vx: number; vy: number;
  width: number; height: number;
  onGround: boolean;
}

export interface DroppedItem {
  x: number; y: number;
  vx: number; vy: number;
  item: ItemStack;
  pickupDelay: number;
  age: number;
}

// ─── BLOCK REGISTRY ───
function b(
  hardness: number, tool: ToolType, minTier: number,
  opts: Partial<BlockData> = {}
): BlockData {
  return {
    hardness, tool, minTier,
    transparent: false, solid: true, lightLevel: 0,
    drops: null, dropCount: 1, replaceable: false,
    flammable: false, fluid: false,
    ...opts,
  };
}

export const BLOCK_DATA: Record<BlockType, BlockData> = {
  [BlockType.AIR]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, replaceable: true }),
  [BlockType.STONE]: b(1.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_COBBLESTONE }),
  [BlockType.DIRT]: b(0.5, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_DIRT }),
  [BlockType.GRASS]: b(0.6, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_DIRT }),
  [BlockType.SAND]: b(0.5, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_SAND }),
  [BlockType.GRAVEL]: b(0.6, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_GRAVEL }),
  [BlockType.BEDROCK]: b(-1, ToolType.NONE, 0),
  [BlockType.WATER]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, replaceable: true, fluid: true }),
  [BlockType.LAVA]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, replaceable: true, fluid: true, lightLevel: 15 }),
  [BlockType.OAK_LOG]: b(2, ToolType.AXE, 0, { drops: ItemType.BLOCK_OAK_LOG, flammable: true }),
  [BlockType.OAK_LEAVES]: b(0.2, ToolType.NONE, 0, { transparent: true, drops: null, flammable: true }),
  [BlockType.OAK_PLANKS]: b(2, ToolType.AXE, 0, { drops: ItemType.BLOCK_OAK_PLANKS, flammable: true }),
  [BlockType.BIRCH_LOG]: b(2, ToolType.AXE, 0, { drops: ItemType.BLOCK_BIRCH_LOG, flammable: true }),
  [BlockType.BIRCH_LEAVES]: b(0.2, ToolType.NONE, 0, { transparent: true, drops: null, flammable: true }),
  [BlockType.BIRCH_PLANKS]: b(2, ToolType.AXE, 0, { drops: ItemType.BLOCK_BIRCH_PLANKS, flammable: true }),
  [BlockType.COBBLESTONE]: b(2, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_COBBLESTONE }),
  [BlockType.MOSSY_COBBLESTONE]: b(2, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_MOSSY_COBBLESTONE }),
  [BlockType.COAL_ORE]: b(3, ToolType.PICKAXE, 1, { drops: ItemType.COAL }),
  [BlockType.IRON_ORE]: b(3, ToolType.PICKAXE, 2, { drops: ItemType.IRON_ORE }),
  [BlockType.GOLD_ORE]: b(3, ToolType.PICKAXE, 3, { drops: ItemType.GOLD_ORE }),
  [BlockType.DIAMOND_ORE]: b(3, ToolType.PICKAXE, 3, { drops: ItemType.DIAMOND }),
  [BlockType.EMERALD_ORE]: b(3, ToolType.PICKAXE, 3, { drops: ItemType.EMERALD }),
  [BlockType.REDSTONE_ORE]: b(3, ToolType.PICKAXE, 3, { drops: ItemType.REDSTONE, dropCount: 4 }),
  [BlockType.LAPIS_ORE]: b(3, ToolType.PICKAXE, 2, { drops: ItemType.LAPIS_LAZULI, dropCount: 6 }),
  [BlockType.OBSIDIAN]: b(50, ToolType.PICKAXE, 5, { drops: ItemType.BLOCK_OBSIDIAN }),
  [BlockType.GLASS]: b(0.3, ToolType.NONE, 0, { transparent: true, drops: null }),
  [BlockType.TORCH]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, lightLevel: 14, drops: ItemType.BLOCK_TORCH }),
  [BlockType.CRAFTING_TABLE]: b(2.5, ToolType.AXE, 0, { drops: ItemType.BLOCK_CRAFTING_TABLE }),
  [BlockType.FURNACE]: b(3.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_FURNACE }),
  [BlockType.FURNACE_LIT]: b(3.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_FURNACE, lightLevel: 13 }),
  [BlockType.CHEST]: b(2.5, ToolType.AXE, 0, { drops: ItemType.BLOCK_CHEST }),
  [BlockType.ENCHANTING_TABLE]: b(5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_ENCHANTING_TABLE, lightLevel: 7 }),
  [BlockType.BREWING_STAND]: b(0.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_BREWING_STAND }),
  [BlockType.ANVIL]: b(5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_ANVIL }),
  [BlockType.IRON_BLOCK]: b(5, ToolType.PICKAXE, 2, { drops: ItemType.BLOCK_IRON_BLOCK }),
  [BlockType.GOLD_BLOCK]: b(3, ToolType.PICKAXE, 3, { drops: ItemType.BLOCK_GOLD_BLOCK }),
  [BlockType.DIAMOND_BLOCK]: b(5, ToolType.PICKAXE, 3, { drops: ItemType.BLOCK_DIAMOND_BLOCK }),
  [BlockType.EMERALD_BLOCK]: b(5, ToolType.PICKAXE, 3, { drops: ItemType.BLOCK_EMERALD_BLOCK }),
  [BlockType.SNOW]: b(0.1, ToolType.SHOVEL, 0, { drops: null }),
  [BlockType.ICE]: b(0.5, ToolType.PICKAXE, 0, { transparent: true, drops: null }),
  [BlockType.CLAY]: b(0.6, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_CLAY }),
  [BlockType.SANDSTONE]: b(0.8, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_SANDSTONE }),
  [BlockType.CACTUS]: b(0.4, ToolType.NONE, 0, { drops: ItemType.BLOCK_CACTUS, transparent: true }),
  [BlockType.SUGAR_CANE]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, drops: ItemType.SUGAR_CANE_ITEM }),
  [BlockType.PUMPKIN]: b(1, ToolType.AXE, 0, { drops: ItemType.BLOCK_PUMPKIN }),
  [BlockType.MELON]: b(1, ToolType.AXE, 0, { drops: ItemType.MELON_SLICE, dropCount: 5 }),
  [BlockType.FARMLAND]: b(0.6, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_DIRT }),
  [BlockType.WHEAT]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, drops: ItemType.WHEAT_SEEDS }),
  [BlockType.TALL_GRASS]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, replaceable: true, flammable: true, drops: null }),
  [BlockType.FLOWER_RED]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, drops: null }),
  [BlockType.FLOWER_YELLOW]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, drops: null }),
  [BlockType.NETHER_PORTAL]: b(-1, ToolType.NONE, 0, { transparent: true, solid: false, lightLevel: 11 }),
  [BlockType.NETHERRACK]: b(0.4, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_NETHERRACK }),
  [BlockType.SOUL_SAND]: b(0.5, ToolType.SHOVEL, 0, { drops: ItemType.BLOCK_SOUL_SAND }),
  [BlockType.GLOWSTONE]: b(0.3, ToolType.NONE, 0, { lightLevel: 15, drops: ItemType.BLOCK_GLOWSTONE }),
  [BlockType.NETHER_BRICKS]: b(2, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_NETHER_BRICKS }),
  [BlockType.QUARTZ_ORE]: b(3, ToolType.PICKAXE, 1, { drops: ItemType.QUARTZ }),
  [BlockType.MAGMA_BLOCK]: b(0.5, ToolType.PICKAXE, 1, { lightLevel: 3, drops: ItemType.BLOCK_MAGMA_BLOCK }),
  [BlockType.NETHER_WART_BLOCK]: b(1, ToolType.NONE, 0, { drops: null }),
  [BlockType.END_PORTAL]: b(-1, ToolType.NONE, 0, { transparent: true, solid: false, lightLevel: 15 }),
  [BlockType.END_PORTAL_FRAME]: b(-1, ToolType.NONE, 0),
  [BlockType.END_STONE]: b(3, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_END_STONE }),
  [BlockType.PURPUR_BLOCK]: b(1.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_PURPUR_BLOCK }),
  [BlockType.TNT]: b(0, ToolType.NONE, 0, { drops: ItemType.BLOCK_TNT, flammable: true }),
  [BlockType.BOOKSHELF]: b(1.5, ToolType.AXE, 0, { drops: ItemType.BOOK, dropCount: 3, flammable: true }),
  [BlockType.SPAWNER]: b(5, ToolType.PICKAXE, 1, { drops: null }),
  [BlockType.LADDER]: b(0.4, ToolType.AXE, 0, { transparent: true, solid: false, drops: ItemType.BLOCK_LADDER }),
  [BlockType.STONE_BRICKS]: b(1.5, ToolType.PICKAXE, 1, { drops: ItemType.BLOCK_STONE_BRICKS }),
  [BlockType.IRON_BARS]: b(5, ToolType.PICKAXE, 1, { transparent: true, drops: ItemType.BLOCK_IRON_BARS }),
  [BlockType.END_CRYSTAL_BLOCK]: b(0, ToolType.NONE, 0, { transparent: true, solid: false, lightLevel: 10 }),
};

// ─── ITEM REGISTRY ───
function item(name: string, opts: Partial<ItemData> = {}): ItemData {
  return {
    name, stackSize: 64, durability: 0, damage: 1,
    armorValue: 0, armorSlot: null, toolType: ToolType.NONE,
    toolTier: 0, foodValue: 0, saturation: 0, blockType: null,
    fuelValue: 0, ...opts,
  };
}

const TOOL_DURABILITIES = [60, 132, 251, 33, 1562]; // wood, stone, iron, gold, diamond
const TOOL_DAMAGES = [0, 1, 2, 1, 3]; // bonus damage by tier
const ARMOR_VALUES: Record<string, number[]> = {
  helmet: [1, 2, 2, 3],
  chestplate: [3, 5, 5, 8],
  leggings: [2, 4, 3, 6],
  boots: [1, 2, 1, 3],
};

export const ITEM_DATA: Record<ItemType, ItemData> = {
  // Block items
  [ItemType.BLOCK_STONE]: item('Stone', { blockType: BlockType.STONE }),
  [ItemType.BLOCK_DIRT]: item('Dirt', { blockType: BlockType.DIRT }),
  [ItemType.BLOCK_GRASS]: item('Grass Block', { blockType: BlockType.GRASS }),
  [ItemType.BLOCK_SAND]: item('Sand', { blockType: BlockType.SAND }),
  [ItemType.BLOCK_GRAVEL]: item('Gravel', { blockType: BlockType.GRAVEL }),
  [ItemType.BLOCK_OAK_LOG]: item('Oak Log', { blockType: BlockType.OAK_LOG, fuelValue: 300 }),
  [ItemType.BLOCK_OAK_PLANKS]: item('Oak Planks', { blockType: BlockType.OAK_PLANKS, fuelValue: 300 }),
  [ItemType.BLOCK_BIRCH_LOG]: item('Birch Log', { blockType: BlockType.BIRCH_LOG, fuelValue: 300 }),
  [ItemType.BLOCK_BIRCH_PLANKS]: item('Birch Planks', { blockType: BlockType.BIRCH_PLANKS, fuelValue: 300 }),
  [ItemType.BLOCK_COBBLESTONE]: item('Cobblestone', { blockType: BlockType.COBBLESTONE }),
  [ItemType.BLOCK_MOSSY_COBBLESTONE]: item('Mossy Cobblestone', { blockType: BlockType.MOSSY_COBBLESTONE }),
  [ItemType.BLOCK_OBSIDIAN]: item('Obsidian', { blockType: BlockType.OBSIDIAN }),
  [ItemType.BLOCK_GLASS]: item('Glass', { blockType: BlockType.GLASS }),
  [ItemType.BLOCK_TORCH]: item('Torch', { blockType: BlockType.TORCH }),
  [ItemType.BLOCK_CRAFTING_TABLE]: item('Crafting Table', { blockType: BlockType.CRAFTING_TABLE, fuelValue: 300 }),
  [ItemType.BLOCK_FURNACE]: item('Furnace', { blockType: BlockType.FURNACE }),
  [ItemType.BLOCK_CHEST]: item('Chest', { blockType: BlockType.CHEST, fuelValue: 300 }),
  [ItemType.BLOCK_ENCHANTING_TABLE]: item('Enchanting Table', { blockType: BlockType.ENCHANTING_TABLE }),
  [ItemType.BLOCK_BREWING_STAND]: item('Brewing Stand', { blockType: BlockType.BREWING_STAND }),
  [ItemType.BLOCK_ANVIL]: item('Anvil', { blockType: BlockType.ANVIL }),
  [ItemType.BLOCK_IRON_BLOCK]: item('Iron Block', { blockType: BlockType.IRON_BLOCK }),
  [ItemType.BLOCK_GOLD_BLOCK]: item('Gold Block', { blockType: BlockType.GOLD_BLOCK }),
  [ItemType.BLOCK_DIAMOND_BLOCK]: item('Diamond Block', { blockType: BlockType.DIAMOND_BLOCK }),
  [ItemType.BLOCK_EMERALD_BLOCK]: item('Emerald Block', { blockType: BlockType.EMERALD_BLOCK }),
  [ItemType.BLOCK_SANDSTONE]: item('Sandstone', { blockType: BlockType.SANDSTONE }),
  [ItemType.BLOCK_SNOW]: item('Snow', { blockType: BlockType.SNOW }),
  [ItemType.BLOCK_ICE]: item('Ice', { blockType: BlockType.ICE }),
  [ItemType.BLOCK_CLAY]: item('Clay', { blockType: BlockType.CLAY }),
  [ItemType.BLOCK_NETHER_BRICKS]: item('Nether Bricks', { blockType: BlockType.NETHER_BRICKS }),
  [ItemType.BLOCK_GLOWSTONE]: item('Glowstone', { blockType: BlockType.GLOWSTONE }),
  [ItemType.BLOCK_SOUL_SAND]: item('Soul Sand', { blockType: BlockType.SOUL_SAND }),
  [ItemType.BLOCK_END_STONE]: item('End Stone', { blockType: BlockType.END_STONE }),
  [ItemType.BLOCK_PURPUR_BLOCK]: item('Purpur Block', { blockType: BlockType.PURPUR_BLOCK }),
  [ItemType.BLOCK_TNT]: item('TNT', { blockType: BlockType.TNT }),
  [ItemType.BLOCK_BOOKSHELF]: item('Bookshelf', { blockType: BlockType.BOOKSHELF, fuelValue: 300 }),
  [ItemType.BLOCK_LADDER]: item('Ladder', { blockType: BlockType.LADDER }),
  [ItemType.BLOCK_PUMPKIN]: item('Pumpkin', { blockType: BlockType.PUMPKIN }),
  [ItemType.BLOCK_MELON]: item('Melon', { blockType: BlockType.MELON }),
  [ItemType.BLOCK_CACTUS]: item('Cactus', { blockType: BlockType.CACTUS }),
  [ItemType.BLOCK_STONE_BRICKS]: item('Stone Bricks', { blockType: BlockType.STONE_BRICKS }),
  [ItemType.BLOCK_IRON_BARS]: item('Iron Bars', { blockType: BlockType.IRON_BARS }),
  [ItemType.BLOCK_NETHERRACK]: item('Netherrack', { blockType: BlockType.NETHERRACK }),
  [ItemType.BLOCK_MAGMA_BLOCK]: item('Magma Block', { blockType: BlockType.MAGMA_BLOCK }),
  // Pickaxes
  [ItemType.WOODEN_PICKAXE]: item('Wooden Pickaxe', { stackSize: 1, durability: TOOL_DURABILITIES[0], damage: 2 + TOOL_DAMAGES[0], toolType: ToolType.PICKAXE, toolTier: 1, fuelValue: 200 }),
  [ItemType.STONE_PICKAXE]: item('Stone Pickaxe', { stackSize: 1, durability: TOOL_DURABILITIES[1], damage: 2 + TOOL_DAMAGES[1], toolType: ToolType.PICKAXE, toolTier: 2 }),
  [ItemType.IRON_PICKAXE]: item('Iron Pickaxe', { stackSize: 1, durability: TOOL_DURABILITIES[2], damage: 2 + TOOL_DAMAGES[2], toolType: ToolType.PICKAXE, toolTier: 3 }),
  [ItemType.GOLD_PICKAXE]: item('Gold Pickaxe', { stackSize: 1, durability: TOOL_DURABILITIES[3], damage: 2 + TOOL_DAMAGES[3], toolType: ToolType.PICKAXE, toolTier: 4 }),
  [ItemType.DIAMOND_PICKAXE]: item('Diamond Pickaxe', { stackSize: 1, durability: TOOL_DURABILITIES[4], damage: 2 + TOOL_DAMAGES[4], toolType: ToolType.PICKAXE, toolTier: 5 }),
  // Axes
  [ItemType.WOODEN_AXE]: item('Wooden Axe', { stackSize: 1, durability: TOOL_DURABILITIES[0], damage: 3 + TOOL_DAMAGES[0], toolType: ToolType.AXE, toolTier: 1, fuelValue: 200 }),
  [ItemType.STONE_AXE]: item('Stone Axe', { stackSize: 1, durability: TOOL_DURABILITIES[1], damage: 3 + TOOL_DAMAGES[1], toolType: ToolType.AXE, toolTier: 2 }),
  [ItemType.IRON_AXE]: item('Iron Axe', { stackSize: 1, durability: TOOL_DURABILITIES[2], damage: 3 + TOOL_DAMAGES[2], toolType: ToolType.AXE, toolTier: 3 }),
  [ItemType.GOLD_AXE]: item('Gold Axe', { stackSize: 1, durability: TOOL_DURABILITIES[3], damage: 3 + TOOL_DAMAGES[3], toolType: ToolType.AXE, toolTier: 4 }),
  [ItemType.DIAMOND_AXE]: item('Diamond Axe', { stackSize: 1, durability: TOOL_DURABILITIES[4], damage: 3 + TOOL_DAMAGES[4], toolType: ToolType.AXE, toolTier: 5 }),
  // Shovels
  [ItemType.WOODEN_SHOVEL]: item('Wooden Shovel', { stackSize: 1, durability: TOOL_DURABILITIES[0], damage: 1 + TOOL_DAMAGES[0], toolType: ToolType.SHOVEL, toolTier: 1, fuelValue: 200 }),
  [ItemType.STONE_SHOVEL]: item('Stone Shovel', { stackSize: 1, durability: TOOL_DURABILITIES[1], damage: 1 + TOOL_DAMAGES[1], toolType: ToolType.SHOVEL, toolTier: 2 }),
  [ItemType.IRON_SHOVEL]: item('Iron Shovel', { stackSize: 1, durability: TOOL_DURABILITIES[2], damage: 1 + TOOL_DAMAGES[2], toolType: ToolType.SHOVEL, toolTier: 3 }),
  [ItemType.GOLD_SHOVEL]: item('Gold Shovel', { stackSize: 1, durability: TOOL_DURABILITIES[3], damage: 1 + TOOL_DAMAGES[3], toolType: ToolType.SHOVEL, toolTier: 4 }),
  [ItemType.DIAMOND_SHOVEL]: item('Diamond Shovel', { stackSize: 1, durability: TOOL_DURABILITIES[4], damage: 1 + TOOL_DAMAGES[4], toolType: ToolType.SHOVEL, toolTier: 5 }),
  // Swords
  [ItemType.WOODEN_SWORD]: item('Wooden Sword', { stackSize: 1, durability: TOOL_DURABILITIES[0], damage: 4 + TOOL_DAMAGES[0], toolType: ToolType.SWORD, toolTier: 1, fuelValue: 200 }),
  [ItemType.STONE_SWORD]: item('Stone Sword', { stackSize: 1, durability: TOOL_DURABILITIES[1], damage: 4 + TOOL_DAMAGES[1], toolType: ToolType.SWORD, toolTier: 2 }),
  [ItemType.IRON_SWORD]: item('Iron Sword', { stackSize: 1, durability: TOOL_DURABILITIES[2], damage: 4 + TOOL_DAMAGES[2], toolType: ToolType.SWORD, toolTier: 3 }),
  [ItemType.GOLD_SWORD]: item('Gold Sword', { stackSize: 1, durability: TOOL_DURABILITIES[3], damage: 4 + TOOL_DAMAGES[3], toolType: ToolType.SWORD, toolTier: 4 }),
  [ItemType.DIAMOND_SWORD]: item('Diamond Sword', { stackSize: 1, durability: TOOL_DURABILITIES[4], damage: 4 + TOOL_DAMAGES[4], toolType: ToolType.SWORD, toolTier: 5 }),
  // Hoes
  [ItemType.WOODEN_HOE]: item('Wooden Hoe', { stackSize: 1, durability: TOOL_DURABILITIES[0], toolType: ToolType.HOE, toolTier: 1, fuelValue: 200 }),
  [ItemType.STONE_HOE]: item('Stone Hoe', { stackSize: 1, durability: TOOL_DURABILITIES[1], toolType: ToolType.HOE, toolTier: 2 }),
  [ItemType.IRON_HOE]: item('Iron Hoe', { stackSize: 1, durability: TOOL_DURABILITIES[2], toolType: ToolType.HOE, toolTier: 3 }),
  [ItemType.GOLD_HOE]: item('Gold Hoe', { stackSize: 1, durability: TOOL_DURABILITIES[3], toolType: ToolType.HOE, toolTier: 4 }),
  [ItemType.DIAMOND_HOE]: item('Diamond Hoe', { stackSize: 1, durability: TOOL_DURABILITIES[4], toolType: ToolType.HOE, toolTier: 5 }),
  // Armor - Leather
  [ItemType.LEATHER_HELMET]: item('Leather Helmet', { stackSize: 1, durability: 56, armorValue: ARMOR_VALUES.helmet[0], armorSlot: ArmorSlot.HELMET }),
  [ItemType.LEATHER_CHESTPLATE]: item('Leather Chestplate', { stackSize: 1, durability: 81, armorValue: ARMOR_VALUES.chestplate[0], armorSlot: ArmorSlot.CHESTPLATE }),
  [ItemType.LEATHER_LEGGINGS]: item('Leather Leggings', { stackSize: 1, durability: 76, armorValue: ARMOR_VALUES.leggings[0], armorSlot: ArmorSlot.LEGGINGS }),
  [ItemType.LEATHER_BOOTS]: item('Leather Boots', { stackSize: 1, durability: 66, armorValue: ARMOR_VALUES.boots[0], armorSlot: ArmorSlot.BOOTS }),
  // Armor - Iron
  [ItemType.IRON_HELMET]: item('Iron Helmet', { stackSize: 1, durability: 166, armorValue: ARMOR_VALUES.helmet[1], armorSlot: ArmorSlot.HELMET }),
  [ItemType.IRON_CHESTPLATE]: item('Iron Chestplate', { stackSize: 1, durability: 241, armorValue: ARMOR_VALUES.chestplate[1], armorSlot: ArmorSlot.CHESTPLATE }),
  [ItemType.IRON_LEGGINGS]: item('Iron Leggings', { stackSize: 1, durability: 226, armorValue: ARMOR_VALUES.leggings[1], armorSlot: ArmorSlot.LEGGINGS }),
  [ItemType.IRON_BOOTS]: item('Iron Boots', { stackSize: 1, durability: 196, armorValue: ARMOR_VALUES.boots[1], armorSlot: ArmorSlot.BOOTS }),
  // Armor - Gold
  [ItemType.GOLD_HELMET]: item('Gold Helmet', { stackSize: 1, durability: 78, armorValue: ARMOR_VALUES.helmet[2], armorSlot: ArmorSlot.HELMET }),
  [ItemType.GOLD_CHESTPLATE]: item('Gold Chestplate', { stackSize: 1, durability: 113, armorValue: ARMOR_VALUES.chestplate[2], armorSlot: ArmorSlot.CHESTPLATE }),
  [ItemType.GOLD_LEGGINGS]: item('Gold Leggings', { stackSize: 1, durability: 106, armorValue: ARMOR_VALUES.leggings[2], armorSlot: ArmorSlot.LEGGINGS }),
  [ItemType.GOLD_BOOTS]: item('Gold Boots', { stackSize: 1, durability: 92, armorValue: ARMOR_VALUES.boots[2], armorSlot: ArmorSlot.BOOTS }),
  // Armor - Diamond
  [ItemType.DIAMOND_HELMET]: item('Diamond Helmet', { stackSize: 1, durability: 364, armorValue: ARMOR_VALUES.helmet[3], armorSlot: ArmorSlot.HELMET }),
  [ItemType.DIAMOND_CHESTPLATE]: item('Diamond Chestplate', { stackSize: 1, durability: 529, armorValue: ARMOR_VALUES.chestplate[3], armorSlot: ArmorSlot.CHESTPLATE }),
  [ItemType.DIAMOND_LEGGINGS]: item('Diamond Leggings', { stackSize: 1, durability: 496, armorValue: ARMOR_VALUES.leggings[3], armorSlot: ArmorSlot.LEGGINGS }),
  [ItemType.DIAMOND_BOOTS]: item('Diamond Boots', { stackSize: 1, durability: 430, armorValue: ARMOR_VALUES.boots[3], armorSlot: ArmorSlot.BOOTS }),
  // Ranged
  [ItemType.BOW]: item('Bow', { stackSize: 1, durability: 385, damage: 6 }),
  [ItemType.ARROW]: item('Arrow'),
  // Tools
  [ItemType.FLINT_AND_STEEL]: item('Flint and Steel', { stackSize: 1, durability: 65 }),
  [ItemType.SHEARS]: item('Shears', { stackSize: 1, durability: 238 }),
  [ItemType.BUCKET]: item('Bucket', { stackSize: 16 }),
  [ItemType.WATER_BUCKET]: item('Water Bucket', { stackSize: 1 }),
  [ItemType.LAVA_BUCKET]: item('Lava Bucket', { stackSize: 1, fuelValue: 20000 }),
  // Materials
  [ItemType.COAL]: item('Coal', { fuelValue: 1600 }),
  [ItemType.IRON_INGOT]: item('Iron Ingot'),
  [ItemType.GOLD_INGOT]: item('Gold Ingot'),
  [ItemType.DIAMOND]: item('Diamond'),
  [ItemType.EMERALD]: item('Emerald'),
  [ItemType.REDSTONE]: item('Redstone'),
  [ItemType.LAPIS_LAZULI]: item('Lapis Lazuli'),
  [ItemType.QUARTZ]: item('Quartz'),
  [ItemType.FLINT]: item('Flint'),
  [ItemType.STICK]: item('Stick', { fuelValue: 100 }),
  [ItemType.STRING]: item('String'),
  [ItemType.FEATHER]: item('Feather'),
  [ItemType.LEATHER]: item('Leather'),
  [ItemType.BONE]: item('Bone'),
  [ItemType.GUNPOWDER]: item('Gunpowder'),
  [ItemType.ENDER_PEARL]: item('Ender Pearl', { stackSize: 16 }),
  [ItemType.BLAZE_ROD]: item('Blaze Rod', { fuelValue: 2400 }),
  [ItemType.BLAZE_POWDER]: item('Blaze Powder'),
  [ItemType.GHAST_TEAR]: item('Ghast Tear'),
  [ItemType.NETHER_WART]: item('Nether Wart'),
  [ItemType.EYE_OF_ENDER]: item('Eye of Ender', { stackSize: 16 }),
  [ItemType.BOOK]: item('Book'),
  // Food
  [ItemType.RAW_BEEF]: item('Raw Beef', { foodValue: 3, saturation: 1.8 }),
  [ItemType.COOKED_BEEF]: item('Steak', { foodValue: 8, saturation: 12.8 }),
  [ItemType.RAW_PORKCHOP]: item('Raw Porkchop', { foodValue: 3, saturation: 1.8 }),
  [ItemType.COOKED_PORKCHOP]: item('Cooked Porkchop', { foodValue: 8, saturation: 12.8 }),
  [ItemType.RAW_CHICKEN]: item('Raw Chicken', { foodValue: 2, saturation: 1.2 }),
  [ItemType.COOKED_CHICKEN]: item('Cooked Chicken', { foodValue: 6, saturation: 7.2 }),
  [ItemType.BREAD]: item('Bread', { foodValue: 5, saturation: 6 }),
  [ItemType.APPLE]: item('Apple', { foodValue: 4, saturation: 2.4 }),
  [ItemType.GOLDEN_APPLE]: item('Golden Apple', { foodValue: 4, saturation: 9.6 }),
  [ItemType.MELON_SLICE]: item('Melon Slice', { foodValue: 2, saturation: 1.2 }),
  // Potions
  [ItemType.GLASS_BOTTLE]: item('Glass Bottle', { stackSize: 16 }),
  [ItemType.POTION_HEALING]: item('Potion of Healing', { stackSize: 1 }),
  [ItemType.POTION_STRENGTH]: item('Potion of Strength', { stackSize: 1 }),
  [ItemType.POTION_SPEED]: item('Potion of Speed', { stackSize: 1 }),
  [ItemType.POTION_FIRE_RESISTANCE]: item('Potion of Fire Resistance', { stackSize: 1 }),
  // Special
  [ItemType.DRAGON_BREATH]: item('Dragon Breath', { stackSize: 1 }),
  [ItemType.NETHER_STAR]: item('Nether Star', { stackSize: 1 }),
  [ItemType.OAK_SAPLING]: item('Oak Sapling', { blockType: BlockType.OAK_LEAVES, fuelValue: 100 }),
  [ItemType.BIRCH_SAPLING]: item('Birch Sapling', { blockType: BlockType.BIRCH_LEAVES, fuelValue: 100 }),
  [ItemType.WHEAT_SEEDS]: item('Wheat Seeds'),
  [ItemType.SUGAR_CANE_ITEM]: item('Sugar Cane'),
  [ItemType.BONE_MEAL]: item('Bone Meal'),
  // Iron/Gold ore items (for smelting)
  [ItemType.IRON_ORE]: item('Iron Ore'),
  [ItemType.GOLD_ORE]: item('Gold Ore'),
};

// ─── MOB REGISTRY ───
export const MOB_DATA: Record<MobType, MobData> = {
  [MobType.PIG]: { name: 'Pig', health: 10, damage: 0, speed: 1, hostile: false, width: 0.9, height: 0.9, drops: [{ item: ItemType.RAW_PORKCHOP, min: 1, max: 3, chance: 1 }], xpDrop: 3, spawnLight: -1, dimension: Dimension.OVERWORLD },
  [MobType.COW]: { name: 'Cow', health: 10, damage: 0, speed: 1, hostile: false, width: 0.9, height: 1.4, drops: [{ item: ItemType.RAW_BEEF, min: 1, max: 3, chance: 1 }, { item: ItemType.LEATHER, min: 0, max: 2, chance: 1 }], xpDrop: 3, spawnLight: -1, dimension: Dimension.OVERWORLD },
  [MobType.SHEEP]: { name: 'Sheep', health: 8, damage: 0, speed: 1, hostile: false, width: 0.9, height: 1.3, drops: [{ item: ItemType.STRING, min: 1, max: 2, chance: 1 }], xpDrop: 3, spawnLight: -1, dimension: Dimension.OVERWORLD },
  [MobType.CHICKEN]: { name: 'Chicken', health: 4, damage: 0, speed: 1.2, hostile: false, width: 0.4, height: 0.7, drops: [{ item: ItemType.RAW_CHICKEN, min: 1, max: 1, chance: 1 }, { item: ItemType.FEATHER, min: 0, max: 2, chance: 1 }], xpDrop: 3, spawnLight: -1, dimension: Dimension.OVERWORLD },
  [MobType.ZOMBIE]: { name: 'Zombie', health: 20, damage: 3, speed: 1.2, hostile: true, width: 0.6, height: 1.8, drops: [{ item: ItemType.BONE, min: 0, max: 2, chance: 0.5 }], xpDrop: 5, spawnLight: 7, dimension: Dimension.OVERWORLD },
  [MobType.SKELETON]: { name: 'Skeleton', health: 20, damage: 3, speed: 1.2, hostile: true, width: 0.6, height: 1.8, drops: [{ item: ItemType.BONE, min: 0, max: 2, chance: 1 }, { item: ItemType.ARROW, min: 0, max: 2, chance: 1 }], xpDrop: 5, spawnLight: 7, dimension: Dimension.OVERWORLD },
  [MobType.CREEPER]: { name: 'Creeper', health: 20, damage: 12, speed: 1.5, hostile: true, width: 0.6, height: 1.7, drops: [{ item: ItemType.GUNPOWDER, min: 0, max: 2, chance: 1 }], xpDrop: 5, spawnLight: 7, dimension: Dimension.OVERWORLD },
  [MobType.SPIDER]: { name: 'Spider', health: 16, damage: 2, speed: 1.8, hostile: true, width: 1.2, height: 0.8, drops: [{ item: ItemType.STRING, min: 0, max: 2, chance: 1 }], xpDrop: 5, spawnLight: 7, dimension: Dimension.OVERWORLD },
  [MobType.ENDERMAN]: { name: 'Enderman', health: 40, damage: 7, speed: 2, hostile: false, width: 0.6, height: 2.9, drops: [{ item: ItemType.ENDER_PEARL, min: 0, max: 1, chance: 0.5 }], xpDrop: 5, spawnLight: 7, dimension: Dimension.OVERWORLD },
  [MobType.GHAST]: { name: 'Ghast', health: 10, damage: 6, speed: 0.8, hostile: true, width: 4, height: 4, drops: [{ item: ItemType.GHAST_TEAR, min: 0, max: 1, chance: 0.5 }, { item: ItemType.GUNPOWDER, min: 0, max: 2, chance: 1 }], xpDrop: 5, spawnLight: -1, dimension: Dimension.NETHER },
  [MobType.BLAZE]: { name: 'Blaze', health: 20, damage: 5, speed: 1.5, hostile: true, width: 0.6, height: 1.8, drops: [{ item: ItemType.BLAZE_ROD, min: 0, max: 1, chance: 0.5 }], xpDrop: 10, spawnLight: -1, dimension: Dimension.NETHER },
  [MobType.ZOMBIE_PIGLIN]: { name: 'Zombie Piglin', health: 20, damage: 5, speed: 1.2, hostile: false, width: 0.6, height: 1.8, drops: [{ item: ItemType.GOLD_INGOT, min: 0, max: 1, chance: 0.25 }], xpDrop: 5, spawnLight: -1, dimension: Dimension.NETHER },
  [MobType.ENDER_DRAGON]: { name: 'Ender Dragon', health: 200, damage: 10, speed: 3, hostile: true, width: 6, height: 4, drops: [], xpDrop: 12000, spawnLight: -1, dimension: Dimension.END },
};

// Crafting & Smelting recipes
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Planks from logs
  { width: 1, height: 1, pattern: [ItemType.BLOCK_OAK_LOG], result: ItemType.BLOCK_OAK_PLANKS, resultCount: 4 },
  { width: 1, height: 1, pattern: [ItemType.BLOCK_BIRCH_LOG], result: ItemType.BLOCK_BIRCH_PLANKS, resultCount: 4 },
  // Sticks
  { width: 1, height: 2, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS], result: ItemType.STICK, resultCount: 4 },
  // Crafting table
  { width: 2, height: 2, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS], result: ItemType.BLOCK_CRAFTING_TABLE, resultCount: 1 },
  // Furnace
  { width: 3, height: 3, pattern: [ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, null, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE], result: ItemType.BLOCK_FURNACE, resultCount: 1 },
  // Chest
  { width: 3, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, null, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS], result: ItemType.BLOCK_CHEST, resultCount: 1 },
  // Torch
  { width: 1, height: 2, pattern: [ItemType.COAL, ItemType.STICK], result: ItemType.BLOCK_TORCH, resultCount: 4 },
  // Wooden tools
  { width: 3, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, null, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.WOODEN_PICKAXE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, null, ItemType.BLOCK_OAK_PLANKS, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.WOODEN_AXE, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.STICK, ItemType.STICK], result: ItemType.WOODEN_SHOVEL, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.STICK], result: ItemType.WOODEN_SWORD, resultCount: 1 },
  // Stone tools
  { width: 3, height: 3, pattern: [ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, null, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.STONE_PICKAXE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, null, ItemType.BLOCK_COBBLESTONE, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.STONE_AXE, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.BLOCK_COBBLESTONE, ItemType.STICK, ItemType.STICK], result: ItemType.STONE_SHOVEL, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.STICK], result: ItemType.STONE_SWORD, resultCount: 1 },
  // Iron tools
  { width: 3, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.IRON_PICKAXE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.IRON_AXE, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.STICK, ItemType.STICK], result: ItemType.IRON_SHOVEL, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.STICK], result: ItemType.IRON_SWORD, resultCount: 1 },
  // Diamond tools
  { width: 3, height: 3, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.DIAMOND_PICKAXE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.DIAMOND, ItemType.STICK, null, null, ItemType.STICK, null], result: ItemType.DIAMOND_AXE, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.DIAMOND, ItemType.STICK, ItemType.STICK], result: ItemType.DIAMOND_SHOVEL, resultCount: 1 },
  { width: 1, height: 3, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.STICK], result: ItemType.DIAMOND_SWORD, resultCount: 1 },
  // Iron armor
  { width: 3, height: 2, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT], result: ItemType.IRON_HELMET, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT], result: ItemType.IRON_CHESTPLATE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT], result: ItemType.IRON_LEGGINGS, resultCount: 1 },
  { width: 3, height: 2, pattern: [ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT], result: ItemType.IRON_BOOTS, resultCount: 1 },
  // Diamond armor
  { width: 3, height: 2, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.DIAMOND], result: ItemType.DIAMOND_HELMET, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.DIAMOND, null, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND], result: ItemType.DIAMOND_CHESTPLATE, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.DIAMOND], result: ItemType.DIAMOND_LEGGINGS, resultCount: 1 },
  { width: 3, height: 2, pattern: [ItemType.DIAMOND, null, ItemType.DIAMOND, ItemType.DIAMOND, null, ItemType.DIAMOND], result: ItemType.DIAMOND_BOOTS, resultCount: 1 },
  // Bow
  { width: 3, height: 3, pattern: [null, ItemType.STICK, ItemType.STRING, ItemType.STICK, null, ItemType.STRING, null, ItemType.STICK, ItemType.STRING], result: ItemType.BOW, resultCount: 1 },
  // Arrow
  { width: 1, height: 3, pattern: [ItemType.FLINT, ItemType.STICK, ItemType.FEATHER], result: ItemType.ARROW, resultCount: 4 },
  // Bucket
  { width: 3, height: 2, pattern: [ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, null, ItemType.IRON_INGOT, null], result: ItemType.BUCKET, resultCount: 1 },
  // Flint and steel
  { width: 2, height: 1, pattern: [ItemType.IRON_INGOT, ItemType.FLINT], result: ItemType.FLINT_AND_STEEL, resultCount: 1 },
  // Blocks from ingots
  { width: 3, height: 3, pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT], result: ItemType.BLOCK_IRON_BLOCK, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT], result: ItemType.BLOCK_GOLD_BLOCK, resultCount: 1 },
  { width: 3, height: 3, pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND], result: ItemType.BLOCK_DIAMOND_BLOCK, resultCount: 1 },
  // Eye of Ender
  { width: 2, height: 1, pattern: [ItemType.ENDER_PEARL, ItemType.BLAZE_POWDER], result: ItemType.EYE_OF_ENDER, resultCount: 1 },
  // Blaze powder from rod
  { width: 1, height: 1, pattern: [ItemType.BLAZE_ROD], result: ItemType.BLAZE_POWDER, resultCount: 2 },
  // Bone meal from bone
  { width: 1, height: 1, pattern: [ItemType.BONE], result: ItemType.BONE_MEAL, resultCount: 3 },
  // Bread
  { width: 3, height: 1, pattern: [ItemType.WHEAT_SEEDS, ItemType.WHEAT_SEEDS, ItemType.WHEAT_SEEDS], result: ItemType.BREAD, resultCount: 1 },
  // Enchanting table
  { width: 3, height: 3, pattern: [null, ItemType.BOOK, null, ItemType.DIAMOND, ItemType.BLOCK_OBSIDIAN, ItemType.DIAMOND, ItemType.BLOCK_OBSIDIAN, ItemType.BLOCK_OBSIDIAN, ItemType.BLOCK_OBSIDIAN], result: ItemType.BLOCK_ENCHANTING_TABLE, resultCount: 1 },
  // Bookshelf
  { width: 3, height: 3, pattern: [ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BOOK, ItemType.BOOK, ItemType.BOOK, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS, ItemType.BLOCK_OAK_PLANKS], result: ItemType.BLOCK_BOOKSHELF, resultCount: 1 },
  // Book
  { width: 2, height: 2, pattern: [ItemType.LEATHER, null, ItemType.STICK, ItemType.STICK], result: ItemType.BOOK, resultCount: 1 },
  // Glass bottle
  { width: 3, height: 2, pattern: [ItemType.BLOCK_GLASS, null, ItemType.BLOCK_GLASS, null, ItemType.BLOCK_GLASS, null], result: ItemType.GLASS_BOTTLE, resultCount: 3 },
  // Brewing stand
  { width: 3, height: 2, pattern: [null, ItemType.BLAZE_ROD, null, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE, ItemType.BLOCK_COBBLESTONE], result: ItemType.BLOCK_BREWING_STAND, resultCount: 1 },
  // Golden apple
  { width: 3, height: 3, pattern: [ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.APPLE, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT], result: ItemType.GOLDEN_APPLE, resultCount: 1 },
  // Ladder
  { width: 3, height: 3, pattern: [ItemType.STICK, null, ItemType.STICK, ItemType.STICK, ItemType.STICK, ItemType.STICK, ItemType.STICK, null, ItemType.STICK], result: ItemType.BLOCK_LADDER, resultCount: 3 },
  // Stone bricks
  { width: 2, height: 2, pattern: [ItemType.BLOCK_STONE, ItemType.BLOCK_STONE, ItemType.BLOCK_STONE, ItemType.BLOCK_STONE], result: ItemType.BLOCK_STONE_BRICKS, resultCount: 4 },
  // Glass from sand (pane)
  { width: 3, height: 2, pattern: [ItemType.BLOCK_GLASS, ItemType.BLOCK_GLASS, ItemType.BLOCK_GLASS, ItemType.BLOCK_GLASS, ItemType.BLOCK_GLASS, ItemType.BLOCK_GLASS], result: ItemType.BLOCK_IRON_BARS, resultCount: 16 },
  // Sandstone
  { width: 2, height: 2, pattern: [ItemType.BLOCK_SAND, ItemType.BLOCK_SAND, ItemType.BLOCK_SAND, ItemType.BLOCK_SAND], result: ItemType.BLOCK_SANDSTONE, resultCount: 1 },
];

export const SMELTING_RECIPES: SmeltingRecipe[] = [
  { input: ItemType.IRON_ORE, output: ItemType.IRON_INGOT, xp: 0.7, cookTime: 200 },
  { input: ItemType.GOLD_ORE, output: ItemType.GOLD_INGOT, xp: 1, cookTime: 200 },
  { input: ItemType.BLOCK_SAND, output: ItemType.BLOCK_GLASS, xp: 0.1, cookTime: 200 },
  { input: ItemType.BLOCK_COBBLESTONE, output: ItemType.BLOCK_STONE, xp: 0.1, cookTime: 200 },
  { input: ItemType.RAW_BEEF, output: ItemType.COOKED_BEEF, xp: 0.35, cookTime: 200 },
  { input: ItemType.RAW_PORKCHOP, output: ItemType.COOKED_PORKCHOP, xp: 0.35, cookTime: 200 },
  { input: ItemType.RAW_CHICKEN, output: ItemType.COOKED_CHICKEN, xp: 0.35, cookTime: 200 },
  { input: ItemType.BLOCK_OAK_LOG, output: ItemType.COAL, xp: 0.15, cookTime: 200 },
  { input: ItemType.BLOCK_CLAY, output: ItemType.BLOCK_STONE_BRICKS, xp: 0.3, cookTime: 200 },
];

// Block → Item mapping for drops
export function getBlockItem(blockType: BlockType): ItemType | null {
  const data = BLOCK_DATA[blockType];
  return data.drops;
}

// Item → Block mapping for placement
export function getItemBlock(itemType: ItemType): BlockType | null {
  const data = ITEM_DATA[itemType];
  return data?.blockType ?? null;
}

export function getToolSpeedMultiplier(toolTier: number, toolType: ToolType, blockTool: ToolType): number {
  if (toolType === blockTool) {
    return 1 + toolTier * 1.5;
  }
  return 1;
}

export function canHarvest(toolTier: number, toolType: ToolType, block: BlockData): boolean {
  if (block.hardness < 0) return false;
  if (block.minTier === 0) return true;
  if (block.tool !== ToolType.NONE && toolType !== block.tool) return false;
  return toolTier >= block.minTier;
}
