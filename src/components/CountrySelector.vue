<script setup>
import { computed } from 'vue';

import { persistentStore, volatileStore } from '../store.js';

// Computed
const sortedCountries = computed(() => {
  return Object.entries({
    ...volatileStore.availableCountries.desktop,
    ...volatileStore.availableCountries.mobile,
  })
    .sort((a, b) => (a[1] > b[1] ? 1 : -1))
    .map(([countryCode, countryName]) => ({
      text: countryName,
      value: countryCode,
    }));
});
</script>

<template>
  <div class="mb-4">
    <h4>Country</h4>
    <b-form-select
      id="country"
      v-model="persistentStore.country"
      :options="sortedCountries"
    ></b-form-select>
  </div>
</template>
