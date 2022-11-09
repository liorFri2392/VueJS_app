<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import AppsCountrySelector from '../components/AppsCountrySelector.vue';
import AppsIdsLoader from '../components/AppsIdsLoader.vue';
import AppsEngagementDownloader from '../components/AppsEngagementDownloader.vue';
</script>

<template>
  <b-container class="px-6 py-4">
    <AppsIdsLoader />
    <DatesSelector />
    <AppsCountrySelector />
  </b-container>
  <div class="px-6 py-4">
    <AppsEngagementDownloader />
  </div>
</template>
