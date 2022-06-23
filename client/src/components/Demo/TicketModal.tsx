import { useRef, useEffect, useCallback } from "react"
import { Ticket } from 'types';
import styles from "./styles.module.scss";

interface PropType {
  isActive: boolean;
  cancel: any;
  newTicket: Ticket;
  save: any;
}

function TicketModal ({ isActive, cancel, newTicket, save }: PropType) {

  const titleInputRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  // reset title when modal is shown
  useEffect(() => {
    if (!isActive) return;
    titleInputRef.current.value = "New event";
    titleInputRef.current.select();
  }, [isActive]);

  const submit = useCallback((e: React.FormEvent<HTMLFormElement> | KeyboardEvent) => {
    e.preventDefault();
    const title = titleInputRef.current.value;
    console.log('title', title);
    save(title);
  }, [save]);

  const cancelHandler = useCallback((e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    cancel();
  }, [cancel]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      console.log(e.key);
      if (e.key === 'Enter') {
        e.preventDefault();
        submit(e);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel(e);
      }
    };

    titleInputRef.current.addEventListener('keydown', keyDownHandler);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      titleInputRef.current.removeEventListener('keydown', keyDownHandler);
    };
  }, [submit, cancel]);

  // const update
  return (
    <div className={styles.modal} data-active={isActive}>
      <div className={styles.modalBg} onClick={cancelHandler}></div>
      <div className={styles.modalContent}>
        <form onSubmit={submit}>
          <label htmlFor="">Event title:</label>
          <input type="text" id="eventTitle" ref={titleInputRef} placeholder="Enter title..." />

          <small>{newTicket.date}&nbsp;&nbsp;{newTicket.from}:00 to {newTicket.to}:00&nbsp;&nbsp;&nbsp;&nbsp;Room {newTicket.room}</small>

          <div className="buttons">
            <button className="button is-cancel is-rounded" onClick={cancelHandler} tabIndex={-1}>Dismiss</button>
            <button className="button is-primary is-rounded" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div >

  )
}

export default TicketModal
