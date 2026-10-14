import { test } from "@japa/runner";

import { splitByOptions } from "#services/form_service";

test.group("splitByOptions", () => {
  const options = ["Yes, I agree", "No", "Maybe, later, perhaps"];

  test("keeps options containing commas intact", ({ assert }) => {
    assert.deepEqual(splitByOptions("Yes, I agree", options), ["Yes, I agree"]);
    assert.deepEqual(
      splitByOptions("Yes, I agree,No,Maybe, later, perhaps", options),
      ["Yes, I agree", "No", "Maybe, later, perhaps"],
    );
  });

  test("falls back to plain split for unknown values", ({ assert }) => {
    assert.deepEqual(splitByOptions("No,custom", options), ["No", "custom"]);
  });
});
