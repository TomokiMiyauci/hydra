import { tailingSlashableURLPattern } from "./handler.ts";
import table from "./handler_test.json" assert { type: "json" };
import { assertEquals, describe, it } from "./dev_deps.ts";

describe("tailingSlashableURLPattern", () => {
  it("should pass", () => {
    table.tailingSlashableURLPattern.forEach(({ actual, expected }) => {
      assertEquals(tailingSlashableURLPattern(actual), expected);
    });
  });
});
