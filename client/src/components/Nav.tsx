import styles from "./styles.module.scss";
import cokeSvg from "assets/img/cola.svg";
import { GitHub } from '@mui/icons-material';
import { format, add } from "date-fns";
const TOMORROW = format(add(new Date(), { days: 1 }), 'd MMM, yyyy');

function Nav () {
  return (
    <nav className={styles.navbar} role="navigation" aria-label="main navigation">
      <div className={styles.navbar__inner}>
        <div className={styles.navbar__brand}>
          <img src={cokeSvg} alt="Logo" />
          <h1>Cola Day<br />2022</h1>
        </div>
        <p>Room Booking System<br />
          {TOMORROW}</p>
        <a className="button is-rounded" href={"https://github.com/mtskf/coladaybooking"}><GitHub /> GitHub Repo</a>
      </div>
    </nav>
  );
}

export default Nav;
