import { useState, useEffect } from "react";
import useEth from "../../contexts/EthContext/useEth";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import NewTicketModal from "./NewTicketModal";
import TicketInfoModal from "./TicketInfoModal";
import SlotsTable from "./SlotsTable";
import rooms from "./RoomNames";
import { add, format } from "date-fns";
import { Ticket, Slot, Snack } from "types";
import styles from "./styles.module.scss";
import { SnackBar } from "./SnackBar";

import { bufferToHex } from "ethereumjs-util";
import { encrypt } from "@metamask/eth-sig-util";


declare global {
  interface Window {
    ethereum: any;
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    disabled?: boolean;
  }
}

const OPEN_AT = 8;
const CLOSE_AT = 18;
const SLOT_LENGTH = CLOSE_AT - OPEN_AT;
const HOURS = [...Array(SLOT_LENGTH)].map((x, i) => `${i + OPEN_AT}:00`);
const ROOM_NAMES = rooms;
const TOMORROW = format(add(new Date(), { days: 1 }), 'd MMM, yyyy');
const DEFAULT_SLOTS = [...Array(ROOM_NAMES.length)].map(() => [...Array(SLOT_LENGTH)].map((x) => {
  return { selected: false, disabled: false }
}))
const DEFAULT_TICKET = { roomId: 0, room: "", from: 0, to: 0, duration: 0, date: "", }

const encryptWithPublicKey = (publicKey: Buffer, message: string) => {
  return bufferToHex(
    Buffer.from(
      JSON.stringify(
        encrypt({
          publicKey: publicKey.toString('base64'),
          data: message,
          version: 'x25519-xsalsa20-poly1305',
        })
      ),
      'utf8'
    )
  );
}


