import { useRef, useState, useEffect } from "react"
import { Switch, FormControlLabel } from '@mui/material/';
import { EnhancedEncryption, NoEncryption } from '@mui/icons-material';
import { Ticket } from 'types';
import styles from "./styles.module.scss";

interface PropType {
  isActive: boolean;
  cancel: any;
  newTicket: Ticket;
  saveTicket: any;
  getPublicKey: any;
}


function NewTicketModal ({ isActive, cancel, newTicket, saveTicket, getPublicKey }: PropType) {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const titleInputRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  const submit = (e: React.FormEvent<HTMLFormElement> | KeyboardEvent) => {
    e.preventDefault();
    const title = titleInputRef.current.value;
    saveTicket({ ...newTicket, title, isEncrypted: isEncrypting });
  }

  const cancelHandler = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    cancel();
  };

  // reset title & encryption switch when modal is shown
  useEffect(() => {
    if (!isActive) return;

    titleInputRef.current.value = "New event";
    titleInputRef.current.select();

    const keyDownHandler = (e: KeyboardEvent) => {
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
      titleInputRef.current.removeEventListener('keydown', keyDownHandler); // eslint-disable-line
    };
  }, [isActive]); // eslint-disable-line


  const handleSwitch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    setIsEncrypting(isChecked);

    if (isChecked) {
      const isPubKeyAvailable = await getPublicKey();
      if (!isPubKeyAvailable) {
        event.target.checked = false;
        setIsEncrypting(false);
      }
    }
  };

  // const update
  return (
    <div className={styles.modal} data-active={isActive}>
      <div className={styles.modalBg} onClick={cancelHandler}></div>
      <div className={styles.modalContent}>
        <div className={styles.modalIcon} data-encryption={isEncrypting}>
          {isEncrypting
            ? <EnhancedEncryption />
            : <NoEncryption />
          }
        </div>
        <form onSubmit={submit}>

          <label htmlFor="">Event title:</label>
          <input type="text" id="eventTitle" ref={titleInputRef} placeholder="Enter title..." />

          <small>{newTicket.date}&nbsp;&nbsp;{newTicket.from}:00 to {newTicket.to}:00&nbsp;&nbsp;&nbsp;&nbsp;Room {newTicket.room}</small>

          <FormControlLabel
            control={
              <Switch checked={isEncrypting} onChange={handleSwitch} name="encrypt" />
            }
            label="Encrypt title with your public key"
            className={styles.customSwitch}
            data-switch={isEncrypting}
          />

          <div className="buttons">
            <button className="button is-simple is-rounded" onClick={cancelHandler} tabIndex={-1}>Dismiss</button>
            <button className="button is-primary is-rounded" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div >

  )
}

export default NewTicketModal
