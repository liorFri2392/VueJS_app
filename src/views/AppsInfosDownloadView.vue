<script setup>
import AppsCountrySelector from '../components/AppsCountrySelector.vue';
import AppsIdsLoader from '../components/AppsIdsLoader.vue';
import AppsInfosDownloader from '../components/AppsInfosDownloader.vue';
</script>

<template>
  <b-container class="px-6 py-4">
    <AppsIdsLoader />
    <AppsCountrySelector />
  </b-container>
  <div class="px-6 py-4">
    <AppsInfosDownloader />
  </div>
</template>
