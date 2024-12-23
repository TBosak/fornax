import { OpenAPIHono } from "@hono/zod-openapi";

export class ControllerBase extends OpenAPIHono {
  constructor() {
    super(); // Call the base class (Hono) constructor
  }

  Ok(c: any, data: any) {
    return c.json(data, 200);
  }

  BadRequest(c: any, message: string = "Bad Request") {
    return c.json({ error: message }, 400);
  }

  NotFound(c: any, message: string = "Not Found") {
    return c.json({ error: message }, 404);
  }

  InternalServerError(c: any, message: string = "Internal Server Error") {
    return c.json({ error: message }, 500);
  }
}
