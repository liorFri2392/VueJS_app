import axios from 'axios';
import axiosRetry from 'axios-retry';
import rateLimit from 'axios-rate-limit';

const MAX_RPS = 9; // set rate limit under 10 requests per second

const axiosSetup = {
  baseURL: 'https://api.similarweb.com',
  headers: {
    'x-sw-source': 'TSA - Rest API UI',
  },
};

export const similarwebApiClient = rateLimit(axios.create(axiosSetup), {
  maxRPS: MAX_RPS,
});
axiosRetry(similarwebApiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});
