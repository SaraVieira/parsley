import {
  getValueAtPath,
  setValueAtPath,
  deleteAtPath,
  renameKeyAtPath,
  addAtPath,
  bulkRenameKey,
  bulkDeleteKey,
} from "@/lib/utils/json-path";
import { describe, expect, it } from "vitest";

const data = {
  users: [
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ],
  metadata: { total: 2, page: 1 },
};

describe("getValueAtPath", () => {
  it("returns the root for $", () => {
    expect(getValueAtPath(data, "$")).toBe(data);
  });

  it("gets a nested object property", () => {
    expect(getValueAtPath(data, "$.metadata.total")).toBe(2);
  });

  it("gets an array item", () => {
    expect(getValueAtPath(data, "$.users[0]")).toEqual({
      id: 1,
      name: "Alice",
      age: 30,
    });
  });

  it("gets a deep property through an array", () => {
    expect(getValueAtPath(data, "$.users[0].name")).toBe("Alice");
  });

  it("supports bracket notation for keys", () => {
    expect(getValueAtPath(data, '$["users"]')).toBe(data.users);
  });

  it("returns undefined for a nonexistent path", () => {
    expect(getValueAtPath(data, "$.nonexistent.deep")).toBeUndefined();
  });

  it("returns undefined when null is in the chain", () => {
    const withNull = { a: { b: null } };
    expect(getValueAtPath(withNull, "$.a.b.c")).toBeUndefined();
  });

  it("returns undefined when undefined is in the chain", () => {
    const withUndef = { a: {} };
    expect(getValueAtPath(withUndef, "$.a.b.c")).toBeUndefined();
  });
});

describe("setValueAtPath", () => {
  it("updates a primitive value", () => {
    const result = setValueAtPath(data, "$.metadata.total", 10);
    expect((result as typeof data).metadata.total).toBe(10);
  });

  it("updates a nested value through an array", () => {
    const result = setValueAtPath(data, "$.users[1].name", "Bobby");
    expect((result as typeof data).users[1].name).toBe("Bobby");
  });

  it("returns the value directly when path is $", () => {
    const result = setValueAtPath(data, "$", "replaced");
    expect(result).toBe("replaced");
  });

  it("does not mutate the original object", () => {
    const original = structuredClone(data);
    setValueAtPath(data, "$.metadata.total", 99);
    expect(data).toEqual(original);
  });
});

describe("deleteAtPath", () => {
  it("deletes an object key", () => {
    const result = deleteAtPath(data, "$.metadata.page") as typeof data;
    expect(result.metadata).toEqual({ total: 2 });
  });

  it("deletes an array item by splicing", () => {
    const result = deleteAtPath(data, "$.users[0]") as typeof data;
    expect(result.users).toHaveLength(1);
    expect(result.users[0].name).toBe("Bob");
  });

  it("deletes a nested property", () => {
    const result = deleteAtPath(data, "$.users[0].age") as typeof data;
    expect(result.users[0]).toEqual({ id: 1, name: "Alice" });
  });

  it("returns undefined when path is $", () => {
    expect(deleteAtPath(data, "$")).toBeUndefined();
  });
});

describe("renameKeyAtPath", () => {
  it("renames a simple key", () => {
    const result = renameKeyAtPath(data, "$.metadata", "meta") as Record<
      string,
      unknown
    >;
    expect(result.meta).toEqual({ total: 2, page: 1 });
    expect(result.metadata).toBeUndefined();
  });

  it("renames a key in a nested object", () => {
    const result = renameKeyAtPath(
      data,
      "$.metadata.total",
      "count",
    ) as typeof data;
    expect((result.metadata as unknown as Record<string, unknown>).count).toBe(
      2,
    );
    expect(
      (result.metadata as unknown as Record<string, unknown>).total,
    ).toBeUndefined();
  });

  it("preserves key order", () => {
    const result = renameKeyAtPath(
      data,
      "$.metadata.total",
      "count",
    ) as typeof data;
    const keys = Object.keys(result.metadata);
    expect(keys).toEqual(["count", "page"]);
  });
});

describe("addAtPath", () => {
  it("adds a new key to an object", () => {
    const result = addAtPath(
      data,
      "$.metadata",
      "hasMore",
      false,
    ) as typeof data;
    expect(
      (result.metadata as unknown as Record<string, unknown>).hasMore,
    ).toBe(false);
  });

  it("pushes a value to an array", () => {
    const newUser = { id: 3, name: "Charlie", age: 35 };
    const result = addAtPath(data, "$.users", "", newUser) as typeof data;
    expect(result.users).toHaveLength(3);
    expect(result.users[2]).toEqual(newUser);
  });

  it("pushes to a root array", () => {
    const arr = [1, 2, 3];
    const result = addAtPath(arr, "$", "", 4);
    expect(result).toEqual([1, 2, 3, 4]);
  });
});

describe("bulkRenameKey", () => {
  it("renames keys at all levels", () => {
    const nested = {
      name: "root",
      children: [{ name: "child1" }, { name: "child2" }],
    };
    const result = bulkRenameKey(nested, "name", "label") as Record<
      string,
      unknown
    >;
    expect(result.label).toBe("root");
    expect(result.name).toBeUndefined();
    expect(
      (
        (result.children as Array<Record<string, unknown>>)[0] as Record<
          string,
          unknown
        >
      ).label,
    ).toBe("child1");
  });

  it("returns the same reference when oldKey equals newKey", () => {
    const result = bulkRenameKey(data, "name", "name");
    expect(result).toBe(data);
  });
});

describe("bulkDeleteKey", () => {
  it("deletes keys at all levels", () => {
    const result = bulkDeleteKey(data, "id") as typeof data;
    expect(result.users[0]).toEqual({ name: "Alice", age: 30 });
    expect(result.users[1]).toEqual({ name: "Bob", age: 25 });
  });

  it("handles arrays of objects", () => {
    const input = {
      items: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    };
    const result = bulkDeleteKey(input, "a") as {
      items: Array<Record<string, unknown>>;
    };
    expect(result.items[0]).toEqual({ b: 2 });
    expect(result.items[1]).toEqual({ b: 4 });
  });
});
