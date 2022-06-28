import styles from "./styles.module.scss";

function TableReference () {

  // const update
  return (
    <ul className={styles.tableReference}>
      <li data-type="disabled">Not available</li>
      <li data-type="ticket">Your bookings</li>
    </ul >

  )
}

export default TableReference
