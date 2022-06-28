import styles from "./styles.module.scss";
// import { Report } from '@mui/icons-material';
import metaMask from "assets/img/metamask.svg";
import error from "assets/img/error.svg";


function NoticeWrongNetwork () {
  return (
    <div className={styles.notice}>
      <div className={styles.noticeImage}>
        <img src={metaMask} alt="MetaMask" />
        <img src={error} alt="MetaMask" />
      </div>
      <h2>Network Error!</h2>
      <p>Please connect MetaMask to Ropsten Test Network.</p>
      <button className="button is-rounded is-primary" onClick={() => { window.location.reload(); }}>Retry</button>
    </div>
  );
}

export default NoticeWrongNetwork;
