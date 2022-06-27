export interface Ticket {
  id?: number;
  title?: string;
  roomId: number;
  room: string;
  from: number;
  to: number;
  duration: number;
  date: string;
  isEncrypted?: boolean;
  decryptedTitle?: string;
}

export interface Slot {
  selected: boolean;
  disabled: boolean;
  booked?: boolean;
  ticket?: Booking;
}

export interface Snack {
  message?: string;
  type?: string;
  isActive?: boolean;
}