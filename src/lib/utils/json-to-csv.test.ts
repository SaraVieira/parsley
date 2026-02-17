import { jsonToCsv } from "@/lib/utils/json-to-csv";
import { describe, expect, it } from "vitest";

describe("jsonToCsv", () => {
  it("converts an array of objects to CSV with headers", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    expect(jsonToCsv(data)).toBe("name,age\nAlice,30\nBob,25");
  });

  it("converts an array of primitives to a single value column", () => {
    expect(jsonToCsv([1, 2, 3])).toBe("value\n1\n2\n3");
  });

  it("converts a single object to key,value rows", () => {
    const data = { name: "Alice", age: 30 };
    expect(jsonToCsv(data)).toBe("key,value\nname,Alice\nage,30");
  });

  it("returns null for an empty array", () => {
    expect(jsonToCsv([])).toBeNull();
  });

  it("returns null for non-object data", () => {
    expect(jsonToCsv("hello")).toBeNull();
    expect(jsonToCsv(42)).toBeNull();
    expect(jsonToCsv(null)).toBeNull();
  });

  it("escapes fields containing commas", () => {
    const data = [{ text: "hello, world" }];
    expect(jsonToCsv(data)).toBe('text\n"hello, world"');
  });

  it("escapes fields containing quotes by doubling them", () => {
    const data = [{ text: 'say "hi"' }];
    expect(jsonToCsv(data)).toBe('text\n"say ""hi"""');
  });

  it("escapes fields containing newlines", () => {
    const data = [{ text: "line1\nline2" }];
    expect(jsonToCsv(data)).toBe('text\n"line1\nline2"');
  });

  it("renders null and undefined values as empty strings", () => {
    const data = [{ a: null, b: undefined, c: "ok" }];
    expect(jsonToCsv(data)).toBe("a,b,c\n,,ok");
  });
});
