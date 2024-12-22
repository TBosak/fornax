import { Context } from "hono";

export class ControllerBase {
  /**
   * Sends a successful response with a 200 status code.
   * @param ctx - Hono Context
   * @param data - Data to send in the response
   */
  Ok(ctx: Context, data: any) {
    return ctx.json(data, 200);
  }

  /**
   * Sends a 404 Not Found response.
   * @param ctx - Hono Context
   * @param message - Custom not found message
   */
  NotFound(ctx: Context, message: string = "Not Found") {
    return ctx.json({ error: message }, 404);
  }

  /**
   * Sends a 400 Bad Request response.
   * @param ctx - Hono Context
   * @param message - Custom bad request message
   */
  BadRequest(ctx: Context, message: string = "Bad Request") {
    return ctx.json({ error: message }, 400);
  }

  /**
   * Sends a 401 Unauthorized response.
   * @param ctx - Hono Context
   * @param message - Custom unauthorized message
   */
  Unauthorized(ctx: Context, message: string = "Unauthorized") {
    return ctx.json({ error: message }, 401);
  }

  /**
   * Sends a 403 Forbidden response.
   * @param ctx - Hono Context
   * @param message - Custom forbidden message
   */
  Forbidden(ctx: Context, message: string = "Forbidden") {
    return ctx.json({ error: message }, 403);
  }
}
