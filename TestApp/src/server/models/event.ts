import {
  Model,
  String,
  Number,
  ISODate,
  OptionalISODate,
} from "fornaxjs/server";

@Model()
export class Event {
  @String({ example: "1", description: "Unique identifier for the event" })
  id!: string;

  @String({ example: "Fornax Launch Party", description: "Event name" })
  name!: string;

  @ISODate({
    example: "2023-12-21T15:30:00Z",
    description: "Event start date and time",
  })
  startTime!: string;

  @OptionalISODate({
    example: "2023-12-22T15:30:00Z",
    description: "Event end date and time",
  })
  endTime?: string;

  @Number({ example: 50, description: "Number of attendees expected" })
  attendees!: number;
}
