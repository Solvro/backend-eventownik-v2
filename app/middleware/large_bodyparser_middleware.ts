import { inject } from "@adonisjs/core";
import BodyParserMiddleware from "@adonisjs/core/bodyparser_middleware";

import config from "#config/bodyparser";

@inject()
export default class LargeBodyParserMiddleware extends BodyParserMiddleware {
  constructor() {
    super({
      ...config,
      json: {
        ...config.json,
        limit: "20mb",
      },
      multipart: {
        ...config.multipart,
        limit: "20mb",
      },
    });
  }
}
