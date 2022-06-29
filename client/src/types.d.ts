declare global {
  interface Window {
    ethereum: any;
  }
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    disabled?: boolean;
  }
}

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
  making?: boolean;
  deleting?: boolean;
}

export interface Snack {
  message?: string;
  type?: string;
  isActive?: boolean;
}