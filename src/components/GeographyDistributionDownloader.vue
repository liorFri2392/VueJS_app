<script setup>
import { reactive } from 'vue';
import Semaphore from 'semaphore-async-await';
// import _ from 'lodash';
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
    main_domain_only: persistentStore.includeSubdomains ? 'false' : 'true',
    show_verified: 'false',
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();
  const headers = [
    'Domain',
    'Cleaned Domain',
    'Country',
    'Time Period',
    'Share',
    'Visits',
    'Pages Per Visit',
    'Average Time',
    'Bounce Rate',
    'Country Rank',
  ];
  const opts = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    suggestedName: 'similarweb-results-geography-distribution.csv',
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
          `/v1/website/${cleanedDomain}/geo/traffic-by-country?${queryString}`
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
        const data = response.data.records;
        const startDate = volatileStore.startDate;
        const endDate = volatileStore.endDate;
        data.forEach(function (item) {
          results.push([
            originalDomain,
            cleanedDomain,
            item.country_name,
            startDate +'-'+ endDate,
            item.share,
            item.visits,
            item.pages_per_visit,
            item.average_time,
            item.bounce_rate,
            item.rank,
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
  <div
    v-if="persistentStore.timePeriodType == 'last_28_days'"
    class="text-danger"
  >
    Not available for the last 28 days - please select another time period.
  </div>
  <div
    v-else-if="
      volatileStore.startDate < volatileStore.availableMonths.web.slice(-12)[0]
    "
    class="text-danger"
  >
    Not available for the selected dates - Lead Enrichment is only available for
    the last 12 months ({{ volatileStore.availableMonths.web.slice(-12)[0] }} to
    {{
      volatileStore.availableMonths.web[
        volatileStore.availableMonths.web.length - 1
      ]
    }}).
  </div>
  <div v-else>
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
  </div>
</template>
