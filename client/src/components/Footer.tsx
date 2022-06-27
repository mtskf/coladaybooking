import React from 'react';
import { Language, GitHub, LinkedIn, Pinterest } from '@mui/icons-material';
import styles from "./styles.module.scss";

const Link = ({ uri, text, children }: { uri: string; text: string; children: any }) => {
  return <li><a href={uri} target="_blank" rel="noreferrer">{children}</a></li>;
}

function Footer () {
  return (
    <footer className={styles.footer}>
      <h2>Design & Develop by Mitsuki Fukunaga</h2>
      <ul>
        <Link uri={"https://mitsuki.vercel.app"} text={"Website"}><Language /></Link>
        <Link uri={"https://github.com/mtskf"} text={"GitHub"}><GitHub /></Link>
        <Link uri={"https://www.linkedin.com/in/mitsuki/"} text={"LinkedIn"}><LinkedIn /></Link>
        <Link uri={"https://www.pinterest.com.au/mtskf/"} text={"Pinterest"}><Pinterest /></Link>
      </ul>
    </footer >
  );
}

export default Footer;
