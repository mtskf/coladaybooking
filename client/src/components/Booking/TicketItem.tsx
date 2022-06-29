import styles from "./styles.module.scss"
import { Lock, LockOpen, Autorenew } from '@mui/icons-material'
import { Ticket } from "types";

interface PropsType {
  ticket: Ticket;
  onClickTicket: any;
}

function TicketItem ({ ticket, onClickTicket }: PropsType) {

  return (
    <div
      className={styles.ticket}
      data-duration={ticket.duration}
      data-encrypted={ticket.isEncrypted}
      data-pending={ticket.isPending}
      onClick={e => onClickTicket(e, ticket)}
      style={{ width: `calc(${ticket.duration}00% + ${ticket.duration - 5}px)` }}
    >
      <div className={styles.ticketIcon}>
        {ticket.isPending && <Autorenew />}
        {
          ticket.decryptedTitle
            ? <LockOpen />
            : ticket.isEncrypted && <Lock />
        }
      </div>
      <small>{ticket.from}:00</small>
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
