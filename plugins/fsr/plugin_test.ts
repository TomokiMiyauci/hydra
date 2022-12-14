import { pathToPattern } from "./plugin.ts";
import table from "./plugin_test.json" assert { type: "json" };
import { assertEquals, describe, it } from "../../dev_deps.ts";

describe("pathToPattern", () => {
  it("should pass", () => {
    table.pathToPattern.forEach(({ actual, expected }) => {
      assertEquals(pathToPattern(actual), expected);
    });
  });
});
