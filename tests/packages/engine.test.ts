import * as Engine from '../packages/engine/src/index.ts';
type LevelDefinition = Engine.LevelDefinition;
const LevelSimulator = Engine.LevelSimulator;
const computeHint = Engine.computeHint;
type Instruction = Engine.Instruction;

const level: LevelDefinition = {
  id: 'sample-1',
  name: '首关演示',
  width: 3,
  height: 3,
  tiles: [
    { x: 0, y: 0, walkable: true },
    { x: 1, y: 0, walkable: true },
    { x: 2, y: 0, walkable: true },
    { x: 2, y: 1, walkable: true, collectible: 'gem' },
    { x: 2, y: 2, walkable: true }
  ],
  start: { x: 0, y: 0, facing: 'east' },
  goal: { reach: { x: 2, y: 1 }, collectibles: 0, stepLimit: 10 },
  bestSteps: 5,
  hints: ['先走到宝石旁边', '记得拾取宝石', '可以尝试使用循环']
};

describe('LevelSimulator', () => {
  it('completes level when instructions are correct', () => {
    const program: Instruction[] = [
      { type: 'move' },
      { type: 'move' },
      { type: 'turn', direction: 'right' },
      { type: 'move' },
      { type: 'collect' }
    ];

    const simulator = new LevelSimulator(level);
    const result = simulator.run(program, { captureLog: true });

    expect(result.success).toBe(true);
    expect(result.steps).toBe(program.length);
    expect(result.stars).toBe(3);
    expect(result.log).toHaveLength(program.length);
  });

  it('returns collision error when hitting wall', () => {
    const program: Instruction[] = [
      { type: 'move' },
      { type: 'move' },
      { type: 'move' }
    ];

    const simulator = new LevelSimulator(level);
    const result = simulator.run(program);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('E_COLLIDE');
    expect(result.stars).toBe(0);
  });

  it('stops infinite loops with depth guard', () => {
    const buildNestedRepeats = (depth: number): Instruction => {
      if (depth === 0) {
        return { type: 'turn', direction: 'left' };
      }
      return {
        type: 'repeat',
        times: 2,
        body: [buildNestedRepeats(depth - 1)]
      };
    };

    const infiniteProgram: Instruction[] = [buildNestedRepeats(11)];

    const simulator = new LevelSimulator(level);
    const result = simulator.run(infiniteProgram, { stepLimit: 5000 });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('E_LOOP_DEPTH');
  });
});

describe('computeHint', () => {
  it('returns contextual hints', () => {
    expect(computeHint(level, { attempts: 0 })).toBe('先走到宝石旁边');
    expect(computeHint(level, { attempts: 1 })).toBe('记得拾取宝石');
    expect(computeHint(level, { attempts: 2, lastError: 'E_COLLIDE' })).toContain('障碍');
    expect(computeHint(level, { attempts: 3 })).toBe('可以尝试使用循环');
  });
});
