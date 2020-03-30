import { shallowMount, mount, createLocalVue } from "@vue/test-utils";
import VuetifyNumericField from "@/components/VuetifyNumericField.vue";

let wrapper: ReturnType<typeof mount>;

beforeEach(() => {
  wrapper = mount(VuetifyNumericField, {
    propsData: { id: "hello", locale: "tr-TR", percent: true, minDecimalDigits: 0, maxDecimalDigits: 4 },
  });
});

describe("VuetifyNumericField", () => {
  it("should render", () => {
    const inputWrapper = wrapper.find("input"); //.element as HTMLInputElement;
    const inputElement = inputWrapper.element; //.element as HTMLInputElement;
    expect(inputElement.id).toBe("hello");
  });
});
