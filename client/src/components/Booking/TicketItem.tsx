import styles from "./styles.module.scss"
import { Lock, LockOpen, Autorenew } from '@mui/icons-material'
import { Ticket } from "types";

interface PropsType {
  ticket: Ticket;
  isPending: boolean;
  onClickTicket: any;
}

function TicketItem ({ ticket, isPending, onClickTicket }: PropsType) {

  return (
    <div
      className={styles.ticket}
      data-duration={ticket.duration}
      data-encrypted={ticket.isEncrypted}
      data-pending={isPending}
      onClick={e => onClickTicket(e, ticket)}
      style={{ width: `calc(${ticket.duration}00% + ${ticket.duration - 5}px)` }}
    >
      <div className={styles.ticketIcon}>
        {isPending && <Autorenew className={styles.rotating} />}
        {
          ticket.decryptedTitle
            ? <LockOpen />
            : ticket.isEncrypted && <Lock />
        }
      </div>
      <small>{ticket.from}:00{ticket.duration > 1 && ` - ${ticket.to}:00`}</small>
      {ticket.decryptedTitle
        ? <span>{ticket.decryptedTitle}</span>
        : ticket.isEncrypted
          ? <span>******</span>
          : <span>{ticket.title}</span>
      }
    </div>
  )
}


export default TicketItem;
