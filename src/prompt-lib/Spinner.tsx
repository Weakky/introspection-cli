import { Color } from "ink";
import * as React from "react";
const InkSpinner = require("ink-spinner");

export const Spinner: React.FC = () => (
  <Color green>
    <InkSpinner />
  </Color>
);
