import { useState, useEffect } from "react";
// import { cloneDeep } from "lodash";
import useEth from "../../contexts/EthContext/useEth";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import TicketModal from "./TicketModal";
import TableDragSelect from "./TableDragSelect";
import rooms from "./RoomNames";
import { add, format } from "date-fns";
import { Ticket, Slot } from "types";
import styles from "./styles.module.scss";

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

function Demo () {
  const { state } = useEth()
  const { state: { contract, accounts } } = useEth()

  const [newEventModalShown, setNewEventModalShown] = useState(false);
  const cancelNewEvent = () => {
    resetSelection();
    setNewEventModalShown(false);
  }

  const [slots, setSlots] = useState<Slot[][]>([...Array(ROOM_NAMES.length)].map(() => [...Array(SLOT_LENGTH)].map((x) => {
    return {
      selected: false,
      disabled: false,
    }
  })));

  const [newTicket, setNewTicket] = useState<Ticket>({
    roomId: 0,
    room: "",
    from: 0,
    to: 0,
    duration: 0,
    date: "",
  })

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

  const getTickets = async () => {
    // TODO: use try catch to handle error
    const res = await contract.methods.getTickets().call({ from: accounts[0] })

    if (!res || !res.length) return [];

    const activeTickets = res.filter((item: any) => item.isActive).map((item: any) => {
      const { id, title, room, from, duration } = item;
      const roomId = ROOM_NAMES.indexOf(room);
      const to = from + duration;
      const date = TOMORROW;
      return { id, title, room, roomId, from, to, duration, date };
    });

    return activeTickets;
  }

  const setTicketsToSlots = (slots: Slot[][], tickets: Ticket[]) => {
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
    return slots;
  }

  const loadSlots = async () => {
    const slots = await getSlots();
    const tickets = await getTickets();
    const slotsWithTickets = setTicketsToSlots(slots, tickets);
    setSlots(slotsWithTickets);
  }

  // when web3 is mounted, load data and set event listener
  useEffect(() => {
    if (!contract) return;

    // initial data load
    loadSlots();

    // Event listener - when event "Updated" monitored, load data
    contract.events.Updated()
      .on("data", loadSlots)
      .on("error", console.error);

    // remove event listener when unmount
    return () =>
      contract.events.Updated().removeListener("data", loadSlots)

  }, [contract]); // eslint-disable-line react-hooks/exhaustive-deps


  const bookRoom = async (title: string) => {
    setNewEventModalShown(false);
    resetSelection();
    const { roomId, room, from, duration } = newTicket;
    try {
      const res = await contract.methods.bookRoom(title, room, from, duration).send({ from: accounts[0] })
      if (res.status === '0x0') {
        throw new Error('Transaction failed');
      }
    } catch {
      // TODO: error handling
    }
    // TODO: error handling

    // update slots
    const row = roomId;
    const col = from - OPEN_AT;
    slots[row][col].ticket = { title, ...newTicket };
    for (let i = 0; i < duration; i++) {
      slots[row][col + i].disabled = true;
      slots[row][col + i].booked = true;
    }
    setSlots(slots);

    // if success, update slots
    // loadSlots();
  }

  const handleSelectSlots = async (slots: any[], selected: any[]) => {
    setSlots(slots)

    const roomId = selected[0].row;
    const room = ROOM_NAMES[selected[0].row];
    const from = selected[0].column + OPEN_AT;
    const duration = selected.length;
    const to = from + duration;
    const date = TOMORROW;

    setNewTicket({ roomId, room, from, to, duration, date })

    // showDialog
    setNewEventModalShown(true);
  };

  const resetSelection = () => {
    const newSlots = slots.map(row => row.map(slot => {
      return {
        ...slot,
        selected: false
      };
    }));
    setSlots(newSlots);
  };

  const demo =
    <>
      <h1>COKE ROOMS {TOMORROW}</h1>
      <div className={styles.tableContainer}>
        <TableDragSelect
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
        />

      </div>


      <TicketModal
        isActive={newEventModalShown}
        cancel={cancelNewEvent}
        newTicket={newTicket}
        save={bookRoom}
      />

    </>

  return (
    <div className="demo">
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            demo
      }
    </div>
  )
}

export default Demo
