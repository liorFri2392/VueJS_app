<script setup>
import { reactive } from 'vue';

import { persistentStore, volatileStore } from '../store.js';

// Model
const state = reactive({
  showDomainsModal: false,
  timePeriodTypes: [
    { text: 'Start/End Dates', value: 'start_end_dates' },
    { text: 'Recent Months', value: 'recent_months' },
    { text: 'Last 28 Days', value: 'last_28_days' },
  ],
  months: [
    { text: 'January', value: '01' },
    { text: 'February', value: '02' },
    { text: 'March', value: '03' },
    { text: 'April', value: '04' },
    { text: 'May', value: '05' },
    { text: 'June', value: '06' },
    { text: 'July', value: '07' },
    { text: 'August', value: '08' },
    { text: 'September', value: '09' },
    { text: 'October', value: '10' },
    { text: 'November', value: '11' },
    { text: 'December', value: '12' },
  ],
});
</script>

<template>
  <div class="mb-4">
    <h4>Dates</h4>
    <b-form-group>
      <b-form-radio-group
        id="time-period-type-radios"
        v-model="persistentStore.timePeriodType"
        :options="state.timePeriodTypes"
        aria-describedby="time-period-type-selection"
        button-variant="outline-primary"
        name="radios-btn-default"
        buttons
      ></b-form-radio-group>
    </b-form-group>

    <div v-if="persistentStore.timePeriodType === 'start_end_dates'">
      <b-input-group class="mb-3 w-50 mx-auto dates-select">
        <label for="start-month" class="input-group-text">Start Date</label>
        <b-form-select
          id="start-month"
          v-model="persistentStore.startMonth"
          :options="state.months"
        ></b-form-select>
        <b-form-input
          id="start-year"
          v-model="persistentStore.startYear"
          type="text"
        ></b-form-input>
      </b-input-group>

      <b-input-group class="mb-3 w-50 mx-auto dates-select">
        <label for="end-month" class="input-group-text">End Date</label>
        <b-form-select
          id="end-month"
          v-model="persistentStore.endMonth"
          :options="state.months"
        ></b-form-select>
        <b-form-input
          id="end-year"
          v-model="persistentStore.endYear"
          type="text"
        ></b-form-input>
      </b-input-group>
    </div>

    <div
      v-else-if="
        persistentStore.timePeriodType == 'recent_months' &&
        volatileStore.availableMonths.web.length > 0
      "
    >
      <b-input-group class="mb-3 mx-auto recent-months-select">
        <span class="input-group-text">Last</span>
        <b-form-select
          id="selecty-nb-months"
          v-model="persistentStore.nbMonths"
          :options="
            [...Array(volatileStore.availableMonths.web.length - 1).keys()].map(
              (i) => i + 1
            )
          "
        ></b-form-select>
        <span class="input-group-text">months</span>
      </b-input-group>
      <div class="text-muted">
        ({{ volatileStore.startDate }} to {{ volatileStore.endDate }})
      </div>
    </div>
    <div v-else-if="persistentStore.timePeriodType == 'last_28_days'">
      Last 28 days!
    </div>
  </div>
</template>

<style scoped>
.dates-select label {
  min-width: 30%;
  text-align: left;
}

.recent-months-select select {
  max-width: 70px;
  text-align: center;
}
</style>
