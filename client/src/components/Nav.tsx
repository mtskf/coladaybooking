import styles from "./styles.module.scss";
// const TOMORROW = format(add(new Date(), { days: 1 }), 'd MMM, yyyy');

// function Link ({ uri, text }) {
//   return <a href={uri} target="_blank" rel="noreferrer">{text}</a>;
// }

function Nav () {
  return (
    <nav className={styles.navbar} role="navigation" aria-label="main navigation">
      <div className={styles.navbar__inner}>
        <div className="navbar-brand">
          {/* <a className="navbar-item" href="https://bulma.io"> */}
          {/* <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28"> */}
          {/* </a> */}
          <h1>COLA DAY ROOMS</h1>
        </div>
      </div>
      {/* <h2>More resources</h2>
      <Link uri={"https://trufflesuite.com"} text={"Truffle"} />
      <Link uri={"https://reactjs.org"} text={"React"} />
      <Link uri={"https://soliditylang.org"} text={"Solidity"} />
      <Link uri={"https://ethereum.org"} text={"Ethereum"} /> */}
    </nav >
  );
}

export default Nav;
