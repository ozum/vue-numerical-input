<template>
  <v-text-field ref="numericElement" v-model="formatted" v-bind="$attrs" v-on="listeners" :class="{ alignRight: textAlign === 'right' }">
    <!-- Pass on all named slots -->
    <template v-for="(_, slot) in $slots">
      <slot :slot="slot" :name="slot" />
    </template>

    <!-- Pass on all scoped slots -->
    <!-- <template v-for="(_, scopedSlot) in $scopedSlots" slot-scope="scope">
      <slot :slot="scopedSlot" :name="scopedSlot" v-bind="scope" />
    </template> -->
  </v-text-field>
</template>

<script lang="ts">
export { VueNumericalInput as default } from "../composables/numeric";
</script>

<style scoped>
.alignRight /deep/ input {
  text-align: right;
}
</style>
