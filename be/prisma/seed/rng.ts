export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  chance(probability: number) {
    return this.next() < probability;
  }

  sample<T>(items: readonly T[], count: number) {
    const copy = [...items];
    const result: T[] = [];
    while (copy.length > 0 && result.length < count) {
      const index = this.int(0, copy.length - 1);
      result.push(copy.splice(index, 1)[0]);
    }
    return result;
  }
}

export function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
