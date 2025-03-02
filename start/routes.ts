import AutoSwagger from "adonis-autoswagger";

import router from "@adonisjs/core/services/router";

import swagger from "#config/swagger";

import { middleware } from "./kernel.js";

const AttributesController = () => import("#controllers/attributes_controller");
const BlocksController = () => import("#controllers/blocks_controller");
const EventController = () => import("#controllers/events_controller");
const ParticipantsController = () =>
  import("#controllers/participants_controller");
const AuthController = () => import("#controllers/auth_controller");
const PermissionsController = () =>
  import("#controllers/permissions_controller");
const AdminsController = () => import("#controllers/admins_controller");
const OrganizersController = () => import("#controllers/organizers_controller");
const FormsController = () => import("#controllers/forms_controller");
const EmailsController = () => import("#controllers/emails_controller");
const EventImportController = () =>
  import("#controllers/event_import_controller");
const EventExportController = () =>
  import("#controllers/event_export_controller");
const PublicParticipantsController = () =>
  import("#controllers/public_participants_controller");

router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});
router.get("/docs", async () => {
  return AutoSwagger.default.scalar("/swagger");
});

router
  .group(() => {
    router
      .get("events/:eventSlug", [EventController, "publicShow"])
      .where("eventSlug", router.matchers.slug());
    router
      .group(() => {
        router
          .get("participants/:participantSlug", [
            PublicParticipantsController,
            "index",
          ])
          .as("publicParticipants");
      })
      .prefix("events/:eventSlug")
      .where("eventSlug", router.matchers.slug())
      .use(middleware.participantAuth());

    router
      .group(() => {
        router.resource("admins", AdminsController).apiOnly();
        router.resource("events", EventController).apiOnly();
        router.resource("permissions", PermissionsController).apiOnly();

        router
          .group(() => {
            router.resource("attributes", AttributesController).apiOnly();
            router.resource("blocks", BlocksController).apiOnly();
            router.resource("emails", EmailsController).apiOnly();
            router.resource("forms", FormsController).apiOnly();
            router.resource("organizers", OrganizersController).apiOnly();
            // Participants/export and participants/import must be defined before the resource route
            // Otherwise, the words "export" and "import" will be treated as ids
            router.get("participants/export", [EventExportController]);
            router.post("participants/import", [EventImportController]);
            router.resource("participants", ParticipantsController).apiOnly();
          })
          .prefix("events/:eventId");
      })
      .use(middleware.auth());

    router
      .group(() => {
        router.post("forms/:id/submit", [FormsController, "submitForm"]);
      })
      .prefix("events/:eventSlug")
      .where("eventSlug", router.matchers.slug());

    router
      .group(() => {
        router.post("login", [AuthController, "login"]);
        router.post("register", [AuthController, "register"]);
        router.get("me", [AuthController, "me"]).use(middleware.auth());
      })
      .prefix("auth");
  })
  .prefix("api/v1");
