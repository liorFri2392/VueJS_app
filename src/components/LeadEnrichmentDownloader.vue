<script setup>
import { reactive } from 'vue';
import Semaphore from 'semaphore-async-await';
// import _ from 'lodash';
import makeEta from 'simple-eta';
import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import {
  arrayToCsvRow,
  dateToYearMonth,
  decodeCountry,
  cleanDomain,
  secondsToHumanReadable,
} from '../utils.js';

// Model
const state = reactive({
  isLoadingData: false,
  eta: '',
  progressBarMax: 0,
  progressBarValue: 0,
  metrics: [
    {
      label: 'Lead Enrichment',
      name: 'Lead Enrichment',
      device: 'Desktop & Mobile Web',
      endpoint: '/v1/website/{domain}/lead-enrichment/all',
    },
  ],
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
    'Domain',
    'Cleaned Domain',
    'Metric',
    'Time Period',
    'Value',
  ];
  const opts = {
    types: [
      {
        description: 'CSV file',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    suggestedName: 'similarweb-results_lead-enrichment.csv',
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
          `/v1/website/${cleanedDomain}/lead-enrichment/all?${queryString}`
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
        const data = response.data;
        const startDate = volatileStore.startDate;
        const endDate = volatileStore.endDate;
        results.push([
          originalDomain,
          cleanedDomain,
          'Global Rank',
          startDate + ' - ' + endDate,
          data.global_rank ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Site Type',
          startDate + ' - ' + endDate,
          data.site_type ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Employee Range',
          startDate + ' - ' + endDate,
          data.employee_range ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Estimated Revenue (USD)',
          startDate + ' - ' + endDate,
          data.estimated_revenue_in_usd ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Zip Code',
          startDate + ' - ' + endDate,
          data.zip_code ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Headquarters',
          startDate + ' - ' + endDate,
          data.headquarters ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Website Category',
          startDate + ' - ' + endDate,
          data.website_category ?? '',
        ]);
        results.push([
          originalDomain,
          cleanedDomain,
          'Category Rank',
          startDate + ' - ' + endDate,
          data.category_rank ?? '',
        ]);
        (data.visits ?? []).forEach(function (visits) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Visits',
            dateToYearMonth(visits.date),
            visits.value,
          ]);
        });
        (data.mom_growth ?? []).forEach(function (growth) {
          results.push([
            originalDomain,
            cleanedDomain,
            'MoM Growth',
            dateToYearMonth(growth.date),
            growth.value,
          ]);
        });
        (data.unique_visitors ?? []).forEach(function (uv) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Unique Visitors',
            dateToYearMonth(uv.date),
            uv.value,
          ]);
        });
        (data.pages_per_visit ?? []).forEach(function (ppv) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Pages per Visit',
            dateToYearMonth(ppv.date),
            ppv.value,
          ]);
        });
        (data.bounce_rate ?? []).forEach(function (br) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Bounce Rate',
            dateToYearMonth(br.date),
            br.value,
          ]);
        });
        (data.average_visit_duration ?? []).forEach(function (avd) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Avg. Visit Duration',
            dateToYearMonth(avd.date),
            avd.value,
          ]);
        });
        (data.mobile_desktop_share ?? []).forEach(function (mdshare) {
          results.push([
            originalDomain,
            cleanedDomain,
            'Desktop Share',
            dateToYearMonth(mdshare.date),
            mdshare.value.desktop_share,
          ]);
          results.push([
            originalDomain,
            cleanedDomain,
            'Mobile Web Share',
            dateToYearMonth(mdshare.date),
            mdshare.value.mobile_share,
          ]);
        });
        (data.traffic_sources ?? []).forEach(function (monthlyValues) {
          var month = dateToYearMonth(monthlyValues.date);
          (monthlyValues.value ?? []).forEach(function (src) {
            results.push([
              originalDomain,
              cleanedDomain,
              src.source_type + ' Share',
              month,
              src.share,
            ]);
          });
        });
        data.geography_share.forEach(function (monthlyValues) {
          var month = dateToYearMonth(monthlyValues.date);
          (monthlyValues.value ?? []).forEach(function (ctry, i) {
            var percentage = (100 * ctry.share).toFixed(2);
            results.push([
              originalDomain,
              cleanedDomain,
              '#' + (i + 1) + ' Country',
              month,
              decodeCountry(ctry.country) + ' (' + percentage + '%)',
            ]);
          });
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
