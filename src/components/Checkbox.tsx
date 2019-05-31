import * as React from "react";
import { Box, Color, BoxProps } from "ink";
import * as figures from "figures";
import { useStdin } from "./useStdin";

interface Props extends BoxProps {
  label: string;
  checked: boolean;
  focus: boolean;
  onChange: (value: boolean) => void;
}

export const Checkbox: React.FC<Props> = props => {
  const symbol = props.checked ? figures.radioOn : figures.radioOff;
  const { label, checked, focus, onChange, ...rest } = props;

  useStdin(action => {
    if (focus && action === "submit") {
      onChange(!checked);
    }
  });

  return (
    <Box {...rest}>
      {focus ? <Color green>{symbol}</Color> : symbol}
      <Box marginLeft={1}>{focus ? <Color green>{label}</Color> : label}</Box>
    </Box>
  );
};
