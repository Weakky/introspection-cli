import { StdinContext } from "ink";
import * as React from "react";
import { Key } from "readline";
import { action, ActionKey } from "../utils";

export function useStdin(keyHandler: (actionKey: ActionKey) => void) {
  const { stdin, setRawMode, isRawModeSupported } = React.useContext(
    StdinContext,
  );

  React.useEffect(() => {
    if (isRawModeSupported) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setRawMode!(true);
    }

    async function handler(_: string, key: Key) {
      await keyHandler(action(key));
    }

    stdin.on("keypress", handler);
    return () => {
      if (isRawModeSupported) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setRawMode!(false);
      }
      stdin.off("keypress", handler);
    };
  }, [stdin, setRawMode, isRawModeSupported, keyHandler]);
}
