import Vue from "vue";
import App from "./App.vue";
import Vuetify from "vuetify/lib";

Vue.config.productionTip = false;

// Move from src/plugins/vuetify.ts
Vue.use(Vuetify);
const vuetify = new Vuetify({});

new Vue({
  vuetify,
  render: h => h(App),
}).$mount("#app");
