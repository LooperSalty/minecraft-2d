import {
  ItemStack,
  ItemType,
  ITEM_DATA,
  CRAFTING_RECIPES,
  SMELTING_RECIPES,
  CraftingRecipe,
  SmeltingRecipe,
  INVENTORY_SIZE,
  HOTBAR_SIZE,
} from '../constants';

// Crafting grid management
export class CraftingSystem {
  // Check if a crafting grid matches any recipe
  static findRecipe(
    grid: (ItemStack | null)[],
    gridWidth: number,
    gridHeight: number
  ): { recipe: CraftingRecipe; result: ItemStack } | null {
    for (const recipe of CRAFTING_RECIPES) {
      const recipeW = recipe.width;
      const recipeH = recipe.height;

      // Try all possible offset positions where the recipe could fit
      for (let oy = 0; oy <= gridHeight - recipeH; oy++) {
        for (let ox = 0; ox <= gridWidth - recipeW; ox++) {
          if (CraftingSystem.matchRecipeAt(grid, gridWidth, gridHeight, recipe, ox, oy)) {
            const result: ItemStack = {
              type: recipe.result,
              count: recipe.resultCount,
              durability: 0,
            };
            return { recipe, result };
          }
        }
      }
    }
    return null;
  }

  // Try matching a recipe at a specific position in the grid
  static matchRecipeAt(
    grid: (ItemStack | null)[],
    gridWidth: number,
    gridHeight: number,
    recipe: CraftingRecipe,
    offsetX: number,
    offsetY: number
  ): boolean {
    const recipeW = recipe.width;
    const recipeH = recipe.height;

    // Check that every cell in the grid either:
    // - Falls within the recipe area and matches the pattern
    // - Falls outside the recipe area and is empty
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const gridIndex = gx + gy * gridWidth;
        const cell = grid[gridIndex];

        const inRecipeX = gx >= offsetX && gx < offsetX + recipeW;
        const inRecipeY = gy >= offsetY && gy < offsetY + recipeH;

        if (inRecipeX && inRecipeY) {
          // This cell is inside the recipe area
          const rx = gx - offsetX;
          const ry = gy - offsetY;
          const patternIndex = rx + ry * recipeW;
          const expected = recipe.pattern[patternIndex];

          if (expected === null) {
            // Pattern expects empty here
            if (cell !== null && cell.count > 0) {
              return false;
            }
          } else {
            // Pattern expects a specific item type
            if (cell === null || cell.type !== expected || cell.count <= 0) {
              return false;
            }
          }
        } else {
          // This cell is outside the recipe area - must be empty
          if (cell !== null && cell.count > 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Consume ingredients from the grid (reduce counts by 1 for each slot used)
  // Returns NEW grid array (immutable pattern)
  static consumeIngredients(
    grid: (ItemStack | null)[],
    recipe: CraftingRecipe,
    gridWidth: number,
    offsetX: number,
    offsetY: number
  ): (ItemStack | null)[] {
    const newGrid: (ItemStack | null)[] = grid.map((cell) =>
      cell !== null ? { type: cell.type, count: cell.count, durability: cell.durability } : null
    );

    const recipeW = recipe.width;
    const recipeH = recipe.height;

    for (let ry = 0; ry < recipeH; ry++) {
      for (let rx = 0; rx < recipeW; rx++) {
        const patternIndex = rx + ry * recipeW;
        const expected = recipe.pattern[patternIndex];

        if (expected !== null) {
          const gx = offsetX + rx;
          const gy = offsetY + ry;
          const gridIndex = gx + gy * gridWidth;
          const cell = newGrid[gridIndex];

          if (cell !== null) {
            const newCount = cell.count - 1;
            newGrid[gridIndex] = newCount <= 0 ? null : { type: cell.type, count: newCount, durability: cell.durability };
          }
        }
      }
    }

    return newGrid;
  }
}

// Furnace processing logic
export class FurnaceSystem {
  static update(
    input: ItemStack | null,
    fuel: ItemStack | null,
    output: ItemStack | null,
    burnTime: number,
    burnTimeMax: number,
    cookProgress: number,
    cookTimeTotal: number,
    dt: number
  ): {
    input: ItemStack | null;
    fuel: ItemStack | null;
    output: ItemStack | null;
    burnTime: number;
    burnTimeMax: number;
    cookProgress: number;
    cookTimeTotal: number;
  } {
    // Create copies to avoid mutation
    let newInput: ItemStack | null =
      input !== null ? { type: input.type, count: input.count, durability: input.durability } : null;
    let newFuel: ItemStack | null =
      fuel !== null ? { type: fuel.type, count: fuel.count, durability: fuel.durability } : null;
    let newOutput: ItemStack | null =
      output !== null ? { type: output.type, count: output.count, durability: output.durability } : null;
    let newBurnTime = burnTime;
    let newBurnTimeMax = burnTimeMax;
    let newCookProgress = cookProgress;
    let newCookTimeTotal = cookTimeTotal;

    // Find if current input has a valid smelting recipe
    const recipe =
      newInput !== null ? FurnaceSystem.findSmeltingRecipe(newInput.type) : null;

    // Check if output slot can accept the recipe result
    const canOutputAccept =
      recipe !== null &&
      (newOutput === null ||
        (newOutput.type === recipe.output && newOutput.count < 64));

    // Step 1: If burnTime > 0, decrease it
    if (newBurnTime > 0) {
      newBurnTime = Math.max(0, newBurnTime - dt);
    }

    // Step 2: If not burning, try to consume fuel if we have a valid recipe and input
    if (newBurnTime <= 0 && recipe !== null && canOutputAccept && newFuel !== null) {
      const fuelValue = FurnaceSystem.getFuelValue(newFuel.type);
      if (fuelValue > 0) {
        newBurnTime = fuelValue;
        newBurnTimeMax = fuelValue;
        const newFuelCount = newFuel.count - 1;
        newFuel = newFuelCount <= 0 ? null : { type: newFuel.type, count: newFuelCount, durability: newFuel.durability };
      }
    }

    // Step 3: If burning and have valid input with matching recipe
    if (newBurnTime > 0 && recipe !== null && canOutputAccept) {
      newCookTimeTotal = recipe.cookTime ?? 200;
      newCookProgress += dt;

      // Check if cooking is complete
      if (newCookProgress >= newCookTimeTotal) {
        // Produce output
        if (newOutput === null) {
          newOutput = { type: recipe.output, count: 1, durability: 0 };
        } else {
          newOutput = {
            type: newOutput.type,
            count: newOutput.count + 1,
            durability: newOutput.durability,
          };
        }

        // Consume 1 input
        if (newInput !== null) {
          const newInputCount = newInput.count - 1;
          newInput =
            newInputCount <= 0
              ? null
              : { type: newInput.type, count: newInputCount, durability: newInput.durability };
        }

        // Reset cook progress
        newCookProgress = 0;
      }
    } else {
      // Step 4: Not burning or no valid input => reset cook progress
      newCookProgress = 0;
    }

    return {
      input: newInput,
      fuel: newFuel,
      output: newOutput,
      burnTime: newBurnTime,
      burnTimeMax: newBurnTimeMax,
      cookProgress: newCookProgress,
      cookTimeTotal: newCookTimeTotal,
    };
  }

  static findSmeltingRecipe(input: ItemType): SmeltingRecipe | null {
    for (const recipe of SMELTING_RECIPES) {
      if (recipe.input === input) {
        return recipe;
      }
    }
    return null;
  }

  static getFuelValue(item: ItemType): number {
    const data = ITEM_DATA[item];
    if (data !== undefined && data.fuelValue !== undefined) {
      return data.fuelValue;
    }
    return 0;
  }
}

// Inventory helper operations (all pure functions, return new arrays)
export class InventoryOps {
  // Try to add an item stack to inventory, returns { inventory, remaining }
  static addItem(
    inventory: (ItemStack | null)[],
    item: ItemStack
  ): {
    inventory: (ItemStack | null)[];
    remaining: number;
  } {
    const newInventory: (ItemStack | null)[] = inventory.map((slot) =>
      slot !== null ? { type: slot.type, count: slot.count, durability: slot.durability } : null
    );

    const maxStack = ITEM_DATA[item.type]?.stackSize ?? 64;
    let remaining = item.count;

    // First pass: try to stack with existing items of the same type
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      const slot = newInventory[i];
      if (slot !== null && slot.type === item.type && slot.count < maxStack) {
        const canAdd = Math.min(remaining, maxStack - slot.count);
        newInventory[i] = { type: slot.type, count: slot.count + canAdd, durability: slot.durability };
        remaining -= canAdd;
      }
    }

    // Second pass: find empty slots
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      if (newInventory[i] === null) {
        const canPlace = Math.min(remaining, maxStack);
        newInventory[i] = { type: item.type, count: canPlace, durability: item.durability };
        remaining -= canPlace;
      }
    }

    return { inventory: newInventory, remaining };
  }

  // Remove count items from a specific slot
  static removeFromSlot(
    inventory: (ItemStack | null)[],
    slot: number,
    count: number
  ): (ItemStack | null)[] {
    const newInventory: (ItemStack | null)[] = inventory.map((s) =>
      s !== null ? { type: s.type, count: s.count, durability: s.durability } : null
    );

    const current = newInventory[slot];
    if (current === null) {
      return newInventory;
    }

    const newCount = current.count - count;
    newInventory[slot] = newCount <= 0 ? null : { type: current.type, count: newCount, durability: current.durability };

    return newInventory;
  }

  // Swap two slots (for drag and drop)
  static swapSlots(
    inventory: (ItemStack | null)[],
    slotA: number,
    slotB: number
  ): (ItemStack | null)[] {
    const newInventory: (ItemStack | null)[] = inventory.map((s) =>
      s !== null ? { type: s.type, count: s.count, durability: s.durability } : null
    );

    const temp = newInventory[slotA];
    newInventory[slotA] = newInventory[slotB];
    newInventory[slotB] = temp;

    return newInventory;
  }

  // Split a stack: take half from slot into cursor
  static splitStack(
    inventory: (ItemStack | null)[],
    slot: number
  ): {
    inventory: (ItemStack | null)[];
    cursor: ItemStack | null;
  } {
    const newInventory: (ItemStack | null)[] = inventory.map((s) =>
      s !== null ? { type: s.type, count: s.count, durability: s.durability } : null
    );

    const current = newInventory[slot];
    if (current === null || current.count <= 0) {
      return { inventory: newInventory, cursor: null };
    }

    const takeCount = Math.ceil(current.count / 2);
    const leaveCount = current.count - takeCount;

    newInventory[slot] =
      leaveCount <= 0 ? null : { type: current.type, count: leaveCount, durability: current.durability };

    const cursor: ItemStack = { type: current.type, count: takeCount, durability: current.durability };

    return { inventory: newInventory, cursor };
  }

  // Place one item from cursor into slot
  static placeOne(
    inventory: (ItemStack | null)[],
    slot: number,
    cursor: ItemStack
  ): {
    inventory: (ItemStack | null)[];
    cursor: ItemStack | null;
  } {
    const newInventory: (ItemStack | null)[] = inventory.map((s) =>
      s !== null ? { type: s.type, count: s.count, durability: s.durability } : null
    );

    const maxStack = ITEM_DATA[cursor.type]?.stackSize ?? 64;
    const current = newInventory[slot];

    if (current === null) {
      // Place one into empty slot
      newInventory[slot] = { type: cursor.type, count: 1, durability: cursor.durability };
      const newCursorCount = cursor.count - 1;
      const newCursor: ItemStack | null =
        newCursorCount <= 0 ? null : { type: cursor.type, count: newCursorCount, durability: cursor.durability };
      return { inventory: newInventory, cursor: newCursor };
    }

    if (current.type === cursor.type && current.count < maxStack) {
      // Stack one more onto existing matching slot
      newInventory[slot] = { type: current.type, count: current.count + 1, durability: current.durability };
      const newCursorCount = cursor.count - 1;
      const newCursor: ItemStack | null =
        newCursorCount <= 0 ? null : { type: cursor.type, count: newCursorCount, durability: cursor.durability };
      return { inventory: newInventory, cursor: newCursor };
    }

    // Can't place - slot occupied by different type or stack is full
    return { inventory: newInventory, cursor: { type: cursor.type, count: cursor.count, durability: cursor.durability } };
  }

  // Check if inventory has at least count of itemType
  static hasItem(
    inventory: (ItemStack | null)[],
    itemType: ItemType,
    count: number
  ): boolean {
    return InventoryOps.countItem(inventory, itemType) >= count;
  }

  // Remove count items of itemType from anywhere in inventory
  static removeItem(
    inventory: (ItemStack | null)[],
    itemType: ItemType,
    count: number
  ): (ItemStack | null)[] {
    const newInventory: (ItemStack | null)[] = inventory.map((s) =>
      s !== null ? { type: s.type, count: s.count, durability: s.durability } : null
    );

    let toRemove = count;

    for (let i = 0; i < newInventory.length && toRemove > 0; i++) {
      const slot = newInventory[i];
      if (slot !== null && slot.type === itemType) {
        const removeFromSlot = Math.min(toRemove, slot.count);
        const newCount = slot.count - removeFromSlot;
        newInventory[i] = newCount <= 0 ? null : { type: slot.type, count: newCount, durability: slot.durability };
        toRemove -= removeFromSlot;
      }
    }

    return newInventory;
  }

  // Count total of an item type in inventory
  static countItem(
    inventory: (ItemStack | null)[],
    itemType: ItemType
  ): number {
    let total = 0;
    for (const slot of inventory) {
      if (slot !== null && slot.type === itemType) {
        total += slot.count;
      }
    }
    return total;
  }
}
