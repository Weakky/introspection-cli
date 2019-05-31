import { BoxProps } from "ink";

type MaybePromise<T> = Promise<T> | T;

type SubType<Base, Condition> = Pick<
  Base,
  { [Key in keyof Base]: Base[Key] extends Condition ? Key : never }[keyof Base]
>;

interface BaseStyle {
  style?: BoxProps;
}

export interface InputElement<T extends object = any> extends BaseStyle {
  type: "text-input";
  label: string;
  placeholder?: string;
  identifier: Exclude<keyof SubType<T, string | undefined>, undefined>;
  mask?: string;
}

export type SpinnerState = "running" | "succeeded" | "failed";

export interface SelectElement extends BaseStyle {
  type: "select";
  label: string;
  value?: any;
  description?: string;
  /**
   * If onSelect is provided, prompt must be submitted manually using `submitPrompt`.
   * Otherwise, the prompt will be submitted automatically
   */
  onSelect?: (params: {
    value?: any;
    startSpinner: () => void;
    stopSpinner: (state: Exclude<SpinnerState, "running">) => void;
    submitPrompt: () => void;
  }) => MaybePromise<void>;
}

export interface CheckboxElement<T extends object = any> extends BaseStyle {
  type: "checkbox";
  label: string;
  identifier: Exclude<keyof SubType<T, boolean | undefined>, undefined>;
}

export interface SeparatorElement extends BaseStyle {
  type: "separator";
  label?: string;
  dividerChar?: string;
}

export type Element<T extends object = any> =
  | InputElement<T>
  | SelectElement
  | CheckboxElement<T>
  | SeparatorElement;
