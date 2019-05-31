import * as React from "react";
import { Box, Text } from "ink";
import {
  CheckboxElement,
  Element,
  InputElement,
  SelectElement,
  SeparatorElement,
  SpinnerState,
} from "./types";
import { Checkbox } from "./Checkbox";
import { Divider } from "./Divider";
import { TextInput } from "./TextInput";
import { useStdin } from "./useStdin";
import { SelectItem } from "./SelectItem";
import {
  up,
  down,
  isElementCheckbox,
  isElementSelect,
  isElementInput,
  isElementSeparator,
} from "./helpers";

interface Props {
  elements: Element[];
  title?: string;
  onSubmit: (params: {
    formValues?: Record<string, any>;
    selectedValue?: any;
    goBack: boolean;
  }) => void;
  initialFormValues?: Record<string, any>;
  withBackButton: boolean;
}

export const Prompt: React.FC<Props> = props => {
  const [formValues, setFormValues] = React.useState<Record<string, any>>(
    props.initialFormValues || {},
  );
  const [spinnersByCursor, setSpinnerByCursor] = React.useState<
    Record<string, SpinnerState | undefined>
  >({});
  const [cursor, setCursor] = React.useState(0);
  const elementsWithBack: Element[] = props.withBackButton
    ? [
        ...props.elements,
        {
          label: "Back",
          style: { marginTop: 1 },
          type: "select",
          value: undefined,
        },
      ]
    : props.elements;

  useStdin(actionKey => {
    setCursor(prevCursor => {
      if (actionKey === "up") {
        return up(prevCursor, elementsWithBack);
      }

      if (actionKey === "down") {
        return down(prevCursor, elementsWithBack);
      }

      const hoveredElement = elementsWithBack[prevCursor];

      if (actionKey === "next" && !isElementInput(hoveredElement)) {
        return down(prevCursor, elementsWithBack);
      }

      if (
        actionKey === "submit" &&
        isElementInput(hoveredElement) &&
        !!formValues[hoveredElement.identifier]
      ) {
        return down(prevCursor, elementsWithBack);
      }

      if (
        actionKey === "submit" &&
        !isElementCheckbox(hoveredElement) &&
        !isElementSelect(hoveredElement) &&
        !isElementInput(hoveredElement)
      ) {
        return down(prevCursor, elementsWithBack);
      }

      return prevCursor;
    });
  });

  const onInputChange = (
    value: string | boolean,
    input: InputElement | CheckboxElement,
  ) => {
    setFormValues(prevCredentials => ({
      ...prevCredentials,
      [input.identifier]: value,
    }));
  };

  const addSpinner = (spinnerCursor: number) => {
    return () => {
      setSpinnerByCursor(prev => ({ ...prev, [spinnerCursor]: "running" }));
    };
  };

  const removeSpinner = (spinnerCursor: number) => {
    return (state: Exclude<SpinnerState, "running">) => {
      setSpinnerByCursor(prev => ({
        ...prev,
        [spinnerCursor]: state,
      }));
    };
  };

  const submitPrompt = (value: any, goBack: boolean = false) => {
    props.onSubmit({ formValues, selectedValue: value, goBack });
  };

  return (
    <Box flexDirection="column">
      {props.title && (
        <Box marginBottom={1}>
          <Text bold>{props.title}</Text>
        </Box>
      )}
      <Box
        flexDirection="column"
        marginLeft={1}
        marginBottom={props.withBackButton ? 1 : 0}
      >
        {props.elements.map((e, elemIndex) => {
          if (isElementInput(e)) {
            return (
              <Box key={elemIndex} {...e.style}>
                <TextInput
                  {...e}
                  value={formValues[e.identifier] || ""}
                  focus={cursor === elemIndex}
                  onChange={value => onInputChange(value, e)}
                />
              </Box>
            );
          }

          if (isElementCheckbox(e)) {
            return (
              <Box key={elemIndex} {...e.style}>
                <Checkbox
                  {...e}
                  checked={formValues[e.identifier] || false}
                  onChange={value => onInputChange(value, e)}
                  focus={cursor === elemIndex}
                />
              </Box>
            );
          }

          if (isElementSeparator(e)) {
            return (
              <Box key={elemIndex} {...e.style}>
                <Divider title={e.label || ""} dividerChar={e.dividerChar} />
              </Box>
            );
          }

          if (isElementSelect(e)) {
            return (
              <Box key={elemIndex} {...e.style}>
                <SelectItem
                  {...e}
                  focus={cursor === elemIndex}
                  spinnerState={spinnersByCursor[elemIndex]}
                  onSelect={async value => {
                    if (
                      e.onSelect &&
                      spinnersByCursor[elemIndex] !== "running"
                    ) {
                      return e.onSelect({
                        value,
                        startSpinner: addSpinner(elemIndex),
                        stopSpinner: removeSpinner(elemIndex),
                        submitPrompt: () => submitPrompt(value),
                      });
                    }

                    submitPrompt(value);
                  }}
                />
              </Box>
            );
          }
          return null;
        })}
      </Box>
      {props.withBackButton && (
        <SelectItem
          label="Back"
          isBackButton
          onSelect={() => {
            submitPrompt(undefined, true);
          }}
          focus={cursor === elementsWithBack.length - 1}
          spinnerState={undefined}
        />
      )}
    </Box>
  );
};
