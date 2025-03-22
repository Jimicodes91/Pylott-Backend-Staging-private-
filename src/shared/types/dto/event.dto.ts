export type EventDto = {
  event_type_id: string;
  name: string;
  start_datetime: string;
  end_datetime: string;
  venue: string;
  description: string;
  invites: Array<string>;
};
