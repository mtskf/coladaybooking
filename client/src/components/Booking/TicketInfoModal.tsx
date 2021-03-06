import { useEffect } from "react"
import { VpnKey, Lock, LockOpen, NoEncryption, DeleteForever } from '@mui/icons-material';
import { Ticket } from 'types';
import styles from "./styles.module.scss";

interface PropsType {
  isActive: boolean;
  ticket: Ticket | null;
  deleteTicket: any;
  close: any;
  decryptTicketTitle: any;
}

function TicketInfoModal ({ isActive, ticket, deleteTicket, close, decryptTicketTitle }: PropsType) {

  useEffect(() => {
    if (!isActive) return;

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => document.removeEventListener('keydown', keyDownHandler);

  }, [isActive]);  // eslint-disable-line

  const decrypt = () => {
    decryptTicketTitle(ticket);
  }

  // const update
  return ticket && (
    <div className={styles.modal} data-active={isActive}>
      <div className={styles.modalBg} onClick={close}></div>
      <div className={styles.modalContent}>
        <div className={styles.modalIcon} data-encryption={ticket.isEncrypted}>
          {ticket.decryptedTitle
            ? <LockOpen />
            : ticket.isEncrypted
              ? <Lock />
              : <NoEncryption />
          }
        </div>

        {ticket.decryptedTitle
          ? <h3>{ticket.decryptedTitle}</h3>
          : ticket.isEncrypted
            ? <div onClick={decrypt} className={styles.decryptTitle}>
              <div>
                <span><VpnKey />Decrypt title</span>
              </div>
              <p>{ticket.title}</p>
            </div>
            : <h3>{ticket.title}</h3>
        }
        <small>{ticket.date}&nbsp;&nbsp;{ticket.from}:00 to {ticket.to}:00&nbsp;&nbsp;&nbsp;&nbsp;Room {ticket.room}</small>

        <div className="buttons">
          <button className="button is-simple is-rounded" onClick={() => deleteTicket(ticket)}><DeleteForever />Delete</button>
          <button className="button is-primary is-rounded" onClick={close}>OK</button>
        </div>

      </div>
    </div >

  )
}

export default TicketInfoModal
