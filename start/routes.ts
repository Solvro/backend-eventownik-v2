import AutoSwagger from "adonis-autoswagger";

import router from "@adonisjs/core/services/router";

import swagger from "#config/swagger";

import { middleware } from "./kernel.js";

// const BlocksController = () => import("#controllers/blocks_controller");
const EventController = () => import("#controllers/events_controller");
// const ParticipantsController = () => import("#controllers/participants_controller");
const AuthController = () => import("#controllers/auth_controller");
// const PermissionsController = () => import("#controllers/permissions_controller");
// const AdminsController = () => import("#controllers/admins_controller");
// const OrganizersController = () => import("#controllers/organizers_controller");
const FormsController = () => import("#controllers/forms_controller");
//const EmailsController = () => import("#controllers/emails_controller");

router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});
router.get("/docs", async () => {
  return AutoSwagger.default.scalar("/swagger");
});

router
  .group(() => {
    router
      .group(() => {
        router
          .group(() => {
            // router.resource("participants", ParticipantsController).apiOnly();
            router.resource("forms", FormsController).apiOnly();

            //router.resource("permissions", PermissionsController);
            //router.resource("admins", AdminsController);
            //router.resource("organizers", OrganizersController);
            //router.resource("blocks", BlocksController);
            //router.resource("emails", EmailsController);
          })
          .prefix("events/:eventId");

        router.resource("events", EventController).apiOnly();
      })
      .use(middleware.auth());

    router
      .group(() => {
        router.post("login", [AuthController, "login"]);
        router.post("register", [AuthController, "register"]);
        router.get("me", [AuthController, "me"]).use(middleware.auth());
      })
      .prefix("auth");
  })
  .prefix("api/v1");