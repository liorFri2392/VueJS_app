<script setup>
import { ref, onMounted } from 'vue';
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup

import ApiKeyInfo from './components/ApiKeyInfo.vue';
import { volatileStore } from './store.js';

const isBrowserSupported = ref('true');
const isLoading = ref('true');

onMounted(() => {
  isBrowserSupported.value = !!window.showSaveFilePicker;
  isLoading.value = false;
});
</script>

<template>
  <div v-if="!isLoading">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <img
            alt="Similarweb logo"
            src="./assets/similarweb-logo.png"
            height="42"
            width="42"
          />
          <span class="mx-3 fw-bold">Similarweb Data Downloader</span>
        </a>
      </div>

      <ApiKeyInfo />
    </nav>
    <div v-if="isBrowserSupported">
      <div
        v-if="volatileStore?.availableMonths?.web?.length == 0"
        class="alert alert-warning w-75 my-3 mx-auto"
        role="alert"
      >
        Please enter a valid Similarweb API key to get started.
      </div>
      <div v-else>
        <ul class="nav nav-tabs">
          <li class="nav-item dropdown">
            <a
              id="navbarDarkDropdownMenuLink"
              class="nav-link dropdown-toggle"
              href="/websites-traffic"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Websites Analysis
            </a>
            <ul
              class="dropdown-menu"
              aria-labelledby="navbarDarkDropdownMenuLink"
            >
              <router-link class="nav-link" to="/websites-traffic"
                >Traffic and Engagement</router-link
              >
              <router-link class="nav-link" to="/websites-marketing-channels"
                >Marketing Channels</router-link
              >
              <router-link class="nav-link" to="/websites-geography-distribution"
                >Geography Distribution</router-link
              >
              <div class="dropdown-divider"></div>
              <h6 class="dropdown-header">Sales Solution Exclusives</h6>
              <router-link class="nav-link" to="/websites-lead-enrichment"
                >Lead Enrichment</router-link
              >
              <router-link class="nav-link" to="/websites-technographics"
                >Technographics</router-link
              >
            </ul>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/segments"
              >Segments Analysis</router-link
            >
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/conversion-analysis"
              >Conversion Analysis</router-link
            >
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/popular-pages"
              >Popular Pages</router-link
            >
          </li>
          <li class="nav-item dropdown">
            <a
              id="navbarDarkDropdownMenuLink"
              class="nav-link dropdown-toggle"
              href="/websites-traffic"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Mobile Apps Analysis
            </a>
            <ul
              class="dropdown-menu"
              aria-labelledby="navbarDarkDropdownMenuLink"
            >
              <router-link class="nav-link" to="/apps-infos">Infos</router-link>
              <router-link class="nav-link" to="/apps-engagement"
                >Engagement</router-link
              >
            </ul>
          </li>
        </ul>
        <b-container class="px-6 py-4">
          <router-view />
        </b-container>
      </div>
    </div>
    <div v-else>
      <b-alert variant="danger" show>
        Browser not supported - please use a recent version of
        <a href="https://www.google.com/intl/en_us/chrome/">Chrome</a>,
        <a href="https://www.microsoft.com/en-us/edge">Edge</a> or
        <a href="https://www.opera.com/download">Opera</a>. Mobile phones are
        not supported.
      </b-alert>
    </div>
  </div>
</template>

<style>

</style>
