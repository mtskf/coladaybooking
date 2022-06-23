export interface Ticket {
  id?: number;
  title?: string;
  roomId: number;
  room: string;
  from: number;
  to: number;
  duration: number;
  date: string;
}

interface BookedEvent {
  title: string;
  roomName: string;
  timeFrom: number;
  duration: number;
  user: string;
}

export interface Slot {
  selected: boolean;
  disabled: boolean;
  booked?: boolean;
  ticket?: Booking;
}