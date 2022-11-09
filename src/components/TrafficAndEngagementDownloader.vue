<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { arrayToCsvRow, secondsToHumanReadable,cleanDomain } from '../utils.js';

const STORAGE_NAME = 'similarwebSelectedTrafficMetrics';

let storedConfig = {};
try {
  const storedString = localStorage.getItem(STORAGE_NAME);
  if (storedConfig) {
    storedConfig = JSON.parse(storedString);
  }
} catch {
  console.error('Could not retrieve stored traffic & engagement config');
}

// Model
const state = reactive({
  isLoadingData: false,
  eta: '',
  progressBarMax: 0,
  progressBarValue: 0,
  metrics: [
    {
      label: 'Total Visits',
      name: 'Visits',
      device: 'Desktop & Mobile Web',
      endpoint: '/v1/website/{domain}/total-traffic-and-engagement/visits',
      dataset_name: 'visits',
      object_name: 'visits',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Visits',
      name: 'Visits',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/traffic-and-engagement/visits',
      dataset_name: 'visits',
      object_name: 'visits',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Visits',
      name: 'Visits',
      device: 'Mobile Web',
      endpoint: '/v2/website/{domain}/mobile-web/visits',
      dataset_name: 'visits',
      object_name: 'visits',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Total Bounce Rate',
      name: 'Bounce Rate',
      device: 'Desktop & Mobile Web',
      endpoint: '/v1/website/{domain}/total-traffic-and-engagement/bounce-rate',
      dataset_name: 'bounce_rate',
      object_name: 'bounce_rate',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Bounce Rate',
      name: 'Bounce Rate',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/traffic-and-engagement/bounce-rate',
      dataset_name: 'bounce_rate',
      object_name: 'bounce_rate',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Bounce Rate',
      name: 'Bounce Rate',
      device: 'Mobile Web',
      endpoint: '/v2/website/{domain}/mobile-web/bounce-rate',
      dataset_name: 'bounce_rate',
      object_name: 'bounce_rate',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Total Pages per Visit',
      name: 'Pages per Visit',
      device: 'Desktop & Mobile Web',
      endpoint:
        '/v1/website/{domain}/total-traffic-and-engagement/pages-per-visit',
      dataset_name: 'pages_per_visit',
      object_name: 'pages_per_visit',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Pages per Visit',
      name: 'Pages per Visit',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/traffic-and-engagement/pages-per-visit',
      dataset_name: 'pages_per_visit',
      object_name: 'pages_per_visit',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Pages per Visit',
      name: 'Pages per Visit',
      device: 'Mobile Web',
      endpoint: '/v2/website/{domain}/mobile-web/pages-per-visit',
      dataset_name: 'pages_per_visit',
      object_name: 'pages_per_visit',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Total Page Views',
      name: 'Page Views',
      device: 'Desktop & Mobile Web',
      endpoint: '/v1/website/{domain}/total-traffic-and-engagement/page-views',
      dataset_name: 'pages_views',
      object_name: 'pages_views',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Page Views',
      name: 'Page Views',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/traffic-and-engagement/page-views',
      dataset_name: 'pages_views',
      object_name: 'pages_views',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Page Views',
      name: 'Page Views',
      device: 'Mobile Web',
      endpoint: '/v2/website/{domain}/mobile-web/page-views',
      dataset_name: 'pages_views',
      object_name: 'pages_views',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Total Avg. Visit Duration',
      name: 'Avg. Visit Duration',
      device: 'Desktop & Mobile Web',
      endpoint:
        '/v1/website/{domain}/total-traffic-and-engagement/average-visit-duration',
      dataset_name: 'average_visit_duration',
      object_name: 'average_visit_duration',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Avg. Visit Duration',
      name: 'Avg. Visit Duration',
      device: 'Desktop',
      endpoint:
        '/v1/website/{domain}/traffic-and-engagement/average-visit-duration',
      dataset_name: 'average_visit_duration',
      object_name: 'average_visit_duration',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Avg. Visit Duration',
      name: 'Avg. Visit Duration',
      device: 'Mobile Web',
      endpoint: '/v2/website/{domain}/mobile-web/average-visit-duration',
      dataset_name: 'average_visit_duration',
      object_name: 'average_visit_duration',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
      requiredDatasets: ['mobile'],
    },
    {
      label: 'Deduplicated Audience',
      name: 'Unique Visitors',
      device: 'Desktop & Mobile Web',
      endpoint: '/v1/website/{domain}/dedup/deduplicated-audiences',
      dataset_name: 'data',
      object_name: 'dedup_data/total_deduplicated_audience',
      acceptedGranularities: ['monthly'],
      requiredDatasets: ['desktop', 'mobile'],
    },
    {
      label: 'Desktop Unique Visitors',
      name: 'Unique Visitors',
      device: 'Desktop',
      endpoint: '/v1/website/{domain}/unique-visitors/desktop_unique_visitors',
      dataset_name: 'unique_visitors',
      object_name: 'unique_visitors',
      acceptedGranularities: ['monthly', 'daily'],
      requiredDatasets: ['desktop'],
    },
    {
      label: 'Mobile Web Unique Visitors',
      name: 'Unique Visitors',
      device: 'Mobile Web',
      endpoint:
        '/v1/website/{domain}/unique-visitors/mobileweb_unique_visitors',
      dataset_name: 'unique_visitors',
      object_name: 'unique_visitors',
      acceptedGranularities: ['monthly', 'daily'],
      requiredDatasets: ['mobile'],
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
    return hasGranularity && hasRequiredDataSets;
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
    suggestedName: 'similarweb-results_traffic-and-engagement.csv',
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
      cleanedDomain =  cleanDomain(originalDomain)
      // console.log(`Getting data for domain ${domain}`);
      const domResults = {};

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
          const values = response?.data?.[metric.dataset_name] || [];
          for (const val of values) {
            if (!domResults[metric.device]) {
              domResults[metric.device] = {};
            }
            if (!domResults[metric.device][val.date]) {
              domResults[metric.device][val.date] = {
                Domain: originalDomain,
                'Cleaned Domain': cleanedDomain,
                Device: metric.device,
                Date: val.date,
                Country:
                  volatileStore.availableCountries.desktop[
                    persistentStore.country
                  ],
              };
            }

            const keys = metric.object_name.split('/');
            let value = val;
            for (const key of keys) {
              value = value?.[key] ?? {};
            }
            domResults[metric.device][val.date][metric.name] = value;
          }
        }
        state.progressBarValue++;
        eta.report(state.progressBarValue);
        state.eta = eta.estimate();
      }

      await lock.acquire();
      for (const deviceVal of Object.values(domResults)) {
        for (const val of Object.values(deviceVal)) {
          const dataRow = headers.map((header) => val?.[header] ?? '');
          await fileStream.write({
            type: 'write',
            data: arrayToCsvRow(dataRow),
          });
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
    <!-- <h3>Extract Traffic and Engagement Data</h3> -->
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
      <b>{{
        Number(
          validSelectedMetrics.length * persistentStore.domains.length
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
  </div>
</template>
