import { BlockType, CHUNK_WIDTH, CHUNK_HEIGHT, MAX_LIGHT, BLOCK_DATA } from '../constants';

export class Chunk {
  readonly cx: number;
  blocks: Uint16Array;
  lightMap: Uint8Array;
  dirty: boolean;
  generated: boolean;

  constructor(cx: number) {
    this.cx = cx;
    this.blocks = new Uint16Array(CHUNK_WIDTH * CHUNK_HEIGHT);
    this.lightMap = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT);
    this.dirty = true;
    this.generated = false;
  }

  isInBounds(lx: number, y: number): boolean {
    return lx >= 0 && lx < CHUNK_WIDTH && y >= 0 && y < CHUNK_HEIGHT;
  }

  getBlock(lx: number, y: number): BlockType {
    if (!this.isInBounds(lx, y)) {
      return BlockType.AIR;
    }
    return this.blocks[lx + y * CHUNK_WIDTH] as BlockType;
  }

  setBlock(lx: number, y: number, block: BlockType): void {
    if (!this.isInBounds(lx, y)) {
      return;
    }
    this.blocks[lx + y * CHUNK_WIDTH] = block;
    this.dirty = true;
  }

  getLight(lx: number, y: number): number {
    if (!this.isInBounds(lx, y)) {
      return 0;
    }
    return this.lightMap[lx + y * CHUNK_WIDTH];
  }

  setLight(lx: number, y: number, level: number): void {
    if (!this.isInBounds(lx, y)) {
      return;
    }
    const clamped = Math.max(0, Math.min(MAX_LIGHT, level));
    this.lightMap[lx + y * CHUNK_WIDTH] = clamped;
  }
}
