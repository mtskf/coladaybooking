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
  isPending?: boolean;
}

export interface Slot {
  selected: boolean;
  disabled: boolean;
  booked?: boolean;
  isPending?: boolean;
  ticket?: Booking;
}

export interface Snack {
  message?: string;
  type?: string;
  isActive?: boolean;
}