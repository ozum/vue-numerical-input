import { Locale } from "intl-data";
import roundTo from "round-to";
import Vue from "vue";

export type Empty = "" | null | undefined;

/**
 * Returns how many times searched string is repeated inside source string.
 * @param sourceString is the string to search other string inside.
 * @param searchedString is the string to search.
 * @return snumber of repeat.
 * @ignore
 */
export function countOfString(sourceString: string, searchedString: string): number {
  return (sourceString.match(new RegExp(`\\${searchedString}`, "g")) || []).length;
}

/**
 * Returns whether given component is a Vue component.
 * @param component is component to test.
 * @returns whether given component is a Vue component.
 * @ignore
 */
function isVueComponent(component: any): component is Vue {
  return component instanceof Vue;
}

/**
 * Returns whether given element is `null`, `undefined` or empty string.
 *
 * @param value to test.
 * @returns whether given element is empty.
 * @ignore
 */
export function isEmpty(value: any): value is Empty {
  return value === "" || value === null || value === undefined;
}

/**
 * Returns whether given HTML input element has selected text.
 *
 * @param input is the HMTL input element to test.
 * @returns whether a text is selected in text box.
 * @ignore
 */
export function isSelection(input: HTMLInputElement): boolean {
  return Math.abs((input.selectionStart || 0) - (input.selectionEnd || 0)) > 0;
}

/**
 * Returns caret (cursor) position in given HTML input element.
 *
 * @param input is the HTML input element to get caret position of.
 * @param groupingSymbol is the grouping symbol used in numbers.
 * @param prefix is the prefix used when formatting.
 * @returns caret position.
 * @ignore
 */
export function getCaretPosition(input: HTMLInputElement, groupingSymbol: string, prefix?: string): number {
  const { value, selectionStart } = input;
  const caretPosition = selectionStart || value.length;
  const prefixCorrection = isEmpty(prefix) ? 0 : prefix.length;
  const groupingSymbolCorrection = countOfString(value.substring(0, caretPosition), groupingSymbol);
  return Math.max(0, caretPosition - prefixCorrection - groupingSymbolCorrection);
}

/**
 * Sets caret (cursor) position of HTML input.
 *
 * @param input is the HTML input to set caret position.
 * @param position is the position to set caret to.
 * @ignore
 */
export function setCaretPosition(input: HTMLInputElement, position: number): void {
  input.setSelectionRange(position, position);
}

/**
 * Returns precision (number of digits after decimal point) of given number (or string which is a number).
 *
 * @param value is the value to get precision of.
 * @returns precision of given value.
 * @ignore
 */
export function getPrecision(value: number | string): number {
  const number = typeof value === "string" ? Number(value) : value;
  if (!isFinite(number) || typeof number !== "number") return 0;
  let e = 1;
  let p = 0;
  while (Math.round(number * e) / e !== number) {
    e *= 10;
    p++;
  }
  return p;
}

/**
 * If `shouldMultiply` is true returns given number multiplied with 100, preserving same precision as before,
 * otherwise returns same number.
 *
 * @param value is the number to be multiplied or returned.
 * @param shouldMultiply is whether to multiply number.
 * @returns multiplied or same number.
 * @ignore
 */
export function x100(value: number, shouldMultiply: boolean): number {
  return shouldMultiply ? roundTo(value * 100, Math.max(getPrecision(value) - 2, 0)) : value;
}

/**
 * Returns first value which is not empty, or undefined
 *
 * @param values are list of values to test.
 * @returns first non empty value.
 * @throws if non empty value cannot be found.
 * @ignore
 */
export function getNonEmpty(...values: Array<number | Empty>): number {
  const value = values.find(value => !isEmpty(value)) as number | any;
  if (value === undefined) throw new Error("Cannot find non empty value.");
  return value;
}

/**
 * Searches and returns first HTML input element inside given Vue or HTML element. If given element is already an HTML
 * input element returns it.
 *
 * @param component is root element to search descendants.
 * @returns first HTML input element.
 * @ignore
 */
export function findInputElement(component: Vue | HTMLElement | null): HTMLInputElement {
  if (!component) {
    throw new Error("Cannot find component. Please add 'ref=\"numericElement\"'.");
  }
  const element = isVueComponent(component) ? component.$el : component;
  const inputElement = element.tagName === "INPUT" ? element : element.getElementsByTagName("input")[0];
  return inputElement as HTMLInputElement;
}

/**
 * Examines given "keyDown" event and returns whether pressed key is allowed.
 *
 * @param event is the keyDown event to examine.
 * @param locale is the locale to be used during examination.
 * @param maxDecimalDigits is number of allowed decimal (fractional digits)
 * @retunrs whether pressed key is allowed.
 * @ignore
 */
export function isAllowedKeyPressed(event: KeyboardEvent, locale: Locale, maxDecimalDigits: number): boolean {
  const inputElement = event.target as HTMLInputElement;
  const isValueDecimal = !isEmpty(inputElement.value) && inputElement.value.includes(locale.decimalCharacter);
  const decimalSymbol = event.key === locale.decimalCharacter;
  const allowDecimal = maxDecimalDigits > 0;
  // Allow: backspace, delete, tab, escape, enter and
  const specials = [46, 8, 9, 27, 13, 110].includes(event.keyCode);
  // Allow: Ctrl+A,Ctrl+C,Ctrl+V,Ctrl+X,Ctrl+Z or cmd+A...
  const acvKeys = [65, 67, 86, 88, 90].includes(event.keyCode);
  const cmdCtrl = event.ctrlKey === true || event.metaKey === true;
  // home, end, left, right, down, up
  const positionKeys = event.keyCode >= 35 && event.keyCode <= 40;
  // const nonNumeric = (event.shiftKey || event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105);
  const numeric = (!event.shiftKey && event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105);

  return numeric || specials || (cmdCtrl && acvKeys) || positionKeys || (decimalSymbol && !isValueDecimal && allowDecimal);
}

/**
 * Based on localization rule, filters pasted text into textbox by only allowing allowed chars to be pasted.
 *
 * @param pasteEvent
 * @param decimalCharacter
 * @ignore
 */
export function filterPastedText(pasteEvent: ClipboardEvent, decimalCharacter: string): void {
  const pasted = (pasteEvent.clipboardData || (window as any).clipboardData).getData("text");
  if (countOfString(pasted, decimalCharacter) <= 1) {
    const rxNonAllowed = new RegExp(`[^\\d\\${decimalCharacter}]`, "g");
    const safePasted = pasted.replace(rxNonAllowed, "");
    document.execCommand("insertText", false, safePasted);
  }
  pasteEvent.preventDefault();
}
