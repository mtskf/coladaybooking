import { useEffect, useMemo, useRef } from "react";
import styles from "./styles.module.scss"
import { Ticket } from "types";
import TicketItem from "./TicketItem"

interface PropsType {
  key: number;
  selected: boolean;
  disabled: boolean;
  selecting: boolean;
  booked: boolean;
  making: boolean;
  deleting: boolean;
  ticket?: Ticket;
  decrypted: boolean;
  onTouchStart: any;
  onTouchMove: any;
  onClickTicket: any;
}


function Cell ({ ...props }: PropsType) {

  const nextProps = useMemo<PropsType>(() => {
    return { ...props }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selecting, props.selected, props.disabled, props.decrypted, props.booked, props.making, props.deleting])

  const tdRef = useRef<HTMLTableCellElement>(null);

  const handleTouchStart = (e: any) => {
    if (!nextProps.disabled) {
      nextProps.onTouchStart(e)
    }
  };

  const handleTouchMove = (e: any) => {
    if (!nextProps.disabled) {
      nextProps.onTouchMove(e)
    }
  };

  useEffect(() => {
    tdRef.current?.addEventListener("touchstart", handleTouchStart, {
      passive: false
    })
    tdRef.current?.addEventListener("touchmove", handleTouchMove, {
      passive: false
    })

    return () => {
      tdRef.current?.removeEventListener("touchstart", handleTouchStart);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      tdRef.current?.removeEventListener("touchmove", handleTouchMove);
    }
  }, []);  // eslint-disable-line

  const classNames = useMemo(() => {
    const classNames = []
    if (props.ticket) {
      classNames.push(styles.hasTicket)
    }

    if (props.booked) {
      classNames.push(styles.booked)
    } else if (props.making) {
      classNames.push(styles.making);
    } else if (props.making) {
      classNames.push(styles.deleting);
    }

    if (props.disabled) {
      classNames.push(styles.disabled)
    } else {
      classNames.push(styles.enabled)
      if (props.selected) {
        classNames.push(styles.selected)
      }
      if (props.selecting) {
        classNames.push(styles.selecting)
      }
    }

    return classNames;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selecting, props.selected, props.disabled, props.decrypted, props.booked, props.making, props.deleting])

  return (
    <td
      ref={tdRef}
      className={classNames.join(' ')}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
    >
      {nextProps.ticket && <TicketItem isPending={nextProps.making || nextProps.deleting} ticket={nextProps.ticket!} onClickTicket={nextProps.onClickTicket} />}
      <p>{ }</p>
    </td>
  );
}


export default Cell;
