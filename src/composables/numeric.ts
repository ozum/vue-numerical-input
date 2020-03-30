/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ExtractPropTypes, PropType } from "@vue/composition-api/dist/component/componentProps";
import { SetupContext, computed, Ref, ref, onMounted, onBeforeUnmount, defineComponent } from "@vue/composition-api";

import Vue from "vue";
import { getLocale, getCurrency } from "intl-data";
import roundTo from "round-to";
import {
  Empty,
  isEmpty,
  setCaretPosition,
  getCaretPosition,
  getPrecision,
  getNonEmpty,
  findInputElement,
  x100,
  isAllowedKeyPressed,
  isSelection,
  filterPastedText,
} from "./util";

/**
 * Props of the component.
 */
export interface VNumericProps {
  /** Value of the input. */
  value: number | null;

  /** Locale to be used for formatting. */
  locale: string;

  /** Currency used for formatting. */
  currency?: string;

  /** Number of decimal digits to show in formatted number. Sets both `minDecimalDigits` and `maxDecimalDigits`. */
  decimalDigits?: number;

  /** Minimum number of decimal digits to show in formatted number. */
  minDecimalDigits?: number;

  /** Maximum number of decimal digits to show in formatted number. Used to hide insignificant zeros at the end of fractional part. */
  maxDecimalDigits?: number;

  /** Number of decimal digits to be used when emitting value. i.e. it is possible to show 2 digits, but emit 6 digits. */
  emitDecimalDigits?: number;

  /** Whether value is a percentage. */
  percent?: boolean;

  /** Whether to show currency or percent symbol. */
  showSymbol?: boolean;

  /** If true emitted value is 1/100 of formatted value. For example if formatted value is `10`, emitted value is `0.1` */
  dividePercent?: boolean;
}

/**
 * Returns Vue props to be used in `defineComponent()` function.
 *
 * @example
 * defineComponent({
 *   props: getProps(),
 *   setup(props, context) { }
 * }
 */
export function getProps() {
  return {
    value: null,
    locale: { default: "tr-TR", type: String },
    currency: { type: String },
    decimalDigits: { type: Number },
    minDecimalDigits: { type: Number },
    maxDecimalDigits: { type: Number },
    emitDecimalDigits: { type: Number },
    percent: { type: Boolean, default: false },
    showSymbol: { type: Boolean, default: true },
    dividePercent: { type: Boolean, default: true },
    textAlign: { type: String as PropType<"left" | "right">, default: "left" },
  };
}

/**
 * Returns a vue component elements to be used in a template to make a field numeric formatter.
 * Component must have set `ref="numericElement" v-model="formatted" v-on="listeners"`
 *
 * Use `VNumeric` component from this library to get ready to use component.
 *
 * @param props is props of Vue component passed to `setup()` function.
 * @param context is setup context of Vue component passed to `setup()` function.
 *
 * @example
 * <template>
 *   <v-text-field ref="numericElement" v-model="formatted" v-bind="$attrs" v-on="listeners">
 *     <!-- Pass on all named slots -->
 *     <template v-for="(_, slot) in $slots">
 *       <slot :slot="slot" :name="slot" />
 *     </template>
 *
 *     <!-- Pass on all scoped slots -->
 *     <template v-for="(_, scopedSlot) in $scopedSlots" slot-scope="scope">
 *       <slot :slot="scopedSlot" :name="scopedSlot" v-bind="scope" />
 *     </template>
 *
 *   </v-text-field>
 * </template>
 *
 * <script lang="ts">
 * import { useNumeric, getProps } from "v-numeric";
 * defineComponent({
 *   props: getProps(),
 *   setup(props, context) {
 *     const { listeners, numericElement, formatted } = useNumeric(props, context);
 *     return { listeners, numericElement, formatted };
 *   }
 * }
 * </script>
 */
