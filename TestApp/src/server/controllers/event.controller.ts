import {
  Controller,
  Get,
  ControllerBase,
  Post,
  type Context,
} from "fornaxjs/server";
import { Event } from "../models/event";

@Controller("/events")
export class EventController extends ControllerBase {
  @Post("/", { body: Event }, Event)
  async createEvent(ctx: Context) {
    const body = await ctx.req.json();
    return this.Ok(ctx, body);
  }

  @Get("/:id", { params: Number }, Event)
  async getEvent(ctx: Context) {
    const id = ctx.req.param("id");
    return this.Ok(ctx, {
      id,
      name: "Fornax Launch Party",
      startTime: "2023-12-21T15:30:00Z",
      attendees: 50,
    });
  }
}
