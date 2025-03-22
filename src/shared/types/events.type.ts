export type CreateCalenderEvent = {
  summary: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
};

export type EventOrganizer = {
  email: string;
  displayName: string;
};
