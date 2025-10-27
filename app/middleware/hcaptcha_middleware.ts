import { verifyHCaptcha } from "@solvro/hcaptcha";
import type { hCaptchaResponse } from "@solvro/hcaptcha";

import { Exception } from "@adonisjs/core/exceptions";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

import env from "#start/env";

interface CtxNoToken {
  /**
   * True if the request contained a captcha token
   */
  tokenReceived: false;
  /**
   * True if the token sent in the request was valid
   */
  tokenValid: false;
}

interface CtxHasToken {
  /**
   * True if the request contained a captcha token
   */
  tokenReceived: true;
  /**
   * True if the token sent in the request was valid
   */
  tokenValid: boolean;
  /**
   * Data returned by the hCaptcha validation API for the received token
   */
  validationResult: hCaptchaResponse;
}

declare module "@adonisjs/core/http" {
  interface HttpContext {
    hCaptcha?: CtxNoToken | CtxHasToken;
  }
}

interface HCaptchaMiddlewareOptions {
  /**
   * If true, this middleware will terminate requests that do not contain the token field in the request body
   * Default: false
   */
  requireToken: boolean;
  /**
   * If true, this middleware will terminate requests that contain invalid/expired captcha tokens
   * Default: false
   */
  requirePass: boolean;
  /**
   * Request field name to expect to contain a captcha token
   * Default: "hCaptchaToken"
   */
  captchaFieldName: string;
  /**
   * List of HTTP methods to exempt from captcha validation
   * Method names in this list must be uppercase
   *
   * Default: []
   */
  skipMethods: string[];
}

// in case someone wanted to bring @solvro/error-handling to this project
class SensitiveError extends Exception {
  sensitive = true;
}

async function doCaptchaValidation(
  ctx: HttpContext,
  options: HCaptchaMiddlewareOptions,
) {
  // try to extract token
  const token: unknown = ctx.request.body()[options.captchaFieldName];

  if (typeof token !== "string") {
    // no token found
    if (options.requireToken) {
      throw new SensitiveError("No hCaptcha token found in request", {
        status: 400,
      });
    }
    ctx.hCaptcha = {
      tokenReceived: false,
      tokenValid: false,
    };
    return;
  }

  // validate token (wrapping errors in sensitive error)
  try {
    const response = await verifyHCaptcha({
      response: token,
      secret: env.get("HCAPTCHA_SECRET"),
      sitekey: env.get("HCAPTCHA_SITEKEY"),
      remoteip: ctx.request.ip(),
    });
    ctx.hCaptcha = {
      tokenReceived: true,
      tokenValid: response.success,
      validationResult: response,
    };
  } catch (e) {
    throw new SensitiveError("Failed to verify hCaptcha token", { cause: e });
  }

  if (options.requirePass && !ctx.hCaptcha.tokenValid) {
    throw new SensitiveError("Invalid captcha token", { status: 403 });
  }
}

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: Partial<HCaptchaMiddlewareOptions> = {},
  ) {
    const fullOptions: HCaptchaMiddlewareOptions = {
      requireToken: false,
      requirePass: false,
      captchaFieldName: "hCaptchaToken",
      skipMethods: [],
      ...options,
    };
    if (!fullOptions.skipMethods.includes(ctx.request.method().toUpperCase())) {
      await doCaptchaValidation(ctx, fullOptions);
    }
    return next();
  }
}
