<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import DomainsLoader from '../components/DomainsLoader.vue';
import GeographyDistributionDownloader from '../components/GeographyDistributionDownloader.vue';
</script>

<template>
  <h2>Websites - Geography Distribution</h2>
  <DomainsLoader />
  <DatesSelector />
  <GeographyDistributionDownloader />
</template>
