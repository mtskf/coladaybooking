import React, { useState, useEffect } from "react";
import Snackbar from '@mui/material/Snackbar';
import Slide, { SlideProps } from '@mui/material/Slide';
import styles from "./styles.module.scss";
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { Snack } from 'types';


interface PropType {
  snack: Snack;
  setSnack: (snack: Snack) => void;
}

const DELAY = 500;
const DURATION = 5000;
const transition = (props: SlideProps) => <Slide {...props} direction="up" />;

export const SnackBar = ({ snack, setSnack }: PropType) => {
  const [isActive, setIsActive] = useState(false);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    // if (reason === 'clickaway') return;
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
    >
      <div className={styles.snackBar} data-type={snack.type}>
        {snack.type === 'success' && <CheckCircleOutline />}
        {snack.type === 'error' && <ErrorOutline />}
        <span>{snack.message}</span>
      </div>
    </Snackbar>
  );
};