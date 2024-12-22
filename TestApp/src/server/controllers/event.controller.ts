import { Controller, Get, ControllerBase, Post } from "fornaxjs/server";
import { Event } from "../models/event";

@Controller("/events")
export class EventController extends ControllerBase {
  @Post("/", {}, Event)
  async createEvent(ctx: any) {
    const event = ctx.req.valid("json");
    return this.Ok(ctx, event);
  }

  @Get("/{id}", { params: Event }, Event)
  async getEvent(ctx: any) {
    const { id } = ctx.req.valid("param");
    return this.Ok(ctx, {
      id,
      name: "Fornax Launch Party",
      startTime: "2023-12-21T15:30:00Z",
      attendees: 50,
    });
  }
}
