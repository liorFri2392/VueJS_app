<script setup>
import ConversionDatesSelector from '../components/ConversionDatesSelector.vue';
import ConversionAnalysisDownloader from '../components/ConversionAnalysisDownloader.vue';
import ConversionSegmentsLoader from '../components/ConversionSegmentsLoader.vue';
</script>

<template>
  <h2>Conversion Analysis</h2>
  <ConversionSegmentsLoader />
  <ConversionDatesSelector />
  <!-- <CountrySelector /> -->
  <ConversionAnalysisDownloader />
</template>
