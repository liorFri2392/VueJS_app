<script setup>
import { reactive, onMounted } from 'vue';

import 'vue-good-table-next/dist/vue-good-table-next.css';
import { VueGoodTable } from 'vue-good-table-next';

import { similarwebApiClient } from '../apiClient.js';
import { persistentStore, volatileStore } from '../store.js';

// Model
const state = reactive({
  loadingSegments: false,
  availableSegments: [],
  selectedSegments: [],
  columns: [
    {
      label: 'ID',
      field: 'id',
      hidden: true,
    },
    {
      label: 'Domain',
      field: 'domain',
    },
    {
      label: 'Name',
      field: 'name',
    },
    {
      label: 'Country',
      field: 'countryName',
    },
    {
      label: 'Country Code',
      field: 'countryCode',
      hidden: true,
    },
  ],
});

onMounted(() => {
  state.selectedSegments = persistentStore.conversionSegments;
});

// Methods
function confirmSelection() {
  persistentStore.conversionSegments = state.selectedSegments;
}

function selectionChanged(params) {
  state.selectedSegments = params.selectedRows;
}

async function onModalShow() {
  state.loadingSegments = true;

  const params = {
    api_key: persistentStore.apiKey,
  };
  const queryString = new URLSearchParams(params).toString();

  let response = null;
  try {
    response = await similarwebApiClient.get(
      `/v1/segment/conversion-analysis/describe?${queryString}`
    );
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.data);
  }

  if (response && response.status >= 200 && response.status < 300) {
    state.availableSegments = [];

    const segments = response?.data?.response?.segments || [];

    segments.forEach((seg) => {
      seg.available_countries.forEach((cc) => {
        const countryCode = cc.toLowerCase();
        const countryName =
          volatileStore.availableCountries.desktop[countryCode];

        state.availableSegments.push({
          id: seg.segment_id,
          name: seg.segment || 'All Site',
          domain: seg.site,
          countryCode: cc,
          countryName,
        });
      });
    });
  }

  params.selectedRows = state.selectedSegments;
  state.loadingSegments = false;
}
</script>

<template>
  <div class="mb-4">
    <h4>Conversion Segments</h4>
    <p>
      <b>{{ persistentStore.conversionSegments.length }}</b> segments:
      {{
        persistentStore.conversionSegments
          .map((seg) => `${seg.domain} - ${seg.name} (${seg.countryName})`)
          .slice(0, 10)
          .join(', ')
      }}{{ persistentStore.conversionSegments.length > 10 ? ',...' : '' }}
    </p>

    <div class="flex-shrink-1 mx-3">
      <b-button v-b-modal.modal-segments variant="primary"
        >Choose Conversion Segments</b-button
      >
    </div>
    <b-modal
      id="modal-segments"
      title="Choose Segments"
      ok-title="Confirm Selection"
      :fullscreen="true"
      @ok="confirmSelection"
      @show="onModalShow"
    >
      <div v-if="!state.loadingSegments" class="m-4">
        <VueGoodTable
          :columns="state.columns"
          :rows="state.availableSegments"
          max-height="400px"
          :select-options="{
            enabled: true,
            selectOnCheckboxOnly: true,
          }"
          :search-options="{ enabled: true }"
          @selected-rows-change="selectionChanged"
        >
          <template #emptystate> No segments found! </template>
        </VueGoodTable>
      </div>
      <div v-else class="m-4 text-center">
        <div class="spinner-border text-secondary" role="status">
          <span class="visually-hidden">Loading segments details...</span>
        </div>
        <div>Loading segments...</div>
      </div>
    </b-modal>
  </div>
</template>
