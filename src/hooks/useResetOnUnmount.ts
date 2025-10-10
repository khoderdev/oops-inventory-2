import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { ActionCreatorWithoutPayload } from "@reduxjs/toolkit";

export const useResetOnUnmount = (resetAction: ActionCreatorWithoutPayload, enabled: boolean = true) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;

    return () => {
      console.log(`🧹 [useResetOnUnmount] Cleaning up state: ${resetAction.type}`);
      dispatch(resetAction());
    };
  }, [dispatch, resetAction, enabled]);
};

export const useResetOnChange = (resetAction: ActionCreatorWithoutPayload, condition: boolean, resetWhen: boolean = false) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (condition === resetWhen) {
      console.log(`🧹 [useResetOnChange] Resetting state: ${resetAction.type}`);
      dispatch(resetAction());
    }
  }, [dispatch, resetAction, condition, resetWhen]);
};
