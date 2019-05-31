import * as React from "react";
import { Color } from "ink";
import InkSpinner from "ink-spinner";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const InkSpinnerWithoutTypes = InkSpinner as any;

export const Spinner: React.FC = () => (
  <Color green>
    <InkSpinnerWithoutTypes />
  </Color>
);
