<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import {
  arrayToCsvRow,
  decodeCountry,
  secondsToHumanReadable,
} from '../utils.js';

const STORAGE_NAME = 'similarwebSelectedAppEngagementMetrics';

let storedConfig = {};
try {
  const storedString = localStorage.getItem(STORAGE_NAME);
  if (storedConfig) {
    storedConfig = JSON.parse(storedString);
  }
} catch {
  console.error('Could not retrieve stored apps engagement config');
}

// Model
const state = reactive({
  isLoadingData: false,
  eta: '',
  progressBarMax: 0,
  progressBarValue: 0,
});

const persistentState = reactive({
  hasAppDetails: false,
  hasAppRank: false,
  hasRelatedSites: false,
  hasAudienceInterests: false,
  ...storedConfig, // override defaults with stored values
});

watch(
  () => _.cloneDeep(persistentState),
  (currentValue) => {
    localStorage.setItem(STORAGE_NAME, JSON.stringify(currentValue));
  }
);

// Computed
const selectedMetrics = computed(() =>
  Object.keys(persistentState).filter(
    (key) => String(key).startsWith('has') && persistentState?.[key]
  )
);

// Methods
async function writeFile() {
  const params = {
    api_key: persistentStore.apiKey,
    country: persistentStore.appsCountry,
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();

  const headers = ['App ID', 'Cleaned App ID', 'Country', 'Metric', 'Value'];
  if (persistentState.hasAudienceInterests) {
    headers.push('Affinity Score');
  }

  const opts = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    suggestedName: 'similarweb-results_apps-infos.csv',
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
  state.progressBarValue = 0;
  state.progressBarMax =
    persistentStore.appsIds.length * selectedMetrics.value.length;

  const eta = makeEta({
    min: 0,
    max: state.progressBarMax,
    historyTimeConstant: 5,
  });
  eta.start();

  state.isLoadingData = true;

  await Promise.all(
    persistentStore.appsIds.map(
      async ([originalAppId, cleanedAppId, store]) => {
        const appResults = [];

        if (persistentState.hasAppDetails) {
          let response = null;
          try {
            response = await similarwebApiClient.get(
              `https://api.similarweb.com/v1/app/${store}/${cleanedAppId}/Details/details?${queryString}`
            );
          } catch (err) {
            if (err.response.status === 404) {
              console.error(`No app details for app ${cleanedAppId}!`);
            } else {
              console.error(err.response.status);
              console.error(err.response.data);
            }
          }

          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Title',
            Value: response?.data?.title,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Cover',
            Value: response?.data?.cover,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Author',
            Value: response?.data?.author,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Price',
            Value: response?.data?.price,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Category',
            Value: response?.data?.main_category,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Rating',
            Value: response?.data?.rating,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Release Date',
            Value: response?.data?.release_date,
          });
          appResults.push({
            'App ID': originalAppId,
            'Cleaned App ID': cleanedAppId,
            Country: 'N/A',
            Metric: 'Has In-App Purchase?',
            Value: response?.data?.in_app_purchase,
          });

          state.progressBarValue++;
        }

        if (persistentState.hasAudienceInterests) {
          let response = null;
          try {
            response = await similarwebApiClient.get(
              `https://api.similarweb.com/v1/app/${store}/${cleanedAppId}/audience-interests/also-used-apps?${queryString}`
            );
          } catch (err) {
            if (err.response.status === 404) {
              console.error(`No app details for app ${cleanedAppId}!`);
            } else {
              console.error(err.response.status);
              console.error(err.response.data);
            }
          }

          (response?.data?.also_used_apps || []).forEach((val) => {
            appResults.push({
              'App ID': originalAppId,
              'Cleaned App ID': cleanedAppId,
              Country: decodeCountry(params.country),
              Date: 'N/A',
              Metric: 'Related App',
              Value: val.application,
              'Affinity Score': val.affinity,
            });
          });

          state.progressBarValue++;
        }

        if (persistentState.hasRelatedSites) {
          let response = null;
          try {
            response = await similarwebApiClient.get(
              `https://api.similarweb.com/v1/app/${store}/${cleanedAppId}/RelatedSites/related-sites?${queryString}`
            );
          } catch (err) {
            if (err.response.status === 404) {
              console.error(`No app details for app ${cleanedAppId}!`);
            } else {
              console.error(err.response.status);
              console.error(err.response.data);
            }
          }

          (response?.data?.related_sites || []).forEach((site) => {
            appResults.push({
              'App ID': originalAppId,
              'Cleaned App ID': cleanedAppId,
              Country: decodeCountry(params.country),
              Date: 'N/A',
              Metric: 'Related Site',
              Value: site,
            });
          });

          state.progressBarValue++;
        }

        await lock.acquire();
        for (const val of appResults) {
          const dataRow = headers.map((header) => val?.[header] ?? '');
          await fileStream.write({
            type: 'write',
            data: arrayToCsvRow(dataRow),
          });
        }
        lock.release();
      }
    )
  );

  await fileStream.close();
  state.isLoadingData = false;
  console.log('done!');
  window.alert('File downloaded successfully!');
}
</script>

<template>
  <b-container>
    <!-- <h3>Extract Traffic and Engagement Data</h3> -->
    <h4>Metrics</h4>
    <form>
      <b-container>
        <div class="form-group row">
          <div class="col-sm-4 form-check">
            <label class="form-check-label">
              <input
                id="app-details"
                v-model="persistentState.hasAppDetails"
                type="checkbox"
                class="form-check-input"
              />
              <span class="ml-2">App Details</span>
            </label>
          </div>
        </div>
        <!-- <div class="form-group row">
          <div class="col-sm-4 form-check" >
            <label class="form-check-label">
              <input
                id="app-rank"
                v-model="persistentState.hasAppRank"
                type="checkbox"
                class="form-check-input"
              />
              <span class="ml-2">App Rank</span>
            </label>
          </div>
        </div> -->
        <div class="form-group row">
          <div class="col-sm-4 form-check">
            <label class="form-check-label">
              <input
                id="app-audience-interests"
                v-model="persistentState.hasAudienceInterests"
                type="checkbox"
                class="form-check-input"
              />
              <span class="ml-2">Audience Interests</span>
            </label>
          </div>
        </div>
        <div class="form-group row">
          <div class="col-sm-4 form-check">
            <label class="form-check-label">
              <input
                id="app-related-sites"
                v-model="persistentState.hasRelatedSites"
                type="checkbox"
                class="form-check-input"
              />
              <span class="ml-2">Related Sites</span>
            </label>
          </div>
        </div>
      </b-container>
      <b-button
        type="submit"
        :disabled="state.isLoadingData"
        variant="primary"
        @click.prevent.stop="writeFile"
        >Extract Data</b-button
      >
    </form>
    <div class="p-2">
      Will consume
      <b>{{
        Number(
          selectedMetrics.length * persistentStore.appsIds.length
        ).toLocaleString()
      }}</b>
      API hits per run.
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
  </b-container>
</template>
