import Admin from "#models/admin";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";
import nodeAssert from "node:assert";

test.group("Auth: Me", (group) => {
  // Wrap each test in a DB transaction
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("it should return the current user with a valid token", async ({
    client,
    assert,
  }) => {
    // 1. Create an Admin
    const admin = await Admin.create({
      firstName: "Dawid",
      lastName: "Linek",
      email: "test@solvro.pl",
      password: "SuperSecret123", // hashed by your model hook or db provider
      type: "organizer",
      active: true,
    });

    // 2. Create a token (or you can call /login to retrieve one if that’s your flow)
    //    Using the DbAccessTokensProvider.forModel(Admin) from your Admin model
    const tokenInstance = await Admin.accessTokens.create(admin);

    nodeAssert(tokenInstance.value !== undefined);

    const token = tokenInstance.value.release();

    // 3. Request GET /api/v1/auth/me with the token
    const response = await client
      .get("/api/v1/auth/me")
      .header("Authorization", `Bearer ${token}`);

    // 4. Assert success (the route is protected, so success => 200)
    response.assertStatus(200);

    // 5. Check the shape of the response
    response.assertBodyContains({
      id: admin.id,
      firstName: "Dawid",
      lastName: "Linek",
      email: "test@solvro.pl",
      type: "organizer",
      active: true,
    });

    const result = response.body() as Admin;

    assert.exists(result.createdAt);
    assert.exists(result.updatedAt);
  });

  test("it should fail if no token is provided", async ({ client }) => {
    // 1. Simply call /me without Authorization header
    const response = await client.get("/api/v1/auth/me");

    // 2. Since the route is protected, we expect 401 (unauthorized) or whatever
    //    your app returns for missing tokens.
    response.assertStatus(401);

    // Optional: Check the error structure if you have a custom error format
    response.assertBodyContains({
      errors: [{ message: "Unauthorized access" }],
    });
  });

  test("it should fail if token is invalid", async ({ client }) => {
    // 1. Provide a random or malformed token
    const response = await client
      .get("/api/v1/auth/me")
      .header("Authorization", "Bearer someInvalidToken");

    // 2. Expect 401 or 403, depending on how your app handles invalid tokens
    response.assertStatus(401);

    // Optional: check error message
    response.assertBodyContains({
      errors: [{ message: "Unauthorized access" }],
    });
  });
});
