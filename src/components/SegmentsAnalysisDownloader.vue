<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { arrayToCsvRow, secondsToHumanReadable } from '../utils.js';

const STORAGE_NAME = 'similarwebSelectedSegmentMetrics';

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
      name: 'Visits',
      option: 'visits',
      objectName: 'visits',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Share',
      option: 'share',
      objectName: 'share',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Pages per Visit',
      option: 'pages-per-visit',
      objectName: 'pages_per_visit',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Page Views',
      option: 'page-views',
      objectName: 'page_views',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Bounce Rate',
      option: 'bounce-rate',
      objectName: 'bounce_rate',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Avg. Visit Duration',
      option: 'visit-duration',
      objectName: 'visit_duration',
      acceptedGranularities: ['monthly', 'weekly', 'daily'],
    },
    {
      name: 'Unique Visitors',
      option: 'unique-visitors',
      objectName: 'unique_visitors',
      acceptedGranularities: ['monthly'],
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
    const isValidGranularity = metric.acceptedGranularities.includes(
      persistentState.granularity
    );
    const isValidCountry = !(
      metric.option === 'unique-visitors' && persistentStore.country === 'world'
    );
    return isValidGranularity && isValidCountry;
  });
});

// Methods
async function writeFile() {
  const countryName =
    volatileStore.availableCountries.desktop[persistentStore.country];

  const params = {
    api_key: persistentStore.apiKey,
    start_date: volatileStore.startDate,
    end_date: volatileStore.endDate,
    granularity: persistentState.granularity,
    country: persistentStore.country,
    metrics: validSelectedMetrics.value
      .map((metric) => metric.option)
      .join(','),
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();

  const headers = [
    'Segment ID',
    'Segment Name',
    'Domain',
    'Date',
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
    suggestedName: 'similarweb-results_segments-analysis.csv',
    multiple: false,
  };

  let fileHandle;
  try {
    fileHandle = await window.showSaveFilePicker(opts);
  } catch (err) {
    console.error(err);
    return;
  }

  if (!fileHandle) return;

  const fileStream = await fileHandle.createWritable();
  fileStream.write('\uFEFF'); // Notify Excel that we're using UTF-8
  await fileStream.write({ type: 'write', data: arrayToCsvRow(headers) });

  const lock = new Semaphore(1);

  state.eta = '?';
  state.progressBarValue = 0;
  state.progressBarMax = persistentStore.segments.length;

  const eta = makeEta({
    min: 0,
    max: state.progressBarMax,
    historyTimeConstant: 5,
  });
  eta.start();

  state.isLoadingData = true;

  for (const segment of persistentStore.segments) {
    let response = null;

    try {
      response = await similarwebApiClient.get(
        `/v1/segment/${segment.id}/traffic-and-engagement/query?${queryString}`
      );
    } catch (err) {
      if (err?.response?.status === 404) {
        console.error(`No data for segment ${segment.id}!`);
      } else {
        console.error(err);
      }
    }

    if (response && response.status >= 200 && response.status < 300) {
      await lock.acquire();
      for (const val of response?.data?.segments ?? []) {
        const dataRow = [
          segment.id,
          segment.name,
          segment.domain,
          val.date,
          countryName,
        ].concat(
          validSelectedMetrics.value.map(
            (metric) => val?.[metric.objectName] ?? ''
          )
        );
        await fileStream.write({ type: 'write', data: arrayToCsvRow(dataRow) });
      }
      lock.release();
    }

    state.progressBarValue++;
    eta.report(state.progressBarValue);
    state.eta = eta.estimate();
  }

  await fileStream.close();

  state.isLoadingData = false;
  console.log('done!');
  window.alert('File downloaded successfully!');
}
</script>

<template>
  <div>
    <!-- <h3>Extract Segments Data</h3> -->
    <h4>Metrics</h4>
    <form>
      <div class="form-group row mb-3">
        <label for="granularity" class="col-sm-2 col-form-label"
          >Granularity</label
        >
        <div class="col-sm-4">
          <b-form-select
            id="granularity-segments"
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
          <!-- <span class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Metrics</span> -->
          <div
            v-for="(metric, i) in state.metrics"
            :key="`metric_${i}`"
            class="col-sm-4 form-check"
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
                (metric.option === 'unique-visitors' &&
                  persistentStore.country === 'world')
              "
            />
            <label
              class="form-check-label"
              :class="{
                'text-muted':
                  !metric.acceptedGranularities.includes(
                    persistentState.granularity
                  ) ||
                  (metric.option === 'unique-visitors' &&
                    persistentStore.country === 'world'),
              }"
            >
              {{ metric.name }}
            </label>
          </div>
        </div>
      </b-container>
      <div class="p-2">
        Will consume
        <b>{{
          Number(
            validSelectedMetrics.length * persistentStore.segments.length
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
      <b-button
        type="submit"
        :disabled="state.isLoadingData"
        variant="primary"
        @click.prevent.stop="writeFile"
        >Extract Data</b-button
      >
    </form>
  </div>
</template>
