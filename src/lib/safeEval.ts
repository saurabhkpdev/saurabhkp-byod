/**
 * Safe expression evaluator that supports basic math operations
 * without using eval() or new Function().
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: string }
  | { type: 'func'; value: string }
  | { type: 'comma' }
  | { type: 'null' };

const ALLOWED_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  'Math.abs': Math.abs,
  'Math.round': Math.round,
  'Math.floor': Math.floor,
  'Math.ceil': Math.ceil,
  'Math.sqrt': Math.sqrt,
  'Math.min': Math.min,
  'Math.max': Math.max,
  'Math.pow': Math.pow,
  'abs': Math.abs,
  'round': Math.round,
  'floor': Math.floor,
  'ceil': Math.ceil,
  'sqrt': Math.sqrt,
  'min': Math.min,
  'max': Math.max,
  'pow': Math.pow,
};

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Numbers (including decimals and negative after operator)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i++];
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }

    // String literals
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = '';
      i++; // skip opening quote
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          i++; // skip escape char
        }
        str += expr[i++];
      }
      i++; // skip closing quote
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // null keyword
    if (expr.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'null' });
      i += 4;
      continue;
    }

    // Operators
    if ('+-*/%'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Comparison operators
    if (ch === '>' || ch === '<' || ch === '=' || ch === '!') {
      let op = ch;
      i++;
      if (i < expr.length && expr[i] === '=') {
        op += '=';
        i++;
        if (i < expr.length && expr[i] === '=') {
          op += '=';
          i++;
        }
      }
      tokens.push({ type: 'op', value: op });
      continue;
    }

    // Logical operators
    if (ch === '&' && expr[i + 1] === '&') {
      tokens.push({ type: 'op', value: '&&' });
      i += 2;
      continue;
    }
    if (ch === '|' && expr[i + 1] === '|') {
      tokens.push({ type: 'op', value: '||' });
      i += 2;
      continue;
    }

    // Parentheses
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    // Comma
    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }

    // Function names (e.g., Math.abs, round)
    if (/[a-zA-Z_]/.test(ch)) {
      let name = '';
      while (i < expr.length && /[a-zA-Z_0-9.]/.test(expr[i])) {
        name += expr[i++];
      }
      // Check if it's a known function
      if (name in ALLOWED_FUNCTIONS) {
        tokens.push({ type: 'func', value: name });
      } else if (name === 'true') {
        tokens.push({ type: 'number', value: 1 });
      } else if (name === 'false') {
        tokens.push({ type: 'number', value: 0 });
      } else {
        throw new Error(`Unknown identifier: ${name}`);
      }
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

type Value = number | string | boolean | null;

function parseExpression(tokens: Token[], pos: { i: number }): Value {
  return parseOr(tokens, pos);
}

function parseOr(tokens: Token[], pos: { i: number }): Value {
  let left = parseAnd(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === 'op' && (tokens[pos.i] as { value: string }).value === '||') {
    pos.i++;
    const right = parseAnd(tokens, pos);
    left = (left || right) as Value;
  }
  return left;
}

function parseAnd(tokens: Token[], pos: { i: number }): Value {
  let left = parseComparison(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === 'op' && (tokens[pos.i] as { value: string }).value === '&&') {
    pos.i++;
    const right = parseComparison(tokens, pos);
    left = (left && right) as Value;
  }
  return left;
}

function parseComparison(tokens: Token[], pos: { i: number }): Value {
  let left = parseAddSub(tokens, pos);
  const compOps = ['>', '<', '>=', '<=', '==', '===', '!=', '!=='];
  while (pos.i < tokens.length && tokens[pos.i].type === 'op' && compOps.includes((tokens[pos.i] as { value: string }).value)) {
    const op = (tokens[pos.i] as { value: string }).value;
    pos.i++;
    const right = parseAddSub(tokens, pos);
    switch (op) {
      case '>': left = Number(left) > Number(right); break;
      case '<': left = Number(left) < Number(right); break;
      case '>=': left = Number(left) >= Number(right); break;
      case '<=': left = Number(left) <= Number(right); break;
      case '==': case '===': left = left === right; break;
      case '!=': case '!==': left = left !== right; break;
    }
  }
  return left;
}

function parseAddSub(tokens: Token[], pos: { i: number }): Value {
  let left = parseMulDiv(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === 'op' && ('+' === (tokens[pos.i] as { value: string }).value || '-' === (tokens[pos.i] as { value: string }).value)) {
    const op = (tokens[pos.i] as { value: string }).value;
    pos.i++;
    const right = parseMulDiv(tokens, pos);
    if (op === '+') {
      if (typeof left === 'string' || typeof right === 'string') {
        left = String(left ?? '') + String(right ?? '');
      } else {
        left = Number(left) + Number(right);
      }
    } else {
      left = Number(left) - Number(right);
    }
  }
  return left;
}

function parseMulDiv(tokens: Token[], pos: { i: number }): Value {
  let left = parseUnary(tokens, pos);
  while (pos.i < tokens.length && tokens[pos.i].type === 'op' && ('*/%'.includes((tokens[pos.i] as { value: string }).value))) {
    const op = (tokens[pos.i] as { value: string }).value;
    pos.i++;
    const right = parseUnary(tokens, pos);
    if (op === '*') left = Number(left) * Number(right);
    else if (op === '/') left = Number(left) / Number(right);
    else left = Number(left) % Number(right);
  }
  return left;
}

function parseUnary(tokens: Token[], pos: { i: number }): Value {
  if (pos.i < tokens.length && tokens[pos.i].type === 'op' && (tokens[pos.i] as { value: string }).value === '-') {
    pos.i++;
    const val = parsePrimary(tokens, pos);
    return -Number(val);
  }
  if (pos.i < tokens.length && tokens[pos.i].type === 'op' && (tokens[pos.i] as { value: string }).value === '+') {
    pos.i++;
    return parsePrimary(tokens, pos);
  }
  return parsePrimary(tokens, pos);
}

function parsePrimary(tokens: Token[], pos: { i: number }): Value {
  if (pos.i >= tokens.length) throw new Error('Unexpected end of expression');

  const token = tokens[pos.i];

  // Function call
  if (token.type === 'func') {
    const funcName = token.value;
    pos.i++;
    if (pos.i >= tokens.length || tokens[pos.i].type !== 'paren' || (tokens[pos.i] as { value: string }).value !== '(') {
      throw new Error(`Expected ( after function ${funcName}`);
    }
    pos.i++; // skip (
    const args: number[] = [];
    if (pos.i < tokens.length && !(tokens[pos.i].type === 'paren' && (tokens[pos.i] as { value: string }).value === ')')) {
      args.push(Number(parseExpression(tokens, pos)));
      while (pos.i < tokens.length && tokens[pos.i].type === 'comma') {
        pos.i++;
        args.push(Number(parseExpression(tokens, pos)));
      }
    }
    if (pos.i >= tokens.length || tokens[pos.i].type !== 'paren' || (tokens[pos.i] as { value: string }).value !== ')') {
      throw new Error(`Expected ) after function arguments`);
    }
    pos.i++; // skip )
    return ALLOWED_FUNCTIONS[funcName](...args);
  }

  // Parenthesized expression
  if (token.type === 'paren' && token.value === '(') {
    pos.i++;
    const val = parseExpression(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i].type !== 'paren' || (tokens[pos.i] as { value: string }).value !== ')') {
      throw new Error('Missing closing parenthesis');
    }
    pos.i++;
    return val;
  }

  // Number
  if (token.type === 'number') {
    pos.i++;
    return token.value;
  }

  // String
  if (token.type === 'string') {
    pos.i++;
    return token.value;
  }

  // Null
  if (token.type === 'null') {
    pos.i++;
    return null;
  }

  throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
}

/**
 * Safely evaluate a mathematical/string expression.
 * Supports: +, -, *, /, %, comparisons, &&, ||, Math functions, string concatenation.
 * Does NOT support arbitrary JavaScript execution.
 */
export function safeEvaluate(expression: string): Value {
  if (!expression || !expression.trim()) return null;
  const tokens = tokenize(expression.trim());
  if (tokens.length === 0) return null;
  const pos = { i: 0 };
  const result = parseExpression(tokens, pos);
  if (pos.i < tokens.length) {
    throw new Error('Unexpected tokens after expression');
  }
  return result;
}
