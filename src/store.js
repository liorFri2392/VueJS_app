import { reactive, watch, computed } from 'vue';
import _ from 'lodash';

const STORAGE_NAME = 'similarwebConfig';

let storedConfig = {};
try {
  const storedString = localStorage.getItem(STORAGE_NAME);
  if (storedConfig) {
    storedConfig = JSON.parse(storedString);
  }
} catch {
  console.error('Could not retrieve stored config');
}

const startDate = computed(() => {
  let result = '';
  if (persistentStore.timePeriodType === 'start_end_dates') {
    result = `${persistentStore.startYear}-${persistentStore.startMonth}`;
  } else if (persistentStore.timePeriodType === 'recent_months') {
    result = volatileStore.availableMonths.web.slice(
      -persistentStore.nbMonths
    )[0];
  } else if (persistentStore.timePeriodType === 'last_28_days') {
    result = '';
  }

  return result;
});

const endDate = computed(() => {
  let result = '';
  if (persistentStore.timePeriodType === 'start_end_dates') {
    result = `${persistentStore.endYear}-${persistentStore.endMonth}`;
  } else if (persistentStore.timePeriodType === 'recent_months') {
    result = volatileStore.availableMonths.web.slice(-1)[0];
  } else if (persistentStore.timePeriodType === 'last_28_days') {
    result = '';
  }

  return result;
});

const conversionStartDate = computed(() => {
  let result = '';
  if (persistentStore.conversionTimePeriodType === 'start_end_dates') {
    result = `${persistentStore.conversionStartYear}-${persistentStore.conversionStartMonth}`;
  } else if (persistentStore.conversionTimePeriodType === 'recent_months') {
    result = volatileStore.availableMonths.conversion.slice(
      -persistentStore.conversionNbMonths
    )[0];
  }

  return result;
});

const conversionEndDate = computed(() => {
  let result = '';
  if (persistentStore.conversionTimePeriodType === 'start_end_dates') {
    result = `${persistentStore.conversionEndYear}-${persistentStore.conversionEndMonth}`;
  } else if (persistentStore.conversionTimePeriodType === 'recent_months') {
    result = volatileStore.availableMonths.conversion.slice(-1)[0];
  }

  return result;
});

export const volatileStore = reactive({
  availableCountries: { desktop: {}, mobile: {}, apps: {} },
  availableMonths: { web: [], apps: [], conversion: [] },
  lastDay: { web: '', apps: '' },
  startDate,
  endDate,
  conversionStartDate,
  conversionEndDate,
});

export const persistentStore = reactive({
  apiKey: '',
  domains: [],
  appsIds: [],
  segments: [],
  conversionSegments: [],
  country: 'world',
  appsCountry: 'world',
  timePeriodType: 'start_end_date',
  startMonth: '',
  startYear: '',
  endMonth: '',
  endYear: '',
  nbMonths: 3,
  conversionTimePeriodType: 'start_end_date',
  conversionStartMonth: '',
  conversionStartYear: '',
  conversionEndMonth: '',
  conversionEndYear: '',
  conversionNbMonths: 3,
  dateSelectionType: 0,
  includeSubdomains: true,
  ...storedConfig, // override defaults with stored values
});

watch(
  () => _.cloneDeep(persistentStore),
  (currentValue) => {
    // console.log(`Update state from ${JSON.stringify(oldValue)} to ${JSON.stringify(currentValue)}`);
    localStorage.setItem(STORAGE_NAME, JSON.stringify(currentValue));
  }
);
