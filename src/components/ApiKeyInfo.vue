<script setup>
import { ref, onMounted } from 'vue';
import { persistentStore, volatileStore } from '../store.js';
import { similarwebApiClient } from '../apiClient.js';
import { monthsBetween } from '../utils.js';

const remainingHits = ref(null);
const modalKey = ref(persistentStore.apiKey);
const isLoading = ref(true);

onMounted(async () => {
  await getApiKeyInfo();
  isLoading.value = false;
});

async function updateApiKey() {
  if (modalKey.value !== persistentStore.apiKey) {
    persistentStore.segments = [];
    persistentStore.apiKey = modalKey.value;
  }
  await getApiKeyInfo();
}

function resetModalKey() {
  modalKey.value = persistentStore.apiKey;
}

async function getApiKeyInfo() {
  isLoading.value = true;

  let remainingHitsAccount = null;
  let remainingHitsUser = null;

  // if (persistentStore.apiKey) {
  const params = {
    api_key: persistentStore.apiKey,
    format: 'json',
  };
  const queryString = new URLSearchParams(params).toString();

  try {
    const responseAccount = await similarwebApiClient.get(
      `/capabilities?${queryString}`
    );

    remainingHitsAccount = responseAccount?.data?.remaining_hits;
    const desktopCountries =
      responseAccount?.data?.web_desktop_data?.countries || [];
    volatileStore.availableCountries.desktop = desktopCountries.reduce(
      (acc, curr) => {
        if (curr) {
          acc[curr.code.toLowerCase()] =
            curr.name === 'world' ? 'Worldwide' : curr.name;
        }
        return acc;
      },
      {}
    );
    const webStartDate =
      responseAccount?.data?.web_desktop_data?.snapshot_interval?.start_date;
    const webEndDate =
      responseAccount?.data?.web_desktop_data?.snapshot_interval?.end_date;
    volatileStore.availableMonths.web = monthsBetween(webStartDate, webEndDate);

    const mobileCountries =
      responseAccount?.data?.web_mobile_data?.countries || [];
    volatileStore.availableCountries.mobile = mobileCountries.reduce(
      (acc, curr) => {
        if (curr) {
          acc[curr.code.toLowerCase()] =
            curr.name === 'world' ? 'Worldwide' : curr.name;
        }
        return acc;
      },
      {}
    );

    const appsEngagementCountries =
      responseAccount?.data?.app_engagement_data?.countries || [];
    volatileStore.availableCountries.apps = appsEngagementCountries.reduce(
      (acc, curr) => {
        if (curr) {
          acc[curr.code.toLowerCase()] =
            curr.name === 'world' ? 'Worldwide' : curr.name;
        }
        return acc;
      },
      {}
    );
    const appStartDate =
      responseAccount?.data?.app_engagement_data?.snapshot_interval?.start_date;
    const appEndDate =
      responseAccount?.data?.app_engagement_data?.snapshot_interval?.end_date;
    volatileStore.availableMonths.app = monthsBetween(appStartDate, appEndDate);
  } catch (err) {
    console.error(err);
    volatileStore.availableCountries.desktop = {};
    volatileStore.availableCountries.mobile = {};
    volatileStore.availableCountries.apps = {};
  }

  try {
    const responseUser = await similarwebApiClient.get(
      `/user-capabilities?${queryString}`
    );

    remainingHitsUser = responseUser?.data?.user_remaining;
  } catch (err) {
    console.error(err);
    remainingHitsUser = null;
  }

  try {
    const responseConversion = await similarwebApiClient.get(
      '/v1/segment/conversion-analysis/describe'
    );

    const conversionStartDate =
      responseConversion?.data?.response?.conversion?.countries?.world
        ?.start_date;
    const conversionEndDate =
      responseConversion?.data?.response?.conversion?.countries?.world
        ?.end_date;
    volatileStore.availableMonths.conversion = monthsBetween(
      conversionStartDate,
      conversionEndDate
    );
  } catch (err) {
    console.error(err);
  }
  // }

  if (remainingHitsUser || remainingHitsUser === 0) {
    remainingHits.value = Math.min(remainingHitsAccount, remainingHitsUser);
  } else {
    remainingHits.value = remainingHitsAccount;
  }

  isLoading.value = false;
}
</script>

<template>
  <div class="d-flex flex-row">
    <div v-if="!isLoading" class="flex-grow-1">
      <div v-if="persistentStore.apiKey">
        <p v-if="remainingHits === null">
          <span class="text-danger">Invalid API key!</span> Please try using
          another one.
        </p>
        <p v-else>
          API Key: ***********{{ persistentStore.apiKey.slice(-6) }} ({{
            Number(remainingHits).toLocaleString()
          }}
          hits left)
        </p>
      </div>
      <div v-else>
        <p>No API Key provided!</p>
      </div>
    </div>
    <div v-else class="spinner-border text-secondary" role="status">
      <span class="visually-hidden">Loading API Key details...</span>
    </div>
    <div class="flex-shrink-1 mx-3">
      <b-button v-b-modal.modal-key variant="primary" class="text-nowrap"
        >Update Key</b-button
      >
    </div>
  </div>
  <b-modal
    id="modal-key"
    title="Change API Key"
    @cancel="resetModalKey"
    @ok="updateApiKey"
  >
    <b-form inline>
      <label class="mr-sm-2" for="api-key">API Key</label>
      <b-form-input
        id="api-key"
        v-model="modalKey"
        type="password"
        aria-describedby="api-key-help-block"
      ></b-form-input>
      <b-form-text id="api-key-help-block">
        You can find your API key
        <a
          href="https://account.similarweb.com/#/api-management"
          target="_blank"
          >here</a
        >.
      </b-form-text>
    </b-form>
  </b-modal>
</template>
