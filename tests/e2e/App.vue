<template>
  <v-app>
    Welcome to Test Page
    <vuetify-numeric-field
      ref="model-percent"
      id="model-percent"
      v-model="inputValue"
      :percent="true"
      locale="tr-TR"
      :min-decimal-digits="0"
      :max-decimal-digits="4"
      text-align="right"
    />

    <vuetify-numeric-field
      id="model-percent2"
      v-model="inputValue"
      :percent="true"
      locale="tr-TR"
      :min-decimal-digits="0"
      :max-decimal-digits="2"
      text-align="right"
    />

    <vuetify-numeric-field
      id="model-money"
      v-model="inputValue"
      currency="TRY"
      locale="tr-TR"
      :min-decimal-digits="0"
      :max-decimal-digits="2"
      text-align="right"
    />

    <vuetify-numeric-field
      id="without-model"
      :percent="false"
      currency="TRY"
      locale="tr-TR"
      :min-decimal-digits="0"
      :max-decimal-digits="4"
      text-align="right"
    />
    <div id="model-data">{{ inputValue }}</div>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import VueCompositionApi from "@vue/composition-api";
import VuetifyNumericField from "../../src/components/VuetifyNumericField.vue";

Vue.use(VueCompositionApi);

export default Vue.extend({
  name: "App",

  components: {
    VuetifyNumericField,
  },

  data: () => ({
    inputValue: 0,
  }),
});
</script>
