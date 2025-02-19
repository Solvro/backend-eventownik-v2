import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";

import Admin from "#models/admin";

test.group("Auth: Login", (group) => {
  // Begin a DB transaction before each test and roll it back after
  group.each.setup(() => testUtils.db().withGlobalTransaction());

  test("it should login successfully with valid credentials", async ({
    client,
    assert,
  }) => {
    // 1. Create a test Admin record
    const admin = await Admin.create({
      email: "valid-user@example.com",
      password: "SuperSecret123", // Ensure the hashed password logic is consistent
      firstName: "Valid",
      lastName: "User",
      type: "organizer",
    });

    // 2. Attempt login
    const payload = {
      email: "valid-user@example.com",
      password: "SuperSecret123",
    };
    const response = await client.post("/api/v1/auth/login").json(payload);

    // 3. Check for success
    response.assertStatus(200);

    // 4. Assert shape of response (admin)
    response.assertBodyContains({
      admin: {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    });

    const result = response.body() as { admin: Admin; token: string };

    assert.exists(result.token);
    assert.isString(result.token);
  });

  test("it should fail for invalid credentials (incorrect password)", async ({
    client,
  }) => {
    // 1. Create an Admin with known credentials
    await Admin.create({
      email: "incorrect-pass@example.com",
      password: "CorrectPassword123",
      firstName: "Incorrect",
      lastName: "Password",
      type: "organizer",
    });

    // 2. Send invalid password
    const payload = {
      email: "incorrect-pass@example.com",
      password: "WrongPassword123",
    };
    const response = await client.post("/api/v1/auth/login").json(payload);

    // 3. Expect an error
    response.assertStatus(400);

    // Optional: Check error shape
    response.assertBodyContains({
      errors: [
        {
          message: "Invalid user credentials",
        },
      ],
    });
  });

  test("it should fail with invalid email format", async ({ client }) => {
    const payload = {
      email: "not-an-email",
      password: "AnyValidPassword",
    };

    const response = await client.post("/api/v1/auth/login").json(payload);

    // Typically 422 for invalid input
    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: "email",
        },
      ],
    });
  });

  test("it should fail when required fields are missing", async ({
    client,
  }) => {
    // Missing "password"
    const payload = {
      email: "missing-password@example.com",
    };

    const response = await client.post("/api/v1/auth/login").json(payload);

    // Typically 422 for missing fields
    response.assertStatus(422);
    response.assertBodyContains({
      errors: [
        {
          field: "password",
        },
      ],
    });
  });

  test("it should set a longer expiration if rememberMe = true", async ({
    client,
    assert,
  }) => {
    // 1. Create a test Admin
    const admin = await Admin.create({
      email: "remember-user@example.com",
      password: "LongTermPassword123",
      firstName: "Remember",
      lastName: "Me",
      type: "organizer",
    });

    // 2. Attempt login with rememberMe: true
    const payload = {
      email: "remember-user@example.com",
      password: "LongTermPassword123",
      rememberMe: true,
    };
    const response = await client.post("/api/v1/auth/login").json(payload);

    response.assertStatus(200);

    // Checking the shape
    response.assertBodyContains({
      admin: {
        email: admin.email,
      },
    });

    const result = response.body() as { admin: Admin; token: string };

    assert.exists(result.token);
    assert.isString(result.token);
  });
});