export function useNumeric(props: ExtractPropTypes<ReturnType<typeof getProps>>, context: SetupContext) {
  let inputElement: HTMLInputElement;
  const focused = ref(false);
  const numericElement: Ref<Vue | HTMLElement | null> = ref(null);
  const locale = computed(() => getLocale(props.locale));
  const currency = computed(() => (props.currency ? getCurrency(props.currency, locale.value.code) : undefined));
  const style = computed(() => (currency.value ? "currency" : props.percent ? "percent" : "decimal"));
  const divide = computed(() => style.value === "percent" && props.dividePercent);
  const minDecimalDigits = computed(() => getNonEmpty(props.decimalDigits, props.minDecimalDigits, currency.value?.decimalPlaces, 0));
  const maxDecimalDigits = computed(() => getNonEmpty(props.decimalDigits, props.maxDecimalDigits, currency.value?.decimalPlaces, 0));
  const symbol = computed(() => currency.value?.symbol || (style.value === "percent" ? locale.value.percentSymbol : ""));
  const formatter = computed(
    () =>
      new Intl.NumberFormat(locale.value.code, {
        style: style.value,
        currency: style.value === "currency" ? currency.value?.code : undefined,
        minimumFractionDigits: minDecimalDigits.value,
        maximumFractionDigits: maxDecimalDigits.value,
      })
  );

  const internalValue = ref(props.value); // If no v-model is provided, there is no props.value present. emitInput function updates this value.

  function getValue() {
    return props.value === undefined ? internalValue.value : props.value;
  }

  const prefix = computed(() => {
    const hasPrefix =
      (style.value === "currency" && locale.value.currencySymbolPlacement === "p") ||
      (style.value === "percent" && locale.value.percentSymbolPlacement === "p");
    return props.showSymbol && hasPrefix ? symbol.value : "";
  });

  function unformat(value: string, requiredPrecision?: number): number {
    const numberString = value.replace(locale.value.decimalCharacter, ".");
    const number = Number(numberString);
    const valuePrecision = getPrecision(number);
    const additionalPrecision = divide.value ? 2 : 0;
    const result = divide.value ? roundTo(number / 100, valuePrecision + 2) : number;
    return requiredPrecision !== undefined ? roundTo(result, requiredPrecision + additionalPrecision) : result;
  }

  function formatEditable(value: number): string {
    if (isEmpty(value)) return "";
    const decimalChar = locale.value.decimalCharacter;
    const roundedValue = roundTo(value, maxDecimalDigits.value); // + (divide.value ? 2 : 0)
    const inputValue = unformat(inputElement.value);
    return inputValue === roundedValue ? inputElement.value : `${x100(value, divide.value)}`.replace(".", decimalChar);
  }

  function format(value: number | Empty): string {
    if (isEmpty(value)) return "";
    const formattedValue = formatter.value.format(value);
    return props.showSymbol ? formattedValue : formattedValue.replace(symbol.value, "");
  }

  function setInputElementValue(value: number): void {
    const caretPosition = getCaretPosition(inputElement, locale.value.digitGroupSeparator, prefix.value);
    inputElement.value = formatEditable(value);
    inputElement.dispatchEvent(new Event("input", { bubbles: false }));
    setCaretPosition(inputElement, caretPosition);
  }

  function emitInput(value: number | Empty): void {
    if (props.value === undefined) {
      internalValue.value = value;
    }
    context.emit("input", value);
  }

  function emitIfChanged(value: string | Empty, limitDecimal = false): void {
    if (isEmpty(value)) return emitInput(value);

    const oldValue = getValue();
    const maxValue = divide.value ? 9999999999999 : 999999999999999;
    const precision = limitDecimal ? props.emitDecimalDigits || maxDecimalDigits.value : undefined;
    const numberValue = unformat(value, precision);

    if (numberValue > maxValue) return setInputElementValue(oldValue);
    if (oldValue !== numberValue) emitInput(numberValue); // Wait until blur to rounding.
  }

  const formatted = computed({
    get: () => (focused.value ? formatEditable(getValue()) : format(getValue())),
    set: emitIfChanged,
  });

  function onFocus(): void {
    if (isSelection(inputElement)) {
      focused.value = true;
      Vue.nextTick(() => inputElement.setSelectionRange(0, inputElement.value.length));
    } else {
      setTimeout(() => {
        const caretPosition = getCaretPosition(inputElement, locale.value.digitGroupSeparator, prefix.value);
        focused.value = true;
        Vue.nextTick(() => setCaretPosition(inputElement, caretPosition));
      });
    }
  }

  function onBlur(): void {
    emitIfChanged(`${divide.value ? getValue() * 100 : getValue()}`, true);
    focused.value = false;
  }

  function onPaste(event: ClipboardEvent): void {
    filterPastedText(event, locale.value.decimalCharacter);
  }

  /** Prevents unallowed key on "keyDown" event. */
  function onKeyDown(keyDownEvent: KeyboardEvent): void {
    if (!isAllowedKeyPressed(keyDownEvent, locale.value, maxDecimalDigits.value)) keyDownEvent.preventDefault();
  }

  onMounted(() => {
    inputElement = findInputElement(numericElement.value);
    inputElement.addEventListener("focus", onFocus);
    inputElement.addEventListener("blur", onBlur);
    inputElement.addEventListener("paste", onPaste);
    inputElement.addEventListener("keydown", onKeyDown);
  });

  onBeforeUnmount(() => {
    inputElement.removeEventListener("focus", onFocus);
    inputElement.removeEventListener("blur", onBlur);
    inputElement.removeEventListener("paste", onPaste);
    inputElement.removeEventListener("keydown", onKeyDown);
  });

  const listeners = computed(() => {
    const { input, ...listeners } = context.listeners; // eslint-disable-line @typescript-eslint/no-unused-vars
    return listeners;
  });

  return { listeners, numericElement, formatted };
}

/**
 * Returns a vue component ready to be used with a `template` to make a field numeric formatter.
 * Component must have set `ref="numericElement" v-model="formatted" v-on="listeners"`
 *
 * @example
 * <template>
 *   <v-text-field ref="numericElement" v-model="formatted" v-bind="$attrs" v-on="listeners">
 *     <!-- Pass on all named slots -->
 *     <template v-for="(_, slot) in $slots">
 *       <slot :slot="slot" :name="slot" />
 *     </template>
 *
 *     <!-- Pass on all scoped slots (Seems not necessary) -->
 *     <!-- <template v-for="(_, scopedSlot) in $scopedSlots" slot-scope="scope">
 *       <slot :slot="scopedSlot" :name="scopedSlot" v-bind="scope" />
 *     </template> -->
 *
 *   </v-text-field>
 * </template>
 *
 * <script lang="ts">
 * export { VueNumericalInput as default } from "../composables/numeric.ts";
 * </script>
 */
export const VueNumericalInput = defineComponent({
  props: getProps(),
  setup(props, context) {
    const { listeners, numericElement, formatted } = useNumeric(props, context);
    return { listeners, numericElement, formatted };
  },
});
