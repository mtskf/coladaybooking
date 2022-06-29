import { useState, useEffect } from "react";
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
import { cloneDeep } from "lodash";

const OPEN_AT = 8;
const CLOSE_AT = 18;
const SLOT_LENGTH = CLOSE_AT - OPEN_AT;
const HOURS = [...Array(SLOT_LENGTH)].map((x, i) => `${i + OPEN_AT}:00`);
const ROOM_NAMES = rooms;
const TOMORROW = format(add(new Date(), { days: 1 }), 'd MMM, yyyy');
const DEFAULT_SLOTS = [...Array(ROOM_NAMES.length)].map(() => [...Array(SLOT_LENGTH)].map((x) => {
  return { selected: false, disabled: false, booked: false, making: false, deleting: false, decrypted: false };
}))
const DEFAULT_TICKET = { roomId: 0, room: "", from: 0, to: 0, duration: 0, date: "", }
const decryptedTitlesCache: string[] = [];
let publicKey: Buffer | undefined;
const slotsCache: Slot[][] = DEFAULT_SLOTS;

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

  const updateSlots = () => {
    setSlots(cloneDeep(slotsCache));
  }
  const getSlots = async () => {
    try {
      const res = await contract.methods.getSlots().call({ from: accounts[0] });

      if (!res || res.status === '0x0') {
        throw new Error('Booking failed');
      }

      res.forEach((room: any, row: number) =>
        room.forEach((isAvailable: boolean, col: number) => {
          slotsCache[row][col].disabled = !isAvailable;
        })
      );

      updateSlots();
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
      const activeTickets = res.filter((ticket: any) =>
        ticket.isActive).map((ticket: any) => {
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

      // clear user's tickets data attached to slotsCache
      for (const row of slotsCache) {
        for (const slot of row) {
          if (slot.booked && !slot.making && !slot.deleting) {
            slot.booked = false;
            delete slot.ticket;
          }
        }
      }

      // apply the latest tickets data to the respective slotsCache
      for (const ticket of activeTickets) {
        const row = ticket.roomId;
        const col = ticket.from - OPEN_AT;
        const duration = ticket.duration;

        for (let i = 0; i < duration; i++) {
          const slot = slotsCache[row][col + i];
          if (!slot.deleting) {
            i === 0 && (slot.ticket = ticket!);
            slot.booked = true;
            slot.making = false;
          }
        }
      }

      updateSlots();

    } catch (err) {
      setSnack({ message: 'Error - Failed to retrieve data... Try reloading the page.', type: 'error', isActive: true });
      return;
    }
  }

  const loadSlots = async () => {
    await getSlots();
    await getTickets();
  }

  const resetSelection = () => {
    // deselect slots
    slotsCache.forEach(room => room.forEach(slot => slot.selected = false));
    updateSlots();
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

    const { title, room, roomId, from, duration, isEncrypted } = ticket;

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
        ticket.title = encryptWithPublicKey(publicKey!, title ?? ' ');
      } catch (err) {
        cancelNewTicket();
        setSnack({ message: 'Error - Encryption failded... Try later.', type: 'error', isActive: true });
        return;
      }
    }

    // update slots - add pending ticket
    const row = roomId;
    const col = from - OPEN_AT;
    slotsCache[row][col].ticket = ticket;
    for (let i = 0; i < duration; i++) {
      slotsCache[row][col + i].making = true;
    }
    updateSlots();

    // hide loading spinner
    setIsLoading(false);

    // send event data to contract
    try {
      const res = await contract.methods.book(ticket.title, room, from, duration, isEncrypted).send({ from: accounts[0] })
      if (!res || res.status === '0x0') {
        throw new Error('Booking failed');
      }
    } catch (err) {

      // TODO: remove pending ticket
      if (slotsCache[row][col].making) {
        delete slotsCache[row][col].ticket;
        for (let i = 0; i < duration; i++) {
          slotsCache[row][col + i].making = false;
        }
        updateSlots();
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

  const deleteTicket = async (ticket: Ticket) => {

    const row = ticket.roomId;
    const col = ticket.from - OPEN_AT;
    const duration = ticket.duration;

    // hide modal
    setTicketInfoModalShown(false);

    // TODO: make the ticket pending
    for (let i = 0; i < duration; i++) {
      slotsCache[row][col + i].deleting = true;
    }
    updateSlots();

    try {
      // remove the event from the blockchain
      const res = await contract.methods.deleteTicket(ticket.id).send({ from: accounts[0] })

      if (res.status === '0x0') {
        throw new Error('Transaction failed');
      }

      delete slotsCache[row][col].ticket;
      for (let i = 0; i < duration; i++) {
        slotsCache[row][col + i].deleting = false;
      }
      updateSlots();

      // show success message
      setSnack({ message: 'Event deleted!', type: 'success', isActive: true });

    } catch (err) {
      console.log('error', err)
      // clear the pending state of the ticket
      for (let i = 0; i < duration; i++) {
        slotsCache[row][col + i].deleting = false;
      }
      updateSlots();
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

    setIsLoading(true);

    await window.ethereum
      .request({
        method: 'eth_decrypt',
        params: [ticket.title, accounts[0]],
      })
      .then((decryptedTitle: string) => {
        decryptedTitlesCache[ticket.id!] = decryptedTitle;
        const slot = slotsCache[ticket.roomId][ticket.from - OPEN_AT]
        slot.ticket.decryptedTitle = decryptedTitle;
        setSelectedTicket(slot.ticket);
        setSlots(slotsCache);
        setIsLoading(false);
      })
      .catch((error: Error) => {
        setIsLoading(false);
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
        saveTicket={saveTicket}
        getPublicKey={getPublicKey}
      />

      <TicketInfoModal
        isActive={ticketInfoModalShown}
        ticket={selectedTicket}
        deleteTicket={deleteTicket}
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
