import type { HttpContext } from "@adonisjs/core/http";

import Permission from "#models/permission";
import {
  createPermissionValidator,
  updatePermissionValidator,
} from "#validators/permission_validators";

export default class PermissionsController {
  /**
   * @index
   * @operationId getPermissions
   * @description Returns an array of all permissions
   * @tag permissions
   * @responseBody 200 - <Permission[]>
   */
  async index() {
    return await Permission.all();
  }

  /**
   * @store
   * @operationId createPermission
   * @description Creates a permission
   * @tag permissions
   * @requestBody <createPermissionValidator>
   */
  async store({ request, response }: HttpContext) {
    const newPermissionData = await createPermissionValidator.validate(
      request.body(),
    );

    const newPermission = await Permission.create(newPermissionData);

    return response
      .header("Location", `/api/v1/permissions/${newPermission.uuid}`)
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
  async show({ params }: HttpContext) {
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
  async update({ params, request }: HttpContext) {
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
  async destroy({ params, response }: HttpContext) {
    const permissionToDelete = await Permission.findOrFail(params.id);
    await permissionToDelete.delete();
    return response.noContent();
  }
}