function Demo () {
  const { state } = useEth()
  const { state: { contract, accounts } } = useEth()
  const [slots, setSlots] = useState<Slot[][]>(DEFAULT_SLOTS);
  const [newTicket, setNewTicket] = useState<Ticket>(DEFAULT_TICKET)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketModalShown, setNewTicketModalShown] = useState(false);
  const [ticketInfoModalShown, setTicketInfoModalShown] = useState(false);
  const [snack, setSnack] = useState<Snack>({});
  const [publicKey, setPublicKey] = useState<Buffer | undefined>();

  const getSlots = async () => {
    // TODO: use try catch to handle error
    const res = await contract.methods.getSlots().call({ from: accounts[0] })
    const slots = res.map((row: any, i: number) => row.map((val: boolean) => {
      return {
        selected: false,
        disabled: !val,
      }
    }));
    return slots;
  }

  const getTickets = async (): Promise<Ticket[]> => {
    // TODO: use try catch to handle error
    const res = await contract.methods.getTickets().call({ from: accounts[0] })

    if (!res || !res.length) return [];

    const activeTickets = res.filter((item: any) => item.isActive).map((item: any) => {
      const { title, room, isEncrypted } = item;

      // await window.ethereum
      //   .request({
      //     method: 'eth_decrypt',
      //     params: [encryptedTitle, accounts[0]],
      //   })
      //   .then((decryptedMessage: string) => {
      //     console.log('The decrypted message is:', decryptedMessage)
      //     title = decryptedMessage;
      //   })
      //   .catch((error: Error) => console.log(error.message));

      const id = Number(item.id);
      const from = Number(item.from);
      const duration = Number(item.duration);
      const roomId = ROOM_NAMES.indexOf(room);
      const to = from + duration;
      const date = TOMORROW;
      return { id, title, room, roomId, from, to, duration, date, isEncrypted };
    });

    return activeTickets;
  }

  const setSlotsAndTickets = (slots: Slot[][], tickets: Ticket[]) => {
    // clear user's tickets data from slots
    for (const row of slots) {
      for (const slot of row) {
        if (slot.booked) {
          slot.booked = false;
          if (slot.ticket) {
            delete slot.ticket;
          }
        }
      }
    }
    // apply new ticket data to slots
    for (const ticket of tickets) {
      const row = ticket.roomId;
      const col = ticket.from - OPEN_AT;

      for (let i = 0; i < ticket.duration; i++) {
        const slot = slots[row][col + i];
        i || (slot.ticket = ticket!);
        slot.disabled = true;
        slot.booked = true;
      }
    }
    setSlots(slots);
  }

  const loadSlots = async () => {
    const slots = await getSlots();
    const tickets = await getTickets();
    setSlotsAndTickets(slots, tickets);
  }

  const cancelNewTicket = () => {
    resetSelection();
    setNewTicketModalShown(false);
  }

  const saveTicket = async (title: string, isEncrypting: boolean) => {
    setNewTicketModalShown(false);
    resetSelection();
    if (newTicket.room === "") {
      console.error('error')
      return;
    }
    const { roomId, room, from, duration } = newTicket;

    if (isEncrypting) {
      try {
        title = encryptWithPublicKey(publicKey!, title);
      } catch (err) {
        setSnack({ message: 'Error - Failed to encrypt... Try later.', type: 'error', isActive: true });
        return;
      }
    }

    const isEncrypted = isEncrypting;

    try {
      const res = await contract.methods.book(title, room, from, duration, isEncrypted).send({ from: accounts[0] })
      if (res.status === '0x0') {
        throw new Error('Transaction failed');
      }
    } catch {
      // TODO: error handling
      return;
    }
    // TODO: error handling

    // update slots
    const row = roomId;
    const col = from - OPEN_AT;
    slots[row][col].ticket = { title, ...newTicket, isEncrypted };
    for (let i = 0; i < duration; i++) {
      slots[row][col + i].disabled = true;
      slots[row][col + i].booked = true;
    }
    setSlots(slots);

    // show success message
    setSnack({ message: 'Saved', type: 'success', isActive: true });
  }

  const removeTicket = async (ticket: Ticket) => {
    try {
      const res = await contract.methods.removeTicket(ticket.id).send({ from: accounts[0] })
      if (res.status === '0x0') {
        throw new Error('Transaction failed');
      }
    } catch {
      // TODO: error handling
      return;
    }

    // update slots
    const row = ticket.roomId;
    const col = ticket.from - OPEN_AT;
    for (let i = 0; i < ticket.duration; i++) {
      slots[row][col + i].disabled = false;
      slots[row][col + i].booked = false;
    }
    delete slots[row][col].ticket;
    setSlots(slots);

    // close modal
    setTicketInfoModalShown(false);
    if (selectedTicket) setSelectedTicket(null);

    // show success message
    setSnack({ message: 'Event deleted!', type: 'success', isActive: true });
  }

  const handleSelectSlots = async (slots: any[], selected: any[]) => {
    setSlots(slots); // update selected slots

    const roomId = selected[0].row;
    const room = ROOM_NAMES[selected[0].row];
    const from = selected[0].column + OPEN_AT;
    const duration = selected.length;
    const to = from + duration;
    const date = TOMORROW;
    const isEncrypted = false;

    setNewTicket({ roomId, room, from, to, duration, date, isEncrypted })

    // showDialog
    setNewTicketModalShown(true);
  };

  const resetSelection = () => {
    const newSlots = slots.map(row => row.map(slot => {
      return { ...slot, selected: false };
    }));
    setSlots(newSlots);
  };

  const handleClickTicket = (e: Event, ticket: Ticket) => {
    if (!ticket || ticket.id === undefined) return
    setSelectedTicket(ticket);
    setTicketInfoModalShown(true);
  }

  const getPublicKey = async () => {
    if (publicKey) return true;

    try {
      const keyB64 = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [accounts[0]],
      })
      setPublicKey(Buffer.from(keyB64, 'base64'));
    } catch (err) {
      console.error(err)
      setSnack({ message: 'Error - Please approve the public key access via MetaMask!', type: 'error', isActive: true });
      return false;
    }

    return true;
  }

  // when web3 is mounted, load data and set event listener
  useEffect(() => {
    if (!accounts || !accounts[0]) return;

    // reset publicKey
    setPublicKey(undefined);

    // initial data load
    loadSlots();

    // Event listener - when event "Updated" monitored, load data
    contract.events.Updated()
      .on("data", loadSlots)
      .on("error", console.error);

    // remove event listener when unmount
    return () =>
      contract.events.Updated().removeListener("data", loadSlots)

  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventTable =
    <>
      <h1>COKE ROOMS {TOMORROW}</h1>
      <div className={styles.tableContainer}>
        <SlotsTable
          value={slots}
          rows={ROOM_NAMES.length}
          cols={SLOT_LENGTH}
          maxRows={1}
          maxColumns={4}
          colHeader={HOURS}
          rowHeader={ROOM_NAMES}
          onChange={handleSelectSlots}
          onSelectionStart={(event: Event) => console.log("start", event)}
          onInput={(event: Event) => console.log("event", event)}
          onClickTicket={handleClickTicket}
        />
      </div>

      <NewTicketModal
        isActive={newTicketModalShown}
        cancel={cancelNewTicket}
        newTicket={newTicket}
        save={saveTicket}
        getPublicKey={getPublicKey}
      />

      <TicketInfoModal
        isActive={ticketInfoModalShown}
        ticket={selectedTicket}
        remove={removeTicket}
        close={() => setTicketInfoModalShown(false)}
      />

      <SnackBar snack={snack} setSnack={setSnack} />
    </>

  return (
    <div className="demo">
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            eventTable
      }
    </div>
  )
}

export default Demo
