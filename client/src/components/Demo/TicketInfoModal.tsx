import { useEffect } from "react"
import { Ticket } from 'types';
import styles from "./styles.module.scss";

interface PropType {
  isActive: boolean;
  ticket: Ticket | null;
  remove: any;
  close: any;
}

function TicketInfoModal ({ isActive, ticket, remove, close }: PropType) {

  useEffect(() => {
    if (!isActive) return;

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => document.removeEventListener('keydown', keyDownHandler);

  }, [isActive]);  // eslint-disable-line react-hooks/exhaustive-deps

  // const update
  return (
    <div className={styles.modal} data-active={isActive}>
      <div className={styles.modalBg} onClick={close}></div>
      <div className={styles.modalContent}>

        <label htmlFor="">Event title:</label>
        <h3>{ticket?.title}</h3>
        <small>{ticket?.date}&nbsp;&nbsp;{ticket?.from}:00 to {ticket?.to}:00&nbsp;&nbsp;&nbsp;&nbsp;Room {ticket?.room}</small>

        <div className="buttons">
          <button className="button is-cancel is-rounded" onClick={close}>Dismiss</button>
          <button className="button is-primary is-rounded" onClick={() => remove(ticket)}>Delete booking</button>
        </div>

      </div>
    </div >

  )
}

export default TicketInfoModal
