import {
  compareCells,
  findArrayPaths,
  formatCell,
  getColumns,
  getRowKey,
  getValueAtPath,
  isPlainObject,
} from "@/lib/utils/table-utils";
import { describe, expect, it } from "vitest";

const users = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

const nested = {
  groups: [{ name: "A", members: [{ id: 1 }] }],
};

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for numbers", () => {
    expect(isPlainObject(42)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isPlainObject("str")).toBe(false);
  });
});

describe("findArrayPaths", () => {
  it("finds root array of objects", () => {
    const result = findArrayPaths(users);
    expect(result).toEqual([{ path: "$", label: "root", length: 2 }]);
  });

  it("finds nested array property", () => {
    const data = { users };
    const result = findArrayPaths(data);
    expect(result).toEqual([{ path: "$.users", label: "users", length: 2 }]);
  });

  it("finds nested arrays within array items", () => {
    const result = findArrayPaths(nested);
    expect(result).toEqual([
      { path: "$.groups", label: "groups", length: 1 },
      { path: "$.groups[*].members", label: "groups.[*].members", length: 1 },
    ]);
  });

  it("returns empty for empty data", () => {
    expect(findArrayPaths({})).toEqual([]);
    expect(findArrayPaths(null)).toEqual([]);
    expect(findArrayPaths([])).toEqual([]);
  });
});

describe("getValueAtPath", () => {
  it("returns data itself for root path $", () => {
    expect(getValueAtPath(users, "$")).toBe(users);
  });

  it("resolves a simple property path", () => {
    const data = { users };
    expect(getValueAtPath(data, "$.users")).toBe(users);
  });

  it("resolves wildcard path with flatMap", () => {
    const result = getValueAtPath(users, "$[*].name");
    expect(result).toEqual(["Alice", "Bob"]);
  });
});

describe("getColumns", () => {
  it("extracts union of keys from all objects", () => {
    const data = [
      { a: 1, b: 2 },
      { b: 3, c: 4 },
    ];
    expect(getColumns(data)).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty input", () => {
    expect(getColumns([])).toEqual([]);
  });
});

describe("getRowKey", () => {
  it("uses id property when available", () => {
    expect(getRowKey({ id: 42 }, 0, ["id"])).toBe("42");
  });

  it("uses _id property when id is absent", () => {
    expect(getRowKey({ _id: "abc" }, 0, ["_id"])).toBe("abc");
  });

  it("uses key property when id and _id are absent", () => {
    expect(getRowKey({ key: "k1" }, 0, ["key"])).toBe("k1");
  });

  it("falls back to first column + index", () => {
    expect(getRowKey({ name: "Alice" }, 3, ["name"])).toBe("Alice-3");
  });

  it("falls back to row-index for non-objects", () => {
    expect(getRowKey("hello", 5, ["col"])).toBe("row-5");
  });
});

describe("formatCell", () => {
  it('returns "null" for null', () => {
    expect(formatCell(null)).toBe("null");
  });

  it("returns empty string for undefined", () => {
    expect(formatCell(undefined)).toBe("");
  });

  it("returns JSON.stringify for objects", () => {
    expect(formatCell({ a: 1 })).toBe('{"a":1}');
  });

  it("returns String() for strings", () => {
    expect(formatCell("hello")).toBe("hello");
  });

  it("returns String() for numbers", () => {
    expect(formatCell(42)).toBe("42");
  });
});

describe("compareCells", () => {
  it("returns 0 for equal values", () => {
    expect(compareCells(1, 1)).toBe(0);
    expect(compareCells("a", "a")).toBe(0);
  });

  it("sorts nulls last", () => {
    expect(compareCells(null, "a")).toBe(1);
    expect(compareCells("a", null)).toBe(-1);
  });

  it("compares numbers numerically", () => {
    expect(compareCells(2, 10)).toBeLessThan(0);
    expect(compareCells(10, 2)).toBeGreaterThan(0);
  });

  it("compares strings with localeCompare", () => {
    expect(compareCells("apple", "banana")).toBeLessThan(0);
    expect(compareCells("banana", "apple")).toBeGreaterThan(0);
  });
});
