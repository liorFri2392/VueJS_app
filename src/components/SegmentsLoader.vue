<script setup>
import { reactive, onMounted } from 'vue';

import 'vue-good-table-next/dist/vue-good-table-next.css';
import { VueGoodTable } from 'vue-good-table-next';

import { similarwebApiClient } from '../apiClient.js';
import { persistentStore } from '../store.js';

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
      label: 'Name',
      field: 'name',
    },
    {
      label: 'Domain',
      field: 'domain',
    },
    {
      label: 'Creator',
      field: 'creator',
    },
    {
      label: 'Creation Date',
      field: 'created',
      type: 'date',
      dateInputFormat: 'yyyy-MM-dd',
      dateOutputFormat: 'MMM do yy',
    },
    {
      label: 'Last Updated',
      field: 'lastUpdated',
      type: 'date',
      dateInputFormat: 'yyyy-MM-dd',
      dateOutputFormat: 'MMM do yy',
    },
  ],
});

onMounted(() => {
  state.selectedSegments = persistentStore.segments;
});

// Methods
function confirmSelection() {
  persistentStore.segments = state.selectedSegments;
}

function selectionChanged(params) {
  state.selectedSegments = params.selectedRows;
}

async function onModalShow() {
  state.loadingSegments = true;

  const params = {
    api_key: persistentStore.apiKey,
    userOnlySegments: 'false',
  };
  const queryString = new URLSearchParams(params).toString();

  let response = null;
  try {
    response = await similarwebApiClient.get(
      `/v1/segment/traffic-and-engagement/describe?${queryString}`
    );
  } catch (err) {
    console.error(err.response.status);
    console.error(err.response.data);
  }

  if (response && response.status >= 200 && response.status < 300) {
    const segments = response?.data?.response?.segments || [];
    state.availableSegments = segments.map((seg) => {
      return {
        id: seg.segment_id,
        name: seg.segment_name,
        domain: seg.domain,
        creator: seg.creator_email,
        created: seg.creation_time,
        lastUpdated: seg.last_updated_time,
      };
    });
  }

  params.selectedRows = state.selectedSegments;
  state.loadingSegments = false;
}
</script>

<template>
  <div class="mb-4">
    <h4>Segments</h4>
    <p>
      <b>{{ persistentStore.segments.length }}</b> segments:
      {{
        persistentStore.segments
          .map((seg) => `${seg.name} (${seg.domain})`)
          .slice(0, 10)
          .join(', ')
      }}{{ persistentStore.segments.length > 10 ? ',...' : '' }}
    </p>

    <div class="flex-shrink-1 mx-3">
      <b-button v-b-modal.modal-segments variant="primary"
        >Choose Segments</b-button
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
