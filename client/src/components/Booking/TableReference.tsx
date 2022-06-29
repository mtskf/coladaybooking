import styles from "./styles.module.scss";

function TableReference () {

  // const update
  return (
    <ul className={styles.tableReference}>
      <li data-type="ticket">Your events</li>
      <li data-type="pending">Pending events</li>
      <li data-type="disabled">Not available</li>
    </ul >

  )
}

export default TableReference
