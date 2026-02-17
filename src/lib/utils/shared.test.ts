import {
  capitalize,
  getValueColor,
  getValueDisplay,
  isPrimitive,
  isSimpleKey,
  mergeObjectShapes,
} from "@/lib/utils/shared";
import { describe, expect, it } from "vitest";

describe("mergeObjectShapes", () => {
  it("merges two objects with first value winning per key", () => {
    const result = mergeObjectShapes([
      { a: 1, b: 2 },
      { b: 99, c: 3 },
    ]);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("ignores non-objects in the array", () => {
    const result = mergeObjectShapes([null, "string", 42, { x: 10 }]);
    expect(result).toEqual({ x: 10 });
  });
});

describe("capitalize", () => {
  it("uppercases the first letter of a word", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("handles a single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("returns empty string for empty input", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("isSimpleKey", () => {
  it("returns true for valid JS identifiers", () => {
    expect(isSimpleKey("foo")).toBe(true);
    expect(isSimpleKey("_bar")).toBe(true);
    expect(isSimpleKey("$baz")).toBe(true);
    expect(isSimpleKey("camelCase")).toBe(true);
    expect(isSimpleKey("name2")).toBe(true);
  });

  it("returns false for keys starting with a digit", () => {
    expect(isSimpleKey("2fast")).toBe(false);
  });

  it("returns false for keys with spaces", () => {
    expect(isSimpleKey("has space")).toBe(false);
  });

  it("returns false for keys with dashes", () => {
    expect(isSimpleKey("kebab-case")).toBe(false);
  });
});

describe("isPrimitive", () => {
  it("returns true for all primitive types", () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
    expect(isPrimitive("hello")).toBe(true);
    expect(isPrimitive(42)).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
  });

  it("returns false for objects and arrays", () => {
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive({ a: 1 })).toBe(false);
  });
});

describe("getValueDisplay", () => {
  it("handles null", () => {
    expect(getValueDisplay(null)).toEqual({ display: "null", type: "null" });
  });

  it("handles undefined", () => {
    expect(getValueDisplay(undefined)).toEqual({
      display: "undefined",
      type: "undefined",
    });
  });

  it("wraps strings in quotes", () => {
    expect(getValueDisplay("hello")).toEqual({
      display: '"hello"',
      type: "string",
    });
  });

  it("displays numbers as strings", () => {
    expect(getValueDisplay(42)).toEqual({ display: "42", type: "number" });
  });

  it("displays booleans as strings", () => {
    expect(getValueDisplay(true)).toEqual({ display: "true", type: "boolean" });
  });

  it("displays arrays with length", () => {
    expect(getValueDisplay([1, 2, 3])).toEqual({
      display: "Array(3)",
      type: "array",
    });
  });

  it("displays objects as Object", () => {
    expect(getValueDisplay({ a: 1 })).toEqual({
      display: "Object",
      type: "object",
    });
  });
});

describe("getValueColor", () => {
  it("returns emerald for strings", () => {
    expect(getValueColor("string")).toBe("text-emerald-400");
  });

  it("returns blue for numbers", () => {
    expect(getValueColor("number")).toBe("text-blue-400");
  });

  it("returns amber for booleans", () => {
    expect(getValueColor("boolean")).toBe("text-amber-400");
  });

  it("returns muted for null and undefined", () => {
    expect(getValueColor("null")).toBe("text-muted-foreground italic");
    expect(getValueColor("undefined")).toBe("text-muted-foreground italic");
  });

  it("returns foreground for unknown types", () => {
    expect(getValueColor("something")).toBe("text-foreground");
  });
});
