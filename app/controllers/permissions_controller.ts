import Permission from "#models/permission";
import {
  createPermissionValidator,
  updatePermissionValidator,
} from "#validators/permission_validators";
import type { HttpContext } from "@adonisjs/core/http";

export default class PermissionsController {
  /**
   * @index
   * @operationId getPermissions
   * @description Returns an array of all permissions
   * @tag permissions
   * @responseBody 200 - <Permission[]>
   */
  async index({ response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    return await Permission.all();
  }

  /**
   * @store
   * @operationId createPermission
   * @description Creates a permission
   * @tag permissions
   * @requestBody <createPermissionValidator>
   */
  async store({ request, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    const newPermissionData = await createPermissionValidator.validate(
      request.body(),
    );

    const newPermission = await Permission.create(newPermissionData);

    return response
      .header("Location", `/api/v1/permissions/${newPermission.id}`)
      .created();
  }

  /**
   * @show
   * @operationId getPermission
   * @description Returns a permission
   * @tag permissions
   * @responseBody 200 - <Permission>
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async show({ params, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    return Permission.findOrFail(params.id);
  }

  /**
   * @update
   * @operationId updateAdmin
   * @description Updates permission
   * @tag permissions
   * @requestBody <updatePermissionValidator>
   * @responseBody 200 - <Permission>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    const permissionUpdates = await updatePermissionValidator.validate(
      request.body(),
    );

    const permission = await Permission.findOrFail(params.id);
    permission.merge(permissionUpdates);

    return await permission.save();
  }

  /**
   * @destroy
   * @operationId deletePermission
   * @description Deletes a permission
   * @tag permissions
   * @responseBody 204 - {}
   */
  async destroy({ params, response, auth }: HttpContext) {
    if (auth.getUserOrFail().type !== "superadmin") {
      response.unauthorized();
    }

    const permissionToDelete = await Permission.findOrFail(params.id);
    await permissionToDelete.delete();
    return response.noContent();
  }
}
