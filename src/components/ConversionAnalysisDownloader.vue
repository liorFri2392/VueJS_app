<script setup>
import { reactive, computed, watch } from 'vue';
import Semaphore from 'semaphore-async-await';

import _ from 'lodash';
import makeEta from 'simple-eta';

import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { arrayToCsvRow, secondsToHumanReadable } from '../utils.js';

const STORAGE_NAME = 'similarwebSelectedConversionMetrics';

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
      acceptedGranularities: ['monthly'],
    },
    {
      name: 'Converted Visits',
      option: 'converted-visits',
      objectName: 'converted_visits',
      acceptedGranularities: ['monthly'],
    },
    {
      name: 'Conversion Rate',
      option: 'conversion-rate',
      objectName: 'conversion_rate',
      acceptedGranularities: ['monthly'],
    },
    {
      name: 'Stickiness',
      option: 'stickiness',
      objectName: 'stickiness',
      acceptedGranularities: ['monthly'],
    },
  ],
  channels: [
    {
      text: 'All (Aggregated)',
      value: 'total',
    },
    {
      text: 'Direct',
      value: 'direct',
    },
    {
      text: 'Paid Search',
      value: 'paid-search',
    },
    {
      text: 'Organic Search',
      value: 'organic-search',
    },
    {
      text: 'Display Ads',
      value: 'display-ads',
    },
    {
      text: 'Referrals',
      value: 'referrals',
    },
    {
      text: 'Email',
      value: 'mail',
    },
    {
      text: 'Social',
      value: 'social',
    },
  ],
  granularities: [
    {
      text: 'Monthly',
      value: 'monthly',
    },
  ],
});

const persistentState = reactive({
  selectedMetrics: [],
  selectedChannels: [
    {
      text: 'All (Aggregated)',
      value: 'total',
    },
  ],
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
    return isValidGranularity;
  });
});

// Methods
async function writeFile() {
  const params = {
    api_key: persistentStore.apiKey,
    start_date: volatileStore.conversionStartDate,
    end_date: volatileStore.conversionEndDate,
    granularity: persistentState.granularity,
    main_domain_only: 'false',
    metrics: validSelectedMetrics.value
      .map((metric) => metric.option)
      .join(','),
    format: 'json',
  };

  const headers = [
    'Conversion Segment ID',
    'Domain',
    'Segment Name',
    'Channel',
    'Country',
    'Date',
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
    suggestedName: 'similarweb-results_conversion-analysis.csv',
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
  state.progressBarMax =
    persistentStore.conversionSegments.length *
    persistentState.selectedChannels.length;

  const eta = makeEta({
    min: 0,
    max: state.progressBarMax,
    historyTimeConstant: 5,
  });
  eta.start();

  state.isLoadingData = true;

  for (const conversionSegment of persistentStore.conversionSegments) {
    params.country = conversionSegment.countryCode;

    for (const channel of persistentState.selectedChannels) {
      params.channel = channel.value;

      let response = null;

      const queryString = new URLSearchParams(params).toString();

      try {
        response = await similarwebApiClient.get(
          `/v1/segment/${conversionSegment.id}/conversion-analysis/query?${queryString}`
        );
      } catch (err) {
        if (err?.response?.status === 404) {
          console.error(`No data for segment ${conversionSegment.id}!`);
        } else {
          console.error(err);
        }
      }

      if (response && response.status >= 200 && response.status < 300) {
        await lock.acquire();
        for (const val of response?.data?.segments ?? []) {
          const dataRow = [
            conversionSegment.id,
            conversionSegment.domain,
            conversionSegment.name,
            channel.text,
            conversionSegment.countryName,
            val.date,
          ].concat(
            validSelectedMetrics.value.map(
              (metric) => val?.[metric.objectName] ?? ''
            )
          );
          await fileStream.write({
            type: 'write',
            data: arrayToCsvRow(dataRow),
          });
        }
        lock.release();
      }

      state.progressBarValue++;
      eta.report(state.progressBarValue);
      state.eta = eta.estimate();
    }
  }

  await fileStream.close();
  state.isLoadingData = false;
  console.log('done!');
  window.alert('File downloaded successfully!');
}
</script>

<template>
  <div>
    <form>
      <!-- <div class="form-group row">
        <label for="granularity" class="col-sm-2 col-form-label">Granularity</label>
        <div class="col-sm-4">
          <b-form-select v-model="persistentState.granularity" id="granularity-conversion" :options="state.granularities"></b-form-select>
        </div>
      </div> -->
      <h4>Channels</h4>
      <div class="form-group row mb-3">
        <div
          v-for="(channel, i) in state.channels"
          :key="`channel_${i}`"
          class="col-sm-4 form-check"
        >
          <input
            :id="channel.value"
            v-model="persistentState.selectedChannels"
            type="checkbox"
            class="form-check-input"
            :value="channel"
          />
          <label class="form-check-label">{{ channel.text }}</label>
        </div>
      </div>
      <h4>Metrics</h4>
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
              )
            "
          />
          <label
            class="form-check-label"
            :class="{
              'text-muted': !metric.acceptedGranularities.includes(
                persistentState.granularity
              ),
            }"
          >
            {{ metric.name }}
          </label>
        </div>
      </div>
      <div class="p-2">
        Will consume
        <b>{{
          Number(
            validSelectedMetrics.length *
              persistentStore.conversionSegments.length *
              persistentState.selectedChannels.length
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
