<script setup>
import { reactive } from 'vue';
import Semaphore from 'semaphore-async-await';
import makeEta from 'simple-eta';
import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { arrayToCsvRow, secondsToHumanReadable,cleanDomain } from '../utils.js';

// Model
const state = reactive({
  isLoadingData: false,
  eta: '',
  progressBarMax: 0,
  progressBarValue: 0,
});

// Methods
async function writeFile() {
  const params = {
    api_key: persistentStore.apiKey,
    start_date: volatileStore.startDate,
    end_date: volatileStore.endDate,
    country: persistentStore.country,
    main_domain_only: persistentStore.includeSubdomains ? 'false' : 'true',
    show_verified: 'false',
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();
  const headers = [
    'Original Domain',
    'Cleaned Domain',
    'Global Rank',
    'Site Category',
    'Site Category Rank',
    'Technology',
    'Category',
    'Sub Category',
    'Free/Paid',
    'Description',
  ];
  const opts = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    suggestedName: 'similarweb-results_technographics.csv',
    multiple: false,
  };

  let fileHandle;
  try {
    fileHandle = await window.showSaveFilePicker(opts);
  } catch (err) {
    console.error(err);
  }
  if (!fileHandle) return;

  const fileStream = await fileHandle.createWritable();
  fileStream.write('\uFEFF'); // Notify Excel that we're using UTF-8
  await fileStream.write({ type: 'write', data: arrayToCsvRow(headers) });

  const lock = new Semaphore(1);

  state.eta = '?';
  state.isLoadingData = true;
  state.progressBarValue = 0;
  state.progressBarMax = persistentStore.domains.length;

  await Promise.all(
    persistentStore.domains.map(async ([originalDomain, cleanedDomain]) => {
      cleanedDomain =  cleanDomain(originalDomain)
      const results = [];
      const eta = makeEta({
        min: 0,
        max: state.progressBarMax,
        historyTimeConstant: 5,
      });
      eta.start();
      let response = null;
      try {
        response = await similarwebApiClient.get(
          `/v1/website/${cleanedDomain}/technographics/all?${queryString}`
        );
      } catch (err) {
        if (err.response.status === 404) {
          console.error(`No data for domain ${cleanedDomain}!`);
        } else {
          console.error(err.response.status);
          console.error(err.response.data);
        }
      }
      if (response && response.status >= 200 && response.status < 300) {
        const data = response.data.technologies;
        const globalRank = response.data.global_rank || '';
        const category = response.data.category || '';
        const catRank = response.data.category_rank || '';
        data.forEach(function (tech) {
          results.push([
            originalDomain,
            cleanedDomain,
            globalRank,
            category,
            catRank,
            tech.technology_name,
            tech.category,
            tech.sub_category,
            tech.free_paid,
            tech.description,
          ]);
        });
      }
      state.progressBarValue++;
      eta.report(state.progressBarValue);
      state.eta = eta.estimate();
      await lock.acquire();
      for (const val of results) {
        await fileStream.write({
          type: 'write',
          data: arrayToCsvRow(val),
        });
      }
      lock.release();
    })
  );
  await fileStream.close();
  state.isLoadingData = false;
  console.log('done!');
  window.alert('File downloaded successfully!');
}
</script>

<template>
  <form>
    <b-button
      type="submit"
      :disabled="state.isLoadingData"
      variant="primary"
      @click.prevent.stop="writeFile"
    >
      Extract Data</b-button
    >
  </form>
  <div class="p-2">
    Will consume
    <b>{{ Number(persistentStore.domains.length).toLocaleString() }}</b> API
    hits per run.
  </div>
  <div v-if="state.isLoadingData">
    <div>ETA: {{ secondsToHumanReadable(state.eta) }}</div>
    <b-progress :max="state.progressBarMax" class="mb-3">
      <b-progress-bar
        :value="state.progressBarValue"
        :label="`${(
          (state.progressBarValue / state.progressBarMax) *
          100
        ).toFixed(2)}%`"
      ></b-progress-bar>
    </b-progress>
  </div>
</template>
