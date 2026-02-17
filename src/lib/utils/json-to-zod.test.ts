import { jsonToZod } from "@/lib/utils/json-to-zod";
import { describe, expect, it } from "vitest";

describe("jsonToZod", () => {
  it("starts output with zod import", () => {
    const result = jsonToZod("hello");
    expect(result).toContain('import { z } from "zod";');
  });

  it("generates z.null() for null", () => {
    const result = jsonToZod(null);
    expect(result).toContain("z.null()");
  });

  it("generates z.undefined() for undefined", () => {
    const result = jsonToZod(undefined);
    expect(result).toContain("z.undefined()");
  });

  it("generates z.string() for a string value", () => {
    const result = jsonToZod("hello");
    expect(result).toContain("z.string()");
  });

  it("generates z.number().int() for an integer", () => {
    const result = jsonToZod(42);
    expect(result).toContain("z.number().int()");
  });

  it("generates z.number() without .int() for a float", () => {
    const result = jsonToZod(3.14);
    expect(result).toContain("z.number()");
    expect(result).not.toContain("z.number().int()");
  });

  it("generates z.boolean() for a boolean", () => {
    const result = jsonToZod(true);
    expect(result).toContain("z.boolean()");
  });

  it("generates z.array(z.unknown()) for an empty array", () => {
    const result = jsonToZod([]);
    expect(result).toContain("z.array(z.unknown())");
  });

  it("generates z.array(z.string()) for an array of strings", () => {
    const result = jsonToZod(["a", "b", "c"]);
    expect(result).toContain("z.array(z.string())");
  });

  it("generates item schema and z.array for an array of objects", () => {
    const result = jsonToZod([{ name: "Alice" }, { name: "Bob" }]);
    expect(result).toContain("z.object(");
    expect(result).toContain("name: z.string()");
    expect(result).toContain("z.array(");
  });

  it("generates z.object with correct field schemas for a simple object", () => {
    const result = jsonToZod({ name: "test", age: 25, active: true });
    expect(result).toContain("z.object(");
    expect(result).toContain("name: z.string()");
    expect(result).toContain("age: z.number().int()");
    expect(result).toContain("active: z.boolean()");
  });

  it("uses camelCase schema variable name from custom rootName", () => {
    const result = jsonToZod({ id: 1 }, "rootName");
    expect(result).toContain("rootNameSchema");
  });

  it("defaults rootName to root producing rootSchema", () => {
    const result = jsonToZod({ id: 1 });
    expect(result).toContain("rootSchema");
  });
});
