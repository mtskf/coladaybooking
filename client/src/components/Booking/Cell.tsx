import { useEffect, useMemo, useRef } from "react";
import styles from "./styles.module.scss"
import { Ticket } from "types";
import TicketBox from "./TicketBox"

interface PropsType {
  key: number;
  selected: boolean;
  disabled: boolean;
  selecting: boolean;
  booked: boolean;
  ticket?: Ticket;
  hasChild: boolean;
  decrypted: boolean;
  onTouchStart: any;
  onTouchMove: any;
  onClickTicket: any;
}


function Cell ({ ...props }: PropsType) {

  const nextProps = useMemo<PropsType>(() => {
    return { ...props }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selecting, props.selected, props.disabled, props.decrypted])

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
  }, [props.selecting, props.selected, props.disabled, props.decrypted]);  // eslint-disable-line

  const classNames = useMemo(() => {
    const classNames = []

    if (props.booked) {
      classNames.push(styles.booked)
      if (props.hasChild) {
        classNames.push(styles.hasChild)
      }
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
  }, [props.selecting, props.selected, props.disabled, props.decrypted])

  return (
    <td
      ref={tdRef}
      className={classNames.join(' ')}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
    >
      {nextProps.hasChild && <TicketBox ticket={nextProps.ticket!} onClickTicket={nextProps.onClickTicket} />}
      <p>{ }</p>
    </td>
  );
}


export default Cell;
