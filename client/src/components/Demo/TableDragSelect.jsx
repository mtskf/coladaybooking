import React from "react"
import { cloneDeep } from "lodash"
import PropTypes from "prop-types"
import styles from "./styles.module.scss"

export default class TableDragSelect extends React.Component {
  static propTypes = {
    value: (props) => {
      const error = new Error(
        "Invalid prop `value` supplied to `TableDragSelect`. Validation failed."
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
    onChange: PropTypes.func
  };

  static defaultProps = {
    value: [],
    maxRows: Infinity,
    maxColumns: Infinity,
    onSelectionStart: () => { },
    onInput: () => { },
    onChange: () => { }
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
      <table className={styles.tableDragSelect}>
        <thead>{this.renderColHerder()}</thead>
        <tbody>{this.renderRows()}</tbody>
      </table>
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
              beingSelected={this.isCellBeingSelected(i, j)}
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

  isCellBeingSelected = (row, column) => {
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

class Cell extends React.Component {
  shouldComponentUpdate = (nextProps) =>
    this.props.beingSelected !== nextProps.beingSelected ||
    this.props.selected !== nextProps.selected || this.props.disabled !== nextProps.disabled;

  componentDidMount = () => {
    this.td.addEventListener("touchstart", this.handleTouchStart, {
      passive: false
    })
    this.td.addEventListener("touchmove", this.handleTouchMove, {
      passive: false
    })
  };

  componentWillUnmount = () => {
    this.td.removeEventListener("touchstart", this.handleTouchStart)
    this.td.removeEventListener("touchmove", this.handleTouchMove)
  };

  render = () => {
    const classNames = []
    let {
      disabled,
      booked,
      hasChild,
      ticket,
      beingSelected,
      selected,
      onTouchStart,
      onTouchMove,
      ...props
    } = this.props
    if (booked) {
      classNames.push(styles.booked)
      if (hasChild) {
        classNames.push(styles.hasChild)
      }
    } else if (disabled) {
      classNames.push(styles.disabled)
    } else {
      classNames.push(styles.enabled)
      if (selected) {
        classNames.push(styles.selected)
      }
      if (beingSelected) {
        classNames.push(styles.selecting)
      }
    }
    return (
      <td
        ref={(td) => (this.td = td)}
        className={classNames.join(' ')}
        onMouseDown={this.handleTouchStart}
        onMouseMove={this.handleTouchMove}
        key={props.key}
        {...props}
      >
        {this.props.hasChild && <Ticket ticket={ticket} />}
      </td>
    )
  };

  handleTouchStart = (e) => {
    if (!this.props.disabled) {
      this.props.onTouchStart(e)
    }
  };

  handleTouchMove = (e) => {
    if (!this.props.disabled) {
      this.props.onTouchMove(e)
    }
  };
}

class Ticket extends React.Component {

  render = () => {
    const handleClick = () => {
      if (ticket.id === undefined) return
      // TODO: tap to show detail, delete option
      console.log('Ticket clicked: ', ticket)
    }
    let { ticket } = this.props

    return (
      <div
        className={styles.ticket}
        data-duration={ticket.duration}
        onClick={e => handleClick(e, ticket)}
        style={{ width: `calc(${ticket.duration}00% + ${ticket.duration - 5}px)` }}
      >
        <small>{ticket.from}:00</small>
        <span>{ticket.title}</span>
      </div>
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
