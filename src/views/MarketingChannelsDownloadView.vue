<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import CountrySelector from '../components/CountrySelector.vue';
import DomainsLoader from '../components/DomainsLoader.vue';
import MarketingChannelsDownloader from '../components/MarketingChannelsDownloader.vue';
</script>

<template>
  <h2>Websites - Marketing Channels</h2>
  <DomainsLoader />
  <DatesSelector />
  <CountrySelector />
  <MarketingChannelsDownloader />
</template>
