import { jsonToTypeScript } from "@/lib/utils/json-to-types";
import { describe, expect, it } from "vitest";

describe("jsonToTypeScript", () => {
  it("generates type for null", () => {
    expect(jsonToTypeScript(null)).toBe("type Root = null;");
  });

  it("generates type for undefined", () => {
    expect(jsonToTypeScript(undefined)).toBe("type Root = undefined;");
  });

  it("generates type for string", () => {
    expect(jsonToTypeScript("hello")).toBe("type Root = string;");
  });

  it("generates type for number", () => {
    expect(jsonToTypeScript(42)).toBe("type Root = number;");
  });

  it("generates type for a simple object", () => {
    const result = jsonToTypeScript({ name: "Alice", age: 30, active: true });
    expect(result).toContain("type Root = {");
    expect(result).toContain("name: string;");
    expect(result).toContain("age: number;");
    expect(result).toContain("active: boolean;");
  });

  it("generates item type for array of objects", () => {
    const data = [
      { id: 1, label: "A" },
      { id: 2, label: "B" },
    ];
    const result = jsonToTypeScript(data);
    expect(result).toContain("type RootItem = {");
    expect(result).toContain("id: number;");
    expect(result).toContain("label: string;");
    expect(result).toContain("type Root = RootItem[];");
  });

  it("handles empty arrays", () => {
    expect(jsonToTypeScript([])).toBe("type Root = unknown[];");
  });

  it("respects custom rootName", () => {
    const result = jsonToTypeScript({ x: 1 }, "MyType");
    expect(result).toContain("type MyType = {");
    expect(result).toContain("x: number;");
  });

  it("generates inline types for nested objects", () => {
    const data = { user: { name: "Alice" } };
    const result = jsonToTypeScript(data);
    expect(result).toContain("user: {");
    expect(result).toContain("name: string;");
  });
});
