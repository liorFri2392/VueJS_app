<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { arrayToCsvRow, secondsToHumanReadable } from '../utils.js';

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
  metrics: [
    {
      name: 'Install Penetration',
      endpoint: '/v1/app/{store}/{appId}/engagement/current-installs',
      dataset_name: 'current_installs',
      object_name: 'installs',
      acceptedGranularities: ['', 'monthly', 'weekly', 'daily'],
    },
    {
      name: 'Daily Active Users',
      endpoint: '/v1/app/{store}/{appId}/engagement/dau',
      dataset_name: 'daily_active_users',
      object_name: 'active_users',
      acceptedGranularities: ['', 'monthly', 'weekly', 'daily'],
    },
    {
      name: 'Monthly Active Users',
      endpoint: '/v1/app/{store}/{appId}/engagement/mau',
      dataset_name: 'monthly_active_users',
      object_name: 'active_users',
      acceptedGranularities: ['monthly'],
    },
    {
      name: 'Unique Installs',
      endpoint: '/v1/app/{store}/{appId}/engagement/unique-installs',
      dataset_name: 'unique_installs',
      object_name: 'unique_installs',
      acceptedGranularities: ['', 'monthly', 'weekly', 'daily'],
    },
    {
      name: 'Downloads',
      endpoint: '/v1/app/{store}/{appId}/engagement/downloads',
      dataset_name: 'downloads',
      object_name: 'downloads',
      acceptedGranularities: ['', 'monthly', 'weekly', 'daily'],
    },
  ],
  granularities: [
    {
      text: 'Aggregated',
      value: '',
    },
    {
      text: 'Monthly',
      value: 'monthly',
    },
    {
      text: 'Weekly',
      value: 'weekly',
    },
    {
      text: 'Daily',
      value: 'daily',
    },
  ],
});

const persistentState = reactive({
  selectedMetrics: [],
  granularity: 'monthly',
  ...storedConfig, // override defaults with stored values
});

watch(
  () => _.cloneDeep(persistentState),
  (currentValue) => {
    localStorage.setItem(STORAGE_NAME, JSON.stringify(currentValue));
  }
);

// Computed
// const progress = computed(() => state.progressBarMax > 0 ? `${(100 * (state.progressBarValue/state.progressBarMax)).toFixed(1)}%` : 0);

const validSelectedMetrics = computed(() => {
  return persistentState.selectedMetrics.filter((metric) => {
    const hasGranularity = metric.acceptedGranularities.includes(
      persistentState.granularity
    );
    return hasGranularity;
  });
});

// Methods
async function writeFile() {
  const params = {
    api_key: persistentStore.apiKey,
    start_date: volatileStore.startDate,
    end_date: volatileStore.endDate,
    granularity: persistentState.granularity,
    country: persistentStore.appsCountry,
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();

  const headers = [
    'App ID',
    'Cleaned App ID',
    'Date Range - Start',
    'Date Range - End',
    'Store',
    'Country',
  ].concat(
    Array.from(new Set(validSelectedMetrics.value.map((metric) => metric.name)))
  );

  const opts = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    suggestedName: 'similarweb-results_apps-engagement.csv',
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
    persistentStore.appsIds.length * validSelectedMetrics.value.length;

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
        const appResults = {};

        for (const metric of validSelectedMetrics.value) {
          let response = null;
          try {
            response = await similarwebApiClient.get(
              `${metric.endpoint
                .replace(/{store}/, store)
                .replace(/{appId}/, cleanedAppId)}?${queryString}`
            );
          } catch (err) {
            if (err.response.status === 404) {
              console.error(
                `No ${metric.name} data for app ID ${cleanedAppId}!`
              );
            } else {
              console.error(err.response.status);
              console.error(err.response.data);
            }
          }

          if (response && response.status >= 200 && response.status < 300) {
            const values = response?.data?.[metric.dataset_name] ?? [];
            for (const val of values) {
              if (!appResults[val.start_date]) {
                appResults[val.start_date] = {
                  'App ID': originalAppId,
                  'Cleaned App ID': cleanedAppId,
                  Store: store,
                  'Date Range - Start': val.start_date,
                  'Date Range - End': val.end_date,
                  Country:
                    volatileStore.availableCountries.apps[
                      persistentStore.country
                    ],
                };
              }

              const keys = metric.object_name.split('/');
              let value = val;
              for (const key of keys) {
                value = value?.[key] ?? {};
              }
              appResults[val.start_date][metric.name] = value;
            }
          }

          state.progressBarValue++;
          eta.report(state.progressBarValue);
          state.eta = eta.estimate();
        }

        await lock.acquire();
        for (const val of Object.values(appResults)) {
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
      <div class="form-group row mb-3">
        <label for="granularity" class="col-sm-2 col-form-label"
          >Granularity</label
        >
        <div class="col-sm-4">
          <b-form-select
            id="granularity-apps"
            v-model="persistentState.granularity"
            :options="state.granularities"
            :class="{
              'is-invalid':
                persistentStore.timePeriodType === 'last_28_days' &&
                persistentState.granularity === 'monthly',
            }"
          ></b-form-select>
          <small
            v-if="
              persistentStore.timePeriodType === 'last_28_days' &&
              persistentState.granularity === 'monthly'
            "
            id="garnularity-help"
            class="form-text text-danger"
            >Not supported for the last 28 days</small
          >
        </div>
      </div>
      <b-container>
        <div class="form-group row">
          <div
            v-for="(metric, i) in state.metrics"
            :key="`metric_${i}`"
            class="col-sm-4 form-check"
          >
            <label
              class="form-check-label"
              :class="{
                'text-muted': !metric.acceptedGranularities.includes(
                  persistentState.granularity
                ),
              }"
            >
              <input
                :id="metric.name"
                v-model="persistentState.selectedMetrics"
                type="checkbox"
                class="form-check-input"
                :value="metric"
                :disabled="
                  !metric.acceptedGranularities.includes(
                    persistentState.granularity
                  )
                "
              />
              <span class="ml-2">{{ metric.name }}</span>
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
          validSelectedMetrics.length * persistentStore.appsIds.length
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
