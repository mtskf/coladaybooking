import styles from "./styles.module.scss";
import metaMask from "assets/img/metamask.svg";
import error from "assets/img/error.svg";

function NoticeNoArtifact () {
  return (
    <div className={styles.notice}>
      <div className={styles.noticeImage}>
        <img src={metaMask} alt="MetaMask" />
        <img src={error} alt="MetaMask" />
      </div>
      <h2>Error!</h2>
      <p>Please sign in on MetaMask.</p>
      <button className="button is-rounded is-primary" onClick={() => { window.location.reload(); }}>Retry</button>
    </div>
  )
}

export default NoticeNoArtifact