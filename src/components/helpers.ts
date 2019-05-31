import {
  InputElement,
  SelectElement,
  CheckboxElement,
  SeparatorElement,
  Element,
} from "./types";

export function isElementInput(obj: Element): obj is InputElement {
  return obj && obj.type === "text-input";
}

export function isElementSelect(obj: Element): obj is SelectElement {
  return obj && obj.type === "select";
}

export function isElementCheckbox(obj: Element): obj is CheckboxElement {
  return obj && obj.type === "checkbox";
}

export function isElementSeparator(obj: Element): obj is SeparatorElement {
  return obj && obj.type === "separator";
}

export function down(cursor: number, elements: Element[]) {
  const length = elements.length;

  while (
    cursor < length - 1 &&
    ["separator"].includes(elements[cursor + 1].type)
  ) {
    cursor++;
  }

  return cursor < length - 1 ? cursor + 1 : cursor;
}

export function up(cursor: number, elements: Element[]) {
  while (cursor > 0 && ["separator"].includes(elements[cursor - 1].type)) {
    cursor--;
  }

  return cursor > 0 ? cursor - 1 : cursor;
}
