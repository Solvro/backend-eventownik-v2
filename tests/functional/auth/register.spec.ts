import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";

import Admin from "#models/admin";

test.group("Auth: Register", (group) => {
  // Run migrations in-memory and rollback after each test if necessary
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("it should register a new admin and return the admin object", async ({
    client,
    assert,
  }) => {
    const payload = {
      email: "john.doe@example.com",
      password: "SuperSecret123",
      firstName: "John",
      lastName: "Doe",
    };

    const response = await client.post("/api/v1/auth/register").json(payload);

    // Assuming the validator and controller return 200 on success
    response.assertStatus(200);

    // Basic shape: Make sure we have an admin in the response
    response.assertBodyContains({
      admin: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        type: "organizer",
      },
    });

    // Check DB to ensure the Admin record was created
    const admin = await Admin.findByOrFail("email", payload.email);
    assert.equal(admin.email, payload.email);
    assert.equal(admin.firstName, payload.firstName);
    assert.equal(admin.lastName, payload.lastName);
    assert.equal(admin.type, "organizer");
  });

  test("it should fail if required fields are missing", async ({ client }) => {
    // Omitting email field for instance
    const payload = {
      password: "SuperSecret123",
      firstName: "John",
      lastName: "Doe",
    };

    const response = await client.post("/api/v1/auth/register").json(payload);

    // By default, Vine or any other validator might throw 422 Unprocessable Entity
    response.assertStatus(422);

    // Optional: check error structure depending on your setup
    response.assertBodyContains({
      errors: [
        {
          field: "email",
          // message might vary based on your validator config
        },
      ],
    });
  });

  test("it should fail with invalid email format", async ({ client }) => {
    const payload = {
      email: "not-valid-email",
      password: "SuperSecret123",
      firstName: "John",
      lastName: "Doe",
    };

    const response = await client.post("/api/v1/auth/register").json(payload);

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: "email",
        },
      ],
    });
  });

  test("it should fail if password is too short", async ({ client }) => {
    const payload = {
      email: "shortpass@example.com",
      password: "abc", // < 8 chars
      firstName: "John",
      lastName: "Doe",
    };

    const response = await client.post("/api/v1/auth/register").json(payload);

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: "password",
        },
      ],
    });
  });

  test("it should fail if email already exists", async ({ client }) => {
    const payload = {
      email: "duplicate@example.com",
      password: "SuperSecret123",
      firstName: "John",
      lastName: "Doe",
    };

    // Create an admin in the database first
    await Admin.create({ ...payload, type: "organizer" });

    // Try registering with the same email
    const response = await client.post("/api/v1/auth/register").json(payload);

    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: "email",
        },
      ],
    });
  });
});
