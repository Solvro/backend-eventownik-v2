import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import Admin from "#models/admin";
import { AdminService } from "#services/admin_service";
import {
  createAdminValidator,
  updateAdminValidator,
} from "#validators/admin_validators";

@inject()
export default class AdminsController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private adminService: AdminService) {}

  /**
   * @index
   * @operationId getAdmins
   * @description Returns an array of all admins
   * @tag admins
   * @responseBody 200 - <Admin[]>
   */
  async index({ response, auth }: HttpContext) {
    const admin = auth.getUserOrFail();
    if (admin.type !== "superadmin") {
      response.unauthorized();
    }

    return await Admin.query().preload("events").preload("permissions");
  }

  /**
   * @store
   * @operationId createAdmin
   * @description Creates an admin
   * @tag admins
   * @requestBody <createAdminValidator>
   */
  async store({ request, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail();
    if (admin.type !== "superadmin") {
      response.unauthorized();
    }

    const newAdminData = await createAdminValidator.validate(request.body());

    const newAdmin = await this.adminService.createAdmin(newAdminData);

    return response
      .header("Location", `/api/v1/admins/${newAdmin.id}`)
      .created();
  }

  /**
   * @show
   * @operationId getAdmin
   * @description Returns an admin
   * @tag admins
   * @responseBody 200 - <Admin>
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async show({ params, response, auth }: HttpContext) {
    const admin = auth.getUserOrFail();
    if (admin.type !== "superadmin") {
      response.unauthorized();
    }

    return await Admin.query()
      .where("id", +params.id)
      .preload("events")
      .preload("permissions")
      .firstOrFail();
  }

  /**
   * @update
   * @operationId updateAdmin
   * @description Updates admin details
   * @tag admins
   * @responseBody 200 - <Admin>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    const adminUpdates = await updateAdminValidator.validate(request.body());

    const admin = await Admin.findOrFail(params.id);

    if (adminUpdates === undefined) {
      return admin;
    }

    const updatedAdmin = await this.adminService.updateAdmin(
      +params.id,
      adminUpdates,
    );

    return updatedAdmin;
  }

  /**
   * @destroy
   * @operationId deleteAdmin
   * @description Deletes an admin
   * @tag admins
   * @responseBody 204 - {}
   */
  async destroy({ params, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    await this.adminService.deleteAdmin(+params.id);
    return response.noContent();
  }
}
