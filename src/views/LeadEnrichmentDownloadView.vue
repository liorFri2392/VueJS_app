<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import CountrySelector from '../components/CountrySelector.vue';
import DomainsLoader from '../components/DomainsLoader.vue';
import LeadEnrichmentDownloader from '../components/LeadEnrichmentDownloader.vue';
</script>

<template>
  <h2>Websites - Lead Enrichment</h2>
  <DomainsLoader />
  <DatesSelector />
  <CountrySelector />
  <LeadEnrichmentDownloader />
</template>
