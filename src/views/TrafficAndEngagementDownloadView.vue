<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import CountrySelector from '../components/CountrySelector.vue';
import DomainsLoader from '../components/DomainsLoader.vue';
import TrafficAndEngagementDownloader from '../components/TrafficAndEngagementDownloader.vue';
</script>

<template>
  <h2>Websites - Traffic and Engagement</h2>
  <DomainsLoader />
  <DatesSelector />
  <CountrySelector />
  <TrafficAndEngagementDownloader />
</template>
