import Admin from "#models/admin";
import { loginValidator, registerAdminValidator } from "#validators/auth";
import type { HttpContext } from "@adonisjs/core/http";
import assert from "node:assert";

export default class AuthController {
  /**
   * @register
   * @operationId registerAdmin
   * @description Enables registration of admin. After registration admin is logged in and bearer token is generated.
   * @tag auth
   * @requestBody <registerAdminValidator>
   * @responseBody 200 - {"admin": "<Admin>", "token": "oat_Mw.YUxCZHV2Y0ZjNzJKcU5LejV0Q241V0JDUm83QlspsRENDZU9qT"}
   * @responseBody 422 - {"errors":[ { "message": "First name field is required", "field": "firstName" }]}
   */
  async register({ request }: HttpContext) {
    const data = await request.validateUsing(registerAdminValidator);
    const admin = await Admin.create({ type: "organizer", ...data });
    const token = await Admin.accessTokens.create(admin);

    assert(token.value !== undefined, "Token value is missing");

    return {
      admin,
      token: token.value.release(),
    };
  }

  /**
   * @login
   * @operationId loginAdmin
   * @description Enables login. Default method is token authorization. Support rememberMe functionality. If rememberMe is set to true then token expires in 30 days, otherwise in 24h.
   * @tag auth
   * @requestBody <loginValidator>
   * @responseBody 200 - {"admin": "<Admin>", "token": "oat_Mw.YUxCZHV2Y0ZjNzJKcU5LejV0Q241V0JDUm83QlspsRENDZU9qT"}
   * @responseBody 400 - {"errors":[ { "message": "Invalid user credentials" }]}
   * @responseBody 422 - {"errors":[ { "message": "Password field is required", "field": "password" }]}
   */
  async login({ request }: HttpContext) {
    const { email, password, rememberMe } =
      await request.validateUsing(loginValidator);

    const admin = await Admin.verifyCredentials(email, password);
    const token = await Admin.accessTokens.create(admin, [], {
      expiresIn: rememberMe === true ? "30 days" : "1 day",
    });

    assert(token.value !== undefined, "Token value is missing");

    return {
      admin,
      token: token.value.release(),
    };
  }

  /**
   * @me
   * @operationId authenticatedAdmin
   * @description Returns information about logged in admin. If request not authorized returns error.
   * @tag auth
   * @responseBody 200 - <Admin>
   * @responseBody 400 - {"errors":[ { "message": "Unauthorized access" }]}
   */
  async me({ auth }: HttpContext) {
    return auth.getUserOrFail();
  }
}
