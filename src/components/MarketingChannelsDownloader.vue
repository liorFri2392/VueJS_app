<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import {
  arrayToCsvRow,
  secondsToHumanReadable,
  cleanDomain,
} from '../utils.js';

const STORAGE_NAME = 'similarwebMarketingChannelsMetrics';

let storedConfig = {};
try {
  const storedString = localStorage.getItem(STORAGE_NAME);
  if (storedConfig) {
    storedConfig = JSON.parse(storedString);
  }
} catch {
  console.error('Could not retrieve stored marketing channels config');
}

// Model
const state = reactive({
  isLoadingData: false,
  eta: '',
  progressBarMax: 0,
  progressBarValue: 0,
  metrics: [
    {
      label: 'Desktop Visits by Channel',
      name: 'Visits',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/traffic-sources/overview-share',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Visits by Channel',
      name: 'Visits',
      device: 'Mobile Web',
      endpoint:'/v5/website/{domain}/mobile-traffic-sources/mobile-overview-share',
      acceptedGranularities: ['monthly'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Desktop Bounce Rate by Channel',
      name: 'Bounce Rate by Channel',
      device: 'Desktop',
      endpoint:
        '/v1/website/{domain}/traffic-sources/engagement-metrics/bounce-rate',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Desktop Pages per Visit by Channel',
      name: 'Pages per Visit',
      device: 'Desktop',
      endpoint:
        '/v1/website/{domain}/traffic-sources/engagement-metrics/pages-per-visit',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Desktop Avg. Visit Duration by Channel',
      name: 'Avg. Visit Duration',
      device: 'Desktop',
      endpoint:
        '/v1/website/{domain}/traffic-sources/engagement-metrics/average-duration',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
  ],
  granularities: [
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
    const hasRequiredDataSets = metric.requiredDatasets.every(
      (dataSet) =>
        volatileStore.availableCountries?.[dataSet][persistentStore.country]
    );
    if (
      metric['endpoint'] !==
      '/v1/website/{domain}/traffic-sources/mobile-overview-share'
    ) {
      return hasGranularity && hasRequiredDataSets;
    }
  });
});
// Methods
async function writeFile() {
  const params = {
    api_key: persistentStore.apiKey,
    start_date: volatileStore.startDate,
    end_date: volatileStore.endDate,
    granularity: persistentState.granularity,
    country: persistentStore.country,
    main_domain_only: persistentStore.includeSubdomains ? 'false' : 'true',
    show_verified: 'false',
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();

  const headers = [
    'Domain',
    'Cleaned Domain',
    'Date',
    'Device',
    'Channel',
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
    suggestedName: 'similarweb-results_marketing-channels.csv',
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

  state.eta = '?';
  state.progressBarValue = 0;
  state.progressBarMax =
    persistentStore.domains.length * validSelectedMetrics.value.length;

  const lock = new Semaphore(1);

  const eta = makeEta({
    min: 0,
    max: state.progressBarMax,
    historyTimeConstant: 5,
  });
  eta.start();
  state.isLoadingData = true;
  await Promise.all(
    persistentStore.domains.map(async ([originalDomain, cleanedDomain]) => {
      // console.log(`Getting data for domain ${domain}`);
      const domResults = {};
      cleanedDomain = cleanDomain(originalDomain);
      console.log(cleanedDomain);
      for (const metric of validSelectedMetrics.value) {
        let response = null;
        try {
          response = await similarwebApiClient.get(
            `${metric.endpoint.replace(
              /{domain}/,
              cleanedDomain
            )}?${queryString}`
          );
        } catch (err) {
          if (err.response.status === 404) {
            console.error(
              `No ${metric.name} data for domain ${cleanedDomain}!`
            );
          } else {
            console.error(err.response.status);
            console.error(err.response.data);
          }
        }

        if (response && response.status >= 200 && response.status < 300) {
          if (!domResults[metric.device]) {
            domResults[metric.device] = {};
          }

          if (metric.name === 'Visits') {
            const sources = response?.data?.visits?.[cleanedDomain] || [];
            for (const src of sources) {
              const srcType =
                src.source_type === 'Mail' ? 'Email' : src.source_type;
              if (metric.device === 'Desktop' && srcType === 'Paid Search') {
                continue;
              }
              if (metric.device === 'Desktop' && srcType === 'Organic Search') {
                continue;
              }
              if (metric.device === 'Desktop' && srcType === 'Search') {
                if (!domResults[metric.device]['Organic Search']) {
                  domResults[metric.device]['Organic Search'] = {};
                  domResults[metric.device]['Paid Search'] = {};
                }
                for (const val of src.visits) {
                  if (!domResults[metric.device]['Organic Search'][val.date]) {
                    domResults[metric.device]['Organic Search'][val.date] = {};
                  }
                  domResults[metric.device]['Organic Search'][val.date][
                    metric.name
                  ] = val.organic;
                  if (!domResults[metric.device]['Paid Search'][val.date]) {
                    domResults[metric.device]['Paid Search'][val.date] = {};
                  }
                  domResults[metric.device]['Paid Search'][val.date][
                    metric.name
                  ] = val.paid;
                }
              } else {
                if (!domResults[metric.device][srcType]) {
                  domResults[metric.device][srcType] = {};
                }
                for (const val of src.visits) {
                  if (!domResults[metric.device][srcType][val.date]) {
                    domResults[metric.device][srcType][val.date] = {};
                  }
                  domResults[metric.device][srcType][val.date][metric.name] =
                    metric.device === 'Desktop'
                      ? val.organic + val.paid
                      : val.visits;
                }
              }
            }
          } else {
            const values = response?.data?.data || [];
            for (const src of values) {
              if (src.source_type === 'All Channels') {
                continue;
              }
              if (!domResults[metric.device][src.source_type]) {
                domResults[metric.device][src.source_type] = {};
              }
              for (const val of src.values) {
                if (!domResults[metric.device][src.source_type][val.date]) {
                  domResults[metric.device][src.source_type][val.date] = {};
                }
                domResults[metric.device][src.source_type][val.date][
                  metric.name
                ] = val.value;
              }
            }
          }
        }

        state.progressBarValue++;
        eta.report(state.progressBarValue);
        state.eta = eta.estimate();
      }

      await lock.acquire();
      for (const [deviceName, deviceVal] of Object.entries(domResults)) {
        for (const [srcType, srcVal] of Object.entries(deviceVal)) {
          for (const [date, val] of Object.entries(srcVal)) {
            const values = {
              Domain: originalDomain,
              'Cleaned Domain': cleanedDomain,
              Device: deviceName,
              Date: date,
              Country:
                volatileStore.availableCountries.desktop[
                  persistentStore.country
                ],
              Channel: srcType,
              ...val,
            };
            const dataRow = headers.map((header) => values?.[header] ?? '');
            await fileStream.write({
              type: 'write',
              data: arrayToCsvRow(dataRow),
            });
          }
        }
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
  <div>
    <!-- <h3>Extract Marketing Channels Data</h3> -->
    <h4>Metrics</h4>
    <form>
      <div class="form-group row mb-3">
        <label for="granularity" class="col-sm-2 col-form-label"
          >Granularity</label
        >
        <div class="col-sm-4">
          <b-form-select
            id="granularity-traffic"
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
                'text-muted':
                  !metric.acceptedGranularities.includes(
                    persistentState.granularity
                  ) ||
                  !metric.requiredDatasets.every((dataSet) =>
                    volatileStore.availableCountries?.[dataSet].hasOwnProperty(
                      persistentStore.country
                    )
                  ),
              }"
            >
              <input
                :id="metric.label"
                v-model="persistentState.selectedMetrics"
                type="checkbox"
                class="form-check-input"
                :value="metric"
                :disabled="
                  !metric.acceptedGranularities.includes(
                    persistentState.granularity
                  ) ||
                  !metric.requiredDatasets.every((dataSet) =>
                    volatileStore.availableCountries?.[dataSet].hasOwnProperty(
                      persistentStore.country
                    )
                  )
                "
              />
              <span class="ml-2">{{ metric.label }}</span>
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
      <b>{{ validSelectedMetrics.length * persistentStore.domains.length }}</b>
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
  </div>
</template>
