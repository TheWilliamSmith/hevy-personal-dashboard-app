import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { en } from '@/i18n/locales/en';
import { fr } from '@/i18n/locales/fr';

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result.set(path, value);
    } else {
      for (const [child, text] of leaves(value, path)) {
        result.set(child, text);
      }
    }
  }
  return result;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return path.includes('i18n') ? [] : sourceFiles(path);
    }
    return /\.(ts|vue)$/.test(name) ? [path] : [];
  });
}

const english = leaves(en as unknown as Tree);
const french = leaves(fr as unknown as Tree);

describe('translations', () => {
  it('has the same keys in English and French', () => {
    const missingInFrench = [...english.keys()].filter((key) => !french.has(key));
    const extraInFrench = [...french.keys()].filter((key) => !english.has(key));

    expect(missingInFrench).toEqual([]);
    expect(extraInFrench).toEqual([]);
  });

  it('has no empty message', () => {
    const empty = [...english, ...french].filter(([, text]) => text.trim() === '').map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const mismatched = [...english].filter(([key, text]) => {
      const other = french.get(key);
      return other !== undefined && placeholders(text).join() !== placeholders(other).join();
    });
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  it('defines every key the code asks for', () => {
    const namespaces = Object.keys(en).join('|');
    const keyPattern = new RegExp(`(?:'|keypath=")((?:${namespaces})\\.[\\w.]+)(?:'|")`, 'g');
    const used = new Set<string>();
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      for (const match of readFileSync(file, 'utf8').matchAll(keyPattern)) {
        used.add(match[1] as string);
      }
    }
    const unknown = [...used].filter((key) => !english.has(key));

    expect(used.size).toBeGreaterThan(0);
    expect(unknown).toEqual([]);
  });
});
