import React from "react"
import { cloneDeep } from "lodash"
import PropTypes from "prop-types"
import styles from "./styles.module.scss"
import Cell from "./Cell"

export default class SlotsTable extends React.Component {
  static propTypes = {
    value: (props) => {
      const error = new Error(
        "Invalid prop `value` supplied to `SlotsTable`. Validation failed."
      )
      if (!Array.isArray(props.value)) {
        return error
      }
      if (props.value.length === 0) {
        return
      }
      const columnCount = props.value[0].length
      for (const row of props.value) {
        if (!Array.isArray(row) || row.length !== columnCount) {
          return error
        }
        for (const cell of row) {
          if (typeof cell.selected !== "boolean" || typeof cell.disabled !== "boolean") {
            return error
          }
        }
      }
    },
    rows: PropTypes.number,
    cols: PropTypes.number,
    maxRows: PropTypes.number,
    maxColumns: PropTypes.number,
    onSelectionStart: PropTypes.func,
    onInput: PropTypes.func,
    onChange: PropTypes.func,
    onClickTicket: PropTypes.func
  };

  static defaultProps = {
    value: [],
    maxRows: Infinity,
    maxColumns: Infinity,
    onSelectionStart: () => { },
    onInput: () => { },
    onChange: () => { },
    onClickTicket: () => { }
  };

  state = {
    selectionStarted: false,
    startRow: null,
    startColumn: null,
    endRow: null,
    endColumn: null,
    addMode: null
  };

  componentDidMount = () => {
    window.addEventListener("mouseup", this.handleTouchEndWindow)
    window.addEventListener("touchend", this.handleTouchEndWindow)
  };

  componentWillUnmount = () => {
    window.removeEventListener("mouseup", this.handleTouchEndWindow)
    window.removeEventListener("touchend", this.handleTouchEndWindow)
  };

  render = () => {
    return (
      <>
        <table className={styles.slotsTable}>
          <thead>{this.renderColHerder()}</thead>
          <tbody>{this.renderRows()}</tbody>
        </table>
      </>
    )
  };

  renderColHerder = () => (
    <tr>
      <th>&nbsp;</th>
      {this.props.colHeader.map((hour, i) => (
        <th key={i}>{hour}</th>
      ))}
    </tr>
  );

  renderRows = () => (
    <>
      {[...Array(this.props.rows)].map((x, i) => (
        <tr key={i}>
          <th>{this.props.rowHeader[i]}</th>
          {[...Array(this.props.cols)].map((x, j) => (
            <Cell
              key={j}
              onTouchStart={this.handleTouchStartCell}
              onTouchMove={this.handleTouchMoveCell}
              selected={this.props.value[i][j].selected}
              disabled={this.props.value[i][j].disabled}
              booked={this.props.value[i][j].booked}
              ticket={this.props.value[i][j].ticket}
              hasChild={this.props.value[i][j].ticket && true}
              selecting={this.isCellSelecting(i, j)}
              onClickTicket={this.props.onClickTicket}
              decrypted={this.props.value[i][j].ticket?.decryptedTitle}
            />
          ))}
        </tr>
      ))}
    </>
  );

  handleTouchStartCell = (e) => {
    const isLeftClick = e.button === 0
    const isTouch = e.type !== "mousedown"
    if (!this.state.selectionStarted && (isLeftClick || isTouch)) {
      e.preventDefault()
      const { row, column } = eventToCellLocation(e)
      this.props.onSelectionStart({ row, column })
      this.setState({
        selectionStarted: true,
        startRow: row,
        startColumn: column,
        endRow: row,
        endColumn: column,
        addMode: !this.props.value[row][column].selected
      })
    }
  };

  handleTouchMoveCell = (e) => {
    if (this.state.selectionStarted) {
      e.preventDefault()
      const { row, column } = eventToCellLocation(e)
      const { startRow, startColumn, endRow, endColumn } = this.state

      if (endRow !== row || endColumn !== column) {
        const nextRowCount =
          startRow === null && endRow === null
            ? 0
            : Math.abs(row - startRow) + 1
        const nextColumnCount =
          startColumn === null && endColumn === null
            ? 0
            : Math.abs(column - startColumn) + 1

        if (nextRowCount <= this.props.maxRows) {
          this.setState({ endRow: row })
        }

        if (nextColumnCount <= this.props.maxColumns) {
          this.setState({ endColumn: column })
        }
      }
    }
  };

  handleTouchEndWindow = (e) => {
    const isLeftClick = e.button === 0
    const isTouch = e.type !== "mousedown"
    if (this.state.selectionStarted && (isLeftClick || isTouch)) {
      const value = cloneDeep(this.props.value)
      const minRow = Math.min(this.state.startRow, this.state.endRow)
      const maxRow = Math.max(this.state.startRow, this.state.endRow)
      const selected = []
      for (let row = minRow; row <= maxRow; row++) {
        const minColumn = Math.min(
          this.state.startColumn,
          this.state.endColumn
        )
        const maxColumn = Math.max(
          this.state.startColumn,
          this.state.endColumn
        )
        for (let column = minColumn; column <= maxColumn; column++) {
          value[row][column].selected = this.state.addMode
          selected.push({ row, column })
        }
      }
      this.setState({ selectionStarted: false })
      this.props.onChange(value, selected)
    }
  };

  isCellSelecting = (row, column) => {
    const minRow = Math.min(this.state.startRow, this.state.endRow)
    const maxRow = Math.max(this.state.startRow, this.state.endRow)
    const minColumn = Math.min(this.state.startColumn, this.state.endColumn)
    const maxColumn = Math.max(this.state.startColumn, this.state.endColumn)

    return (
      this.state.selectionStarted &&
      row >= minRow &&
      row <= maxRow &&
      column >= minColumn &&
      column <= maxColumn
    )
  };
}

const eventToCellLocation = (e) => {
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
