import React, { useState, useEffect } from "react";
import Snackbar from '@mui/material/Snackbar';
import Slide, { SlideProps } from '@mui/material/Slide';
import styles from "./styles.module.scss";
import { AutoAwesome, Error } from '@mui/icons-material';
import { Snack } from 'types';

interface PropType {
  snack: Snack;
  setSnack: (snack: Snack) => void;
}

const DELAY = 500;
const DURATION = 5000;
const transition = (props: SlideProps) => <Slide {...props} direction="up" />;

const SnackBar = ({ snack, setSnack }: PropType) => {
  const [isActive, setIsActive] = useState(false);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    setSnack({ ...snack, isActive: false, });
    setIsActive(false);
  };

  useEffect(() => {
    if (snack.isActive) {
      setTimeout(() => setIsActive(true), DELAY);
    }
  }, [snack]);

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={isActive}
      autoHideDuration={DURATION}
      onClose={handleClose}
      TransitionComponent={transition}
      className={styles.snackBar}
    >
      <div data-type={snack.type}>
        {snack.type === 'success' && <AutoAwesome />}
        {snack.type === 'error' && <Error />}
        <span>{snack.message}</span>
      </div>
    </Snackbar>
  );
};
export default SnackBar;
