type ClassInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassInput[]
  | Record<string, boolean | null | undefined>;

function flatten(input: ClassInput, tokens: string[]): void {
  if (!input) return;

  if (typeof input === 'string' || typeof input === 'number') {
    tokens.push(String(input));
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((value) => flatten(value, tokens));
    return;
  }

  Object.entries(input).forEach(([key, enabled]) => {
    if (enabled) tokens.push(key);
  });
}

export default function cn(...inputs: ClassInput[]): string {
  const tokens: string[] = [];
  inputs.forEach((input) => flatten(input, tokens));
  return tokens.join(' ');
}
