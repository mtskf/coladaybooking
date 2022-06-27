import { useState, useEffect } from "react";
import { cloneDeep } from "lodash"
import styles from "./styles.module.scss"
import Cell from "./Cell"
import { Slot } from "types";

interface PropsType {
  value: Slot[][];
  rows: number;
  cols: number;
  maxRows: number;
  maxCols: number;
  colHeader: string[];
  rowHeader: string[];
  onChange: any;
  onClickTicket: any;
  onSelectionStart?: any;
  onInput?: any
}

function SlotsTable (props: PropsType) {

  const [state, setState] = useState<{
    selectionStarted: boolean;
    startRow: number | null;
    startColumn: number | null;
    endRow: number | null;
    endColumn: number | null;
    addMode: boolean | null;
  }>({
    selectionStarted: false,
    startRow: null,
    startColumn: null,
    endRow: null,
    endColumn: null,
    addMode: null
  });

  useEffect(() => {
    window.addEventListener("mouseup", handleTouchEndWindow)
    window.addEventListener("touchend", handleTouchEndWindow)

    return () => {
      window.removeEventListener("mouseup", handleTouchEndWindow)
      window.removeEventListener("touchend", handleTouchEndWindow)
    }
  }, []); // eslint-disable-line

  const handleTouchStartCell = (e: any) => {
    const isLeftClick = e.button === 0
    const isTouch = e.type !== "mousedown"
    if (!state.selectionStarted && (isLeftClick || isTouch)) {
      e.preventDefault()
      const { row, column } = eventToCellLocation(e)
      props.onSelectionStart({ row, column })
      setState({
        selectionStarted: true,
        startRow: row,
        startColumn: column,
        endRow: row,
        endColumn: column,
        addMode: !props.value[row][column].selected
      })
    }
  };

  const handleTouchMoveCell = (e: any) => {
    if (state.selectionStarted) {
      e.preventDefault()
      const { row, column } = eventToCellLocation(e)
      const { startRow, startColumn, endRow, endColumn } = state

      if (endRow !== row || endColumn !== column) {
        const nextRowCount =
          startRow === null && endRow === null
            ? 0
            : Math.abs(row - (startRow ?? 0)) + 1
        const nextColumnCount =
          startColumn === null && endColumn === null
            ? 0
            : Math.abs(column - (startColumn ?? 0)) + 1

        if (nextRowCount <= props.maxRows) {
          state.endRow = row;
          setState({ ...state })
        }

        if (nextColumnCount <= props.maxCols) {
          state.endColumn = column;
          setState({ ...state })
        }
      }
    }
  };

  const handleTouchEndWindow = (e: any) => {
    const isLeftClick = e.button === 0
    const isTouch = e.type !== "mousedown"
    if (state.selectionStarted && (isLeftClick || isTouch)) {
      const value = cloneDeep(props.value)
      const minRow = Math.min(state.startRow!, state.endRow!)
      const maxRow = Math.max(state.startRow!, state.endRow!)
      const selected = []
      for (let row = minRow; row <= maxRow; row++) {
        const minColumn = Math.min(
          state.startColumn!,
          state.endColumn!
        )
        const maxColumn = Math.max(
          state.startColumn!,
          state.endColumn!
        )
        for (let column = minColumn; column <= maxColumn; column++) {
          value[row][column].selected = state.addMode ?? false
          selected.push({ row, column })
        }
      }
      state.selectionStarted = false;
      setState({ ...state })
      props.onChange(value, selected)
    }
  };

  const isCellSelecting = (row: number, column: number) => {
    const minRow = Math.min(state.startRow!, state.endRow!)
    const maxRow = Math.max(state.startRow!, state.endRow!)
    const minColumn = Math.min(state.startColumn!, state.endColumn!)
    const maxColumn = Math.max(state.startColumn!, state.endColumn!)

    return (
      state.selectionStarted &&
      row >= minRow &&
      row <= maxRow &&
      column >= minColumn &&
      column <= maxColumn
    )
  };


  const renderColHerder = () => (
    <tr>
      <th>&nbsp;</th>
      {props.colHeader.map((hour, i) => (
        <th key={i}>{hour}</th>
      ))}
    </tr>
  );

  const renderRows = () => (
    <>
      {[...Array(props.rows)].map((x, i) => (
        <tr key={i}>
          <th>{props.rowHeader[i]}</th>
          {[...Array(props.cols)].map((x, j) => (
            <Cell
              key={j}
              onTouchStart={handleTouchStartCell}
              onTouchMove={handleTouchMoveCell}
              selected={props.value[i][j].selected}
              disabled={props.value[i][j].disabled}
              booked={props.value[i][j].booked ?? false}
              ticket={props.value[i][j].ticket}
              hasChild={props.value[i][j].ticket && true}
              selecting={isCellSelecting(i, j)}
              onClickTicket={props.onClickTicket}
              decrypted={props.value[i][j].ticket?.decryptedTitle}
            />
          ))}
        </tr>
      ))}
    </>
  );



  return (
    <>
      <table className={styles.slotsTable}>
        <thead>{renderColHerder()}</thead>
        <tbody>{renderRows()}</tbody>
      </table>
    </>
  )



}

const eventToCellLocation = (e: any) => {
  let target

  if (e.touches) {
    const touch = e.touches[0]
    target = document.elementFromPoint(touch.clientX, touch.clientY)
  } else {
    target = e.target
    while (target.tagName !== "TD") {
      target = target.parentNode
    }
  }

  return {
    row: target.parentNode.rowIndex - 1, // -1: except header
    column: target.cellIndex - 1         // -1: except header
  }
}

export default SlotsTable