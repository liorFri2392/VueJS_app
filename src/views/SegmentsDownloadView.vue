<script setup>
import DatesSelector from '../components/DatesSelector.vue';
import SegmentsAnalysisDownloader from '../components/SegmentsAnalysisDownloader.vue';
import SegmentsLoader from '../components/SegmentsLoader.vue';
import CountrySelector from '../components/CountrySelector.vue';
</script>

<template>
  <h2>Segments Analysis</h2>
  <SegmentsLoader />
  <DatesSelector />
  <CountrySelector />
  <SegmentsAnalysisDownloader />
</template>
