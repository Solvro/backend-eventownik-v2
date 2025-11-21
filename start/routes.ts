import AutoSwagger from "adonis-autoswagger";

import router from "@adonisjs/core/services/router";

import swagger from "#config/swagger";

import { middleware } from "./kernel.js";

const AttributesController = () => import("#controllers/attributes_controller");
const BlocksController = () => import("#controllers/blocks_controller");
const EventController = () => import("#controllers/events_controller");
const ParticipantsController = () =>
  import("#controllers/participants_controller");
const ParticipantsAttributesController = () =>
  import("#controllers/participants_attributes_controller");
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
    router.get("events/public", [EventController, "publicIndex"]);
    router
      .group(() => {
        router
          .resource("admins", AdminsController)
          .params({
            admins: "uuid",
          })
          .apiOnly();
        router
          .resource("events", EventController)
          .params({
            events: "uuid",
          })
          .apiOnly();
        router.put("events/:uuid/activate", [EventController, "toggleActive"]);
        router
          .resource("permissions", PermissionsController)
          .params({
            permissions: "uuid",
          })
          .apiOnly();

        router
          .group(() => {
            router
              .resource("attributes", AttributesController)
              .params({
                attributes: "uuid",
              })
              .apiOnly();
            router
              .group(() => {
                router
                  .resource("blocks", BlocksController)
                  .params({
                    blocks: "uuid",
                  })
                  .apiOnly();
                router.put("bulk-update", [
                  ParticipantsAttributesController,
                  "bulkUpdate",
                ]);
              })
              .prefix("attributes/:attributeUuid");
            router
              .resource("emails", EmailsController)
              .params({
                emails: "uuid",
              })
              .apiOnly();
            router.post("emails/send/:emailUuid", [EmailsController, "send"]);
            router.post("emails/duplicate/:emailUuid", [
              EmailsController,
              "duplicate",
            ]);
            router
              .resource("forms", FormsController)
              .params({
                forms: "uuid",
              })
              .apiOnly();
            router
              .resource("organizers", OrganizersController)
              .params({
                organizers: "uuid",
              })
              .apiOnly();
            // Participants/export and participants/import must be defined before the resource route
            // Otherwise, the words "export" and "import" will be treated as ids
            router.get("participants/export", [EventExportController]);
            router.post("participants/import", [EventImportController]);
            router.get(
              "participants/:participantUuid/attributes/:attributeUuid",
              [ParticipantsAttributesController, "downloadFile"],
            );
            router.delete("participants", [
              ParticipantsController,
              "unregisterMany",
            ]);
            router
              .resource("participants", ParticipantsController)
              .params({
                participants: "uuid",
              })
              .apiOnly();
          })
          .prefix("events/:eventUuid")
          .where("eventUuid", router.matchers.number());
      })
      .use(middleware.auth());

    router
      .group(() => {
        router.get("attributes/:attributeUuid/blocks", [
          BlocksController,
          "publicIndex",
        ]);
        router.get("public", [EventController, "publicShow"]);
        router
          .get("forms/:formSlug", [FormsController, "showBySlug"])
          .where("formSlug", router.matchers.slug());
        router
          .group(() => {
            router
              .get("participants/:participantSlug", [
                PublicParticipantsController,
                "index",
              ])
              .as("publicParticipants");
          })
          .use(middleware.participantAuth());

        router.post("forms/:uuid/submit", [FormsController, "submitForm"]);
        router
          .delete("participants/:participantSlug", [
            ParticipantsController,
            "unregister",
          ])
          .where("participantSlug", router.matchers.slug());
      })
      .prefix("events/:eventSlug")
      .where("eventSlug", router.matchers.slug());

    router
      .group(() => {
        router.post("login", [AuthController, "login"]);
        router.post("register", [AuthController, "register"]);
        router.get("me", [AuthController, "me"]).use(middleware.auth());
        router.post("sendPasswordResetToken", [
          AuthController,
          "sendPasswordResetToken",
        ]);
        router.post("resetPassword", [AuthController, "resetPassword"]);
      })
      .prefix("auth");
  })
  .prefix("api/v1");
