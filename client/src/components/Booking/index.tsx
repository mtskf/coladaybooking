import { useState, useEffect, useRef } from "react";
import { Backdrop, CircularProgress } from '@mui/material';
import { bufferToHex } from "ethereumjs-util";
import { encrypt } from "@metamask/eth-sig-util";
import { add, format } from "date-fns";
import useEth from "../../contexts/EthContext/useEth";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import NewTicketModal from "./NewTicketModal";
import TicketInfoModal from "./TicketInfoModal";
import SlotsTable from "./SlotsTable.jsx";
import SnackBar from "./SnackBar";
import TableReference from "./TableReference";
import rooms from "./RoomNames";
import { Ticket, Slot, Snack } from "types";
import styles from "./styles.module.scss";

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
const decryptedTitlesCache: string[] = [];
let publicKey: Buffer | undefined;

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

const usePrevious = (value: any, initialValue: any) => {
  const ref = useRef(initialValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

function BookingModule () {
  const { state } = useEth()
  const { state: { contract, accounts } } = useEth()

  const [slots, setSlots] = useState<Slot[][]>(DEFAULT_SLOTS);
  const [newTicket, setNewTicket] = useState<Ticket>(DEFAULT_TICKET)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketModalShown, setNewTicketModalShown] = useState(false);
  const [ticketInfoModalShown, setTicketInfoModalShown] = useState(false);
  const [snack, setSnack] = useState<Snack>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getSlots = async () => {
    try {
      const res = await contract.methods.getSlots().call({ from: accounts[0] });

      if (!res || res.status === '0x0') {
        throw new Error('Booking failed');
      }

      const slots = res.map((row: any, i: number) => row.map((val: boolean) => {
        return {
          selected: false,
          disabled: !val,
        }
      }));
      return slots;
    } catch (err) {
      setSnack({ message: 'Error - Failed to retrieve data... Try reloading the page.', type: 'error', isActive: true });
      return;
    }
  }

  const getTickets = async () => {
    try {
      const res = await contract.methods.getTickets().call({ from: accounts[0] })

      if (!res || res.status === '0x0') {
        throw new Error('Faild getting tickets.');
      }

      // filter out deleted events
      const activeTickets = res.filter((ticket: any) => ticket.isActive).map((ticket: any) => {
        const { title, room, isEncrypted } = ticket;
        const id = Number(ticket.id);
        const from = Number(ticket.from);
        const duration = Number(ticket.duration);
        const roomId = ROOM_NAMES.indexOf(room);
        const to = from + duration;
        const date = TOMORROW;
        const decryptedTitle = decryptedTitlesCache[id];
        return { id, title, room, roomId, from, to, duration, date, isEncrypted, decryptedTitle };
      });

      return activeTickets;

    } catch (err) {
      setSnack({ message: 'Error - Failed to retrieve data... Try reloading the page.', type: 'error', isActive: true });
      return;
    }
  }

  const setSlotsAndTickets = (slots: Slot[][], tickets: Ticket[]) => {
    // clear user's tickets data attached to slots
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

    // apply the latest tickets data to the respective slots
    for (const ticket of tickets) {
      const row = ticket.roomId;
      const col = ticket.from - OPEN_AT;
      const duration = ticket.duration;

      for (let i = 0; i < duration; i++) {
        const slot = slots[row][col + i];
        i || (slot.ticket = ticket!);
        // slot.disabled = true;
        slot.booked = true;
      }
    }
    setSlots(slots);
  }

  const loadSlots = async () => {
    // get slots availability data from the blockchain
    const slots = await getSlots();
    const tickets = await getTickets();
    setSlotsAndTickets(slots, tickets);
  }

  const resetSelection = () => {
    // deselect slots
    slots.forEach(room => room.forEach(slot => slot.selected = false));
    setSlots(slots);
  };

  const cancelNewTicket = () => {
    // close the new event modal without saving
    resetSelection();
    setNewTicketModalShown(false);
  }

  const saveTicket = async (ticket: Ticket) => {
    // save the new event to the blockchain

    // show loading spinner
    setIsLoading(true);

    let title = ticket.title;
    const { room, roomId, from, duration, isEncrypted } = ticket;

    // hide modal
    setNewTicketModalShown(false);

    // error handling
    if (!room) {
      cancelNewTicket();
      setSnack({ message: 'Error - Room not found.', type: 'error', isActive: true });
      return;
    }

    // encrypt title if required
    if (isEncrypted) {
      const isPubKeyAvailable = await getPublicKey();
      if (!isPubKeyAvailable) {
        throw new Error('Public key is not available');
      }
      try {
        title = encryptWithPublicKey(publicKey!, title ?? ' ');
      } catch (err) {
        cancelNewTicket();
        setSnack({ message: 'Error - Encryption failded... Try later.', type: 'error', isActive: true });
        return;
      }
    }

    // update slots - add pending ticket
    const row = roomId;
    const col = from - OPEN_AT;
    slots[row][col].ticket = { ...ticket, title };
    for (let i = 0; i < duration; i++) {
      slots[row][col + i].disabled = true;
      slots[row][col + i].booked = true;
    }
    setSlots(slots);

    // hide loading spinner
    setIsLoading(false);

    // send event data to contract
    try {
      const res = await contract.methods.book(title, room, from, duration, isEncrypted).send({ from: accounts[0] })
      if (!res || res.status === '0x0') {
        throw new Error('Booking failed');
      }
    } catch (err) {

      // TODO: remove pending ticket
      if (slots[row][col].ticket.isPending) {
        console.log('deleting pending ticket')
        delete slots[row][col].ticket;
        for (let i = 0; i < duration; i++) {
          slots[row][col + i].disabled = false;
          slots[row][col + i].booked = false;
        }
        setSlots(slots);
      }

      cancelNewTicket();
      setSnack({ message: 'Error - Failed to save... Try later.', type: 'error', isActive: true });
      return;
    }

    // hide loading spinner
    setIsLoading(false);

    // show success message
    setSnack({ message: 'Event saved!', type: 'success', isActive: true });
  }

  const removeTicket = async (ticket: Ticket) => {
    // remove the event from the blockchain

    // hide modal
    setTicketInfoModalShown(false);

    // TODO: make the ticket pending
    ticket.isPending = true;
    setSlots(slots);

    try {
      const res = await contract.methods.removeTicket(ticket.id).send({ from: accounts[0] })
      if (res.status === '0x0') {
        throw new Error('Transaction failed');
      }

      // show success message
      setSnack({ message: 'Event deleted!', type: 'success', isActive: true });

    } catch (err) {
      // clear the pending state of the ticket
      ticket.isPending = false;
      setSlots(slots);

      setSnack({ message: 'Error - Failed to delete event... Try later.', type: 'error', isActive: true });
    }
  }

  const handleSelectSlots = async (slots: any[], selected: any[]) => {
    // when user selects slots, show the new event modal

    setSlots(slots); // update selected slots

    const roomId = selected[0].row;
    const room = ROOM_NAMES[selected[0].row];
    const from = selected[0].column + OPEN_AT;
    const duration = selected.length;
    const to = from + duration;
    const date = TOMORROW;
    setNewTicket({ roomId, room, from, to, duration, date })

    // showDialog
    setNewTicketModalShown(true);
  };

  const handleClickTicket = (e: Event, ticket: Ticket) => {
    // when a ticket is clicked, show the ticket detail
    if (!ticket || ticket.id === undefined) return
    setSelectedTicket(ticket);
    setTicketInfoModalShown(true);
  }

  const getPublicKey = async () => {
    // get public key from MetaMask for encryption
    if (publicKey) return true;

    setIsLoading(true);
    try {
      const keyB64 = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [accounts[0]],
      })
      publicKey = Buffer.from(keyB64, 'base64');
    } catch (err) {
      console.error(err)
      setSnack({ message: 'Error - Please approve the public key access via MetaMask!', type: 'error', isActive: true });
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  }

  const decryptTicketTitle = async (ticket: Ticket) => {
    if (!ticket.isEncrypted || ticket.id === undefined || decryptedTitlesCache[ticket.id]) return;

    await window.ethereum
      .request({
        method: 'eth_decrypt',
        params: [ticket.title, accounts[0]],
      })
      .then((decryptedTitle: string) => {
        decryptedTitlesCache[ticket.id!] = decryptedTitle;
        const slot = slots[ticket.roomId][ticket.from - OPEN_AT]
        slot.ticket.decryptedTitle = decryptedTitle;
        setSelectedTicket(slot.ticket);
        setSlots([...slots]);
      })
      .catch((error: Error) => {
        console.error(error.message)
        setSnack({ message: 'Error - Failed to decrypt... Try later.', type: 'error', isActive: true });
      });
  }

  // when web3 is mounted, initialize data & event listener
  useEffect(() => {
    if (!state.artifact || !state.contract || !accounts || !accounts[0]) {
      return;
    }

    setIsLoading(true);

    // reset slots
    setSlots(DEFAULT_SLOTS);

    // reset publicKey
    publicKey = undefined; // eslint-disable-line

    // reset decrypted titles cache
    decryptedTitlesCache.splice(0, decryptedTitlesCache.length)

    // initial data load
    const initialLoad = async () => {
      setIsLoading(true);
      await loadSlots();
      setIsLoading(false);
    }
    initialLoad();


    // Event listener - when event "Updated" monitored, load data
    contract.events.Updated()
      .on("data", loadSlots)
      .on("error", console.error);

    // remove event listener when unmount
    return () =>
      contract.events.Updated().removeListener("data", loadSlots)

  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  // initial loading
  useEffect(() => {
    setTimeout(() => {
      setIsInitialized(true);
    }, 800);
  }, []);

  const EventTable =
    <>

      <TableReference />

      <SlotsTable
        value={slots}
        rows={ROOM_NAMES.length}
        cols={SLOT_LENGTH}
        maxCols={4}
        colHeader={HOURS}
        rowHeader={ROOM_NAMES}
        onChange={handleSelectSlots}
        onSelectionStart={(event: Event) => console.log("start", event)}
        onInput={(event: Event) => console.log("event", event)}
        onClickTicket={handleClickTicket}
      />


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
        decryptTicketTitle={decryptTicketTitle}
      />

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <SnackBar snack={snack} setSnack={setSnack} />
    </>

  return (
    <div className={styles.bookingModule} data-initialized={isInitialized}>
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            EventTable
      }
    </div>
  )
}

export default BookingModule
