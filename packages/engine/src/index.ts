import {
  Condition,
  Direction,
  ErrorCode,
  Instruction,
  LevelDefinition,
  SimulationOptions,
  SimulationResult,
  SimulationStep
} from './types';

const directionOrder: Direction[] = ['north', 'east', 'south', 'west'];

function rotate(direction: Direction, turn: 'left' | 'right'): Direction {
  const index = directionOrder.indexOf(direction);
  const offset = turn === 'left' ? -1 : 1;
  return directionOrder[(index + offset + directionOrder.length) % directionOrder.length];
}

function moveForward(
  x: number,
  y: number,
  facing: Direction
): { x: number; y: number } {
  switch (facing) {
    case 'north':
      return { x, y: y - 1 };
    case 'south':
      return { x, y: y + 1 };
    case 'west':
      return { x: x - 1, y };
    case 'east':
    default:
      return { x: x + 1, y };
  }
}

function isWalkable(level: LevelDefinition, x: number, y: number): boolean {
  return (
    x >= 0 &&
    x < level.width &&
    y >= 0 &&
    y < level.height &&
    level.tiles.some((tile) => tile.x === x && tile.y === y && tile.walkable)
  );
}

function tileCollectible(level: LevelDefinition, x: number, y: number): string | undefined {
  return level.tiles.find((tile) => tile.x === x && tile.y === y)?.collectible;
}

function evaluateCondition(
  condition: Condition,
  context: {
    level: LevelDefinition;
    position: { x: number; y: number; facing: Direction };
    remainingCollectibles: number;
  }
): boolean {
  switch (condition.type) {
    case 'tile-ahead-walkable': {
      const next = moveForward(context.position.x, context.position.y, context.position.facing);
      return isWalkable(context.level, next.x, next.y);
    }
    case 'collectibles-remaining':
      return context.remainingCollectibles > 0;
    default:
      return false;
  }
}

export class LevelSimulator {
  constructor(private readonly level: LevelDefinition) {}

  run(program: Instruction[], options: SimulationOptions = {}): SimulationResult {
    const stepLimit = options.stepLimit ?? this.level.goal.stepLimit ?? 200;
    const log: SimulationStep[] = [];
    const visited = new Set<string>();

    let steps = 0;
    let x = this.level.start.x;
    let y = this.level.start.y;
    let facing = this.level.start.facing;
    let collectibles = this.level.tiles.filter((tile) => tile.collectible).length;

    const execute = (instructions: Instruction[], depth: number): ErrorCode | undefined => {
      if (depth > 10) {
        return 'E_LOOP_DEPTH';
      }

      for (const instruction of instructions) {
        if (steps >= stepLimit) {
          return 'E_STEP_LIMIT';
        }
        steps += 1;

        if (options.captureLog) {
          log.push({
            index: steps,
            instruction,
            position: { x, y, facing },
            collectibles
          });
        }

        switch (instruction.type) {
          case 'move': {
            const next = moveForward(x, y, facing);
            if (!isWalkable(this.level, next.x, next.y)) {
              return 'E_COLLIDE';
            }
            x = next.x;
            y = next.y;
            break;
          }
          case 'turn':
            facing = rotate(facing, instruction.direction);
            break;
          case 'collect': {
            const collectible = tileCollectible(this.level, x, y);
            if (collectible) {
              const key = `${x}:${y}:${collectible}`;
              if (!visited.has(key)) {
                visited.add(key);
                collectibles -= 1;
              }
            }
            break;
          }
          case 'repeat': {
            for (let i = 0; i < instruction.times; i += 1) {
              const error = execute(instruction.body, depth + 1);
              if (error) {
                return error;
              }
            }
            break;
          }
          case 'conditional': {
            const conditionResult = evaluateCondition(instruction.condition, {
              level: this.level,
              position: { x, y, facing },
              remainingCollectibles: collectibles
            });
            const branch = conditionResult ? instruction.truthy : instruction.falsy ?? [];
            const error = execute(branch, depth + 1);
            if (error) {
              return error;
            }
            break;
          }
          default:
            throw new Error(`Unsupported instruction ${(instruction as Instruction).type}`);
        }
      }
      return undefined;
    };

    const error = execute(program, 0);
    const success = !error && this.meetsGoals({ x, y }, collectibles, steps);
    const stars = this.calculateStars({ success, steps, collectibles });

    return {
      success,
      steps,
      stars,
      errorCode: success ? undefined : error ?? 'E_GOAL_NOT_MET',
      remainingCollectibles: collectibles,
      log,
      metadata: {
        bestSteps: this.level.bestSteps,
        goal: this.level.goal
      }
    };
  }

  private meetsGoals(position: { x: number; y: number }, collectibles: number, steps: number): boolean {
    if (this.level.goal.collectibles !== undefined && collectibles > 0) {
      return false;
    }
    if (this.level.goal.reach) {
      if (position.x !== this.level.goal.reach.x || position.y !== this.level.goal.reach.y) {
        return false;
      }
    }
    if (this.level.goal.stepLimit !== undefined && steps > this.level.goal.stepLimit) {
      return false;
    }
    return true;
  }

  private calculateStars({ success, steps, collectibles }: { success: boolean; steps: number; collectibles: number }): number {
    if (!success) {
      return 0;
    }
    if (collectibles > 0) {
      return 1;
    }
    if (steps <= this.level.bestSteps) {
      return 3;
    }
    if (steps <= this.level.bestSteps + 2) {
      return 2;
    }
    return 1;
  }
}

export interface HintPayload {
  attempts: number;
  lastError?: ErrorCode;
}

export function computeHint(level: LevelDefinition, payload: HintPayload): string {
  if (payload.attempts <= 0) {
    return level.hints[0] ?? '尝试运行你的方案。';
  }
  if (payload.lastError === 'E_COLLIDE') {
    return '哎呀，前面有障碍！换个方向试试？';
  }
  if (payload.lastError === 'E_STEP_LIMIT') {
    return '步骤太多了，试试用“重复”积木吧！';
  }
  if (payload.attempts >= 3 && level.hints[2]) {
    return level.hints[2];
  }
  return level.hints[Math.min(payload.attempts, level.hints.length - 1)] ?? '检查一下积木的顺序。';
}

export * from './types';
