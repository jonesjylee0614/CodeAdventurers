export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Tile {
  x: number;
  y: number;
  walkable: boolean;
  collectible?: string;
}

export interface LevelGoal {
  collectibles?: number;
  reach?: { x: number; y: number };
  stepLimit?: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[];
  start: { x: number; y: number; facing: Direction };
  goal: LevelGoal;
  bestSteps: number;
  hints: string[];
}

export type Condition =
  | { type: 'tile-ahead-walkable' }
  | { type: 'collectibles-remaining' };

export type Instruction =
  | { type: 'move' }
  | { type: 'turn'; direction: 'left' | 'right' }
  | { type: 'collect' }
  | { type: 'repeat'; times: number; body: Instruction[] }
  | { type: 'conditional'; condition: Condition; truthy: Instruction[]; falsy?: Instruction[] };

export interface SimulationOptions {
  stepLimit?: number;
  captureLog?: boolean;
}

export type ErrorCode = 'E_COLLIDE' | 'E_GOAL_NOT_MET' | 'E_STEP_LIMIT' | 'E_LOOP_DEPTH';

export interface SimulationStep {
  index: number;
  instruction: Instruction;
  position: { x: number; y: number; facing: Direction };
  collectibles: number;
}

export interface SimulationResult {
  success: boolean;
  steps: number;
  stars: number;
  errorCode?: ErrorCode;
  remainingCollectibles?: number;
  log: SimulationStep[];
  metadata: {
    bestSteps: number;
    goal: LevelGoal;
  };
}
