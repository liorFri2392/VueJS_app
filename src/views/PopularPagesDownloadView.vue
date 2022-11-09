<script setup>
    import DomainsLoader from '../components/DomainsLoader.vue';
    import PopularPagesDownloader from '../components/PopularPagesDownloader.vue';
    import DatesSelector from '../components/DatesSelector.vue';
import CountrySelector from '../components/CountrySelector.vue';
    </script>

    <template>
      <h2>Websites - Popular Pages</h2>
      <DomainsLoader/>
      <DatesSelector/>
      <CountrySelector />
      <PopularPagesDownloader />
    </template>
