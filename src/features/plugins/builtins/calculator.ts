import { tool } from "ai";
import { z } from "zod";
import type { PluginDefinition } from "../types";

export function evaluateMathExpression(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Empty mathematical expression.");
  }

  if (trimmed.length > 500) {
    throw new Error("Mathematical expression exceeds maximum allowed length of 500 characters.");
  }

  let pos = 0;
  function isDigit(c: string) {
    return c >= "0" && c <= "9";
  }
  function isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  type TokenType = "NUMBER" | "IDENT" | "OP" | "LPAREN" | "RPAREN" | "COMMA" | "EOF";
  interface Token {
    type: TokenType;
    value?: string | number;
    raw?: string;
  }

  const tokens: Token[] = [];
  while (pos < trimmed.length) {
    const c = trimmed[pos]!;
    if (/\s/.test(c)) {
      pos++;
      continue;
    }

    if (isDigit(c) || (c === "." && isDigit(trimmed[pos + 1] ?? ""))) {
      let num = "";
      while (
        pos < trimmed.length &&
        (isDigit(trimmed[pos]!) ||
          trimmed[pos] === "." ||
          trimmed[pos] === "e" ||
          trimmed[pos] === "E")
      ) {
        const curr = trimmed[pos]!;
        if (
          (curr === "e" || curr === "E") &&
          (trimmed[pos + 1] === "+" || trimmed[pos + 1] === "-")
        ) {
          num += curr;
          pos++;
          num += trimmed[pos]!;
          pos++;
          continue;
        }
        num += curr;
        pos++;
      }
      const parsedNum = Number(num);
      if (Number.isNaN(parsedNum)) {
        throw new Error(`Invalid number literal: "${num}"`);
      }
      tokens.push({ type: "NUMBER", value: parsedNum, raw: num });
    } else if (isAlpha(c)) {
      let id = "";
      while (pos < trimmed.length && (isAlpha(trimmed[pos]!) || isDigit(trimmed[pos]!))) {
        id += trimmed[pos]!;
        pos++;
      }
      tokens.push({ type: "IDENT", value: id.toLowerCase(), raw: id });
    } else if (c === "*" && trimmed[pos + 1] === "*") {
      tokens.push({ type: "OP", value: "^", raw: "**" });
      pos += 2;
    } else if ("+-*/%^".includes(c)) {
      tokens.push({ type: "OP", value: c, raw: c });
      pos++;
    } else if (c === "(") {
      tokens.push({ type: "LPAREN", raw: "(" });
      pos++;
    } else if (c === ")") {
      tokens.push({ type: "RPAREN", raw: ")" });
      pos++;
    } else if (c === ",") {
      tokens.push({ type: "COMMA", raw: "," });
      pos++;
    } else {
      throw new Error(`Unsupported character in expression: "${c}"`);
    }
  }
  tokens.push({ type: "EOF" });

  let tIdx = 0;
  function curr(): Token {
    return tokens[tIdx] ?? { type: "EOF" };
  }
  function eat(type: TokenType, val?: string): Token {
    const t = curr();
    if (t.type !== type || (val !== undefined && t.value !== val)) {
      throw new Error(`Syntax error: expected ${type}${val ? ` "${val}"` : ""}, got ${t.type}`);
    }
    tIdx++;
    return t;
  }

  const CONSTANTS: Record<string, number> = Object.assign(Object.create(null), {
    pi: Math.PI,
    e: Math.E,
  });

  const FUNCTIONS: Record<string, (args: number[]) => number> = Object.assign(Object.create(null), {
    sqrt: (args: number[]) => {
      if (args[0] === undefined || args[0] < 0) throw new Error("sqrt() requires a non-negative number");
      return Math.sqrt(args[0]);
    },
    cbrt: (args: number[]) => {
      if (args[0] === undefined) throw new Error("cbrt() requires an argument");
      return Math.cbrt(args[0]);
    },
    sin: (args: number[]) => (args[0] !== undefined ? Math.sin(args[0]) : 0),
    cos: (args: number[]) => (args[0] !== undefined ? Math.cos(args[0]) : 0),
    tan: (args: number[]) => (args[0] !== undefined ? Math.tan(args[0]) : 0),
    asin: (args: number[]) => (args[0] !== undefined ? Math.asin(args[0]) : 0),
    acos: (args: number[]) => (args[0] !== undefined ? Math.acos(args[0]) : 0),
    atan: (args: number[]) => (args[0] !== undefined ? Math.atan(args[0]) : 0),
    abs: (args: number[]) => (args[0] !== undefined ? Math.abs(args[0]) : 0),
    round: (args: number[]) => (args[0] !== undefined ? Math.round(args[0]) : 0),
    floor: (args: number[]) => (args[0] !== undefined ? Math.floor(args[0]) : 0),
    ceil: (args: number[]) => (args[0] !== undefined ? Math.ceil(args[0]) : 0),
    log: (args: number[]) => {
      if (args[0] === undefined || args[0] <= 0) throw new Error("log() requires a positive number");
      return Math.log(args[0]);
    },
    ln: (args: number[]) => {
      if (args[0] === undefined || args[0] <= 0) throw new Error("ln() requires a positive number");
      return Math.log(args[0]);
    },
    log10: (args: number[]) => {
      if (args[0] === undefined || args[0] <= 0) throw new Error("log10() requires a positive number");
      return Math.log10(args[0]);
    },
    log2: (args: number[]) => {
      if (args[0] === undefined || args[0] <= 0) throw new Error("log2() requires a positive number");
      return Math.log2(args[0]);
    },
    exp: (args: number[]) => (args[0] !== undefined ? Math.exp(args[0]) : 0),
    min: (args: number[]) => {
      if (args.length === 0) throw new Error("min() requires at least one argument");
      return Math.min(...args);
    },
    max: (args: number[]) => {
      if (args.length === 0) throw new Error("max() requires at least one argument");
      return Math.max(...args);
    },
    pow: (args: number[]) => {
      if (args[0] === undefined || args[1] === undefined) throw new Error("pow() requires 2 arguments: base, exponent");
      return Math.pow(args[0], args[1]);
    },
    factorial: (args: number[]) => {
      if (args[0] === undefined) throw new Error("factorial() requires an argument");
      const n = Math.floor(args[0]);
      if (n < 0 || n > 170) throw new Error("factorial argument must be between 0 and 170");
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    },
    fact: (args: number[]) => {
      if (args[0] === undefined) throw new Error("fact() requires an argument");
      const n = Math.floor(args[0]);
      if (n < 0 || n > 170) throw new Error("fact argument must be between 0 and 170");
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    },
  });

  function parseExpr(): number {
    return parseAddSub();
  }

  function parseAddSub(): number {
    let val = parseMulDiv();
    while (curr().type === "OP" && (curr().value === "+" || curr().value === "-")) {
      const op = eat("OP").value;
      const right = parseMulDiv();
      val = op === "+" ? val + right : val - right;
    }
    return val;
  }

  function parseMulDiv(): number {
    let val = parsePower();
    while (
      curr().type === "OP" &&
      (curr().value === "*" || curr().value === "/" || curr().value === "%")
    ) {
      const op = eat("OP").value;
      const right = parsePower();
      if (op === "*") {
        val = val * right;
      } else if (op === "/") {
        if (right === 0) throw new Error("Division by zero.");
        val = val / right;
      } else if (op === "%") {
        if (right === 0) throw new Error("Modulo by zero.");
        val = val % right;
      }
    }
    return val;
  }

  function parsePower(): number {
    const val = parseUnary();
    if (curr().type === "OP" && curr().value === "^") {
      eat("OP");
      const right = parsePower(); // right-associative
      return Math.pow(val, right);
    }
    return val;
  }

  function parseUnary(): number {
    if (curr().type === "OP" && (curr().value === "+" || curr().value === "-")) {
      const op = eat("OP").value;
      const val = parseUnary();
      return op === "-" ? -val : val;
    }
    return parseFactor();
  }

  function parseFactor(): number {
    const t = curr();
    if (t.type === "NUMBER") {
      eat("NUMBER");
      return Number(t.value);
    }
    if (t.type === "IDENT") {
      const name = String(eat("IDENT").value);
      if (curr().type === "LPAREN") {
        eat("LPAREN");
        const args: number[] = [];
        if (curr().type !== "RPAREN") {
          args.push(parseExpr());
          while (curr().type === "COMMA") {
            eat("COMMA");
            args.push(parseExpr());
          }
        }
        eat("RPAREN");
        if (!(name in FUNCTIONS)) {
          throw new Error(`Unsupported function: "${name}"`);
        }
        return FUNCTIONS[name]!(args);
      } else {
        if (!(name in CONSTANTS)) {
          throw new Error(`Unknown variable or constant: "${name}"`);
        }
        return CONSTANTS[name]!;
      }
    }
    if (t.type === "LPAREN") {
      eat("LPAREN");
      const val = parseExpr();
      eat("RPAREN");
      return val;
    }
    throw new Error(`Unexpected token: ${t.type} ${t.value ?? ""}`);
  }

  const result = parseExpr();
  if (curr().type !== "EOF") {
    throw new Error(`Unexpected trailing expression starting with "${curr().raw ?? curr().type}"`);
  }

  if (!Number.isFinite(result)) {
    throw new Error("Mathematical calculation resulted in non-finite value (Infinity or NaN).");
  }

  return result;
}

export function createCalculatorTool() {
  return tool({
    description:
      "Safely calculates the result of mathematical expressions (e.g. arithmetic, scientific functions like sqrt, sin, cos, log, pow, factorial).",
    inputSchema: z.object({
      expression: z
        .string()
        .describe("The math expression to evaluate, e.g. '2 + 2 * 10', 'sqrt(144)', 'sin(pi / 2)', '2^10'."),
    }),
    execute: async ({ expression }) => {
      try {
        const result = evaluateMathExpression(expression);
        return {
          expression,
          result,
          success: true,
        };
      } catch (err) {
        return {
          expression,
          error: err instanceof Error ? err.message : String(err),
          success: false,
        };
      }
    },
  });
}

export const calculatorPlugin: PluginDefinition = {
  id: "calculator",
  name: "Safe Calculator",
  description: "Accurately and safely evaluates math expressions without code execution.",
  createTools: () => ({
    calculate: createCalculatorTool(),
  }),
};
