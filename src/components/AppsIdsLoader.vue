<script setup>
import { reactive } from 'vue';

import { persistentStore } from '../store.js';

// Model
const state = reactive({
  appsIdsRaw: '',
});

// Methods
function confirmSelection() {
  const reAppleId = /\b(?:1_)?(?:id)?(\d{9,})\b/i;
  const reGoogleStoreId =
    /\b(?:0_)?(?:id=)?((?:[a-zA-Z0-9_]+\.)+[a-zA-Z0-9_]+)\b/i;
  const values = state.appsIdsRaw.split(/[\t\s\n\r,;"'()]+/);

  const appsIds = values
    .map((val) => {
      let result = null;
      const matchApple = val.match(reAppleId);
      const matchGoogle = val.match(reGoogleStoreId);

      if (matchApple) {
        result = [...matchApple.slice(0, 2), 'Apple'];
      } else if (matchGoogle) {
        result = [...matchGoogle.slice(0, 2), 'Google'];
      }
      return result;
    })
    .filter((val) => val);
  // const previousResults = new Set(appendItems ? persistentStore.domains : []);
  // const uniqueResults = new Set([...domains, previousResults]);

  persistentStore.appsIds = Array.from(new Set(appsIds));
  state.showDomainsModal = false;
  state.appsIdsRaw = '';
}
</script>

<template>
  <div class="mb-4">
    <h4>Apps IDs</h4>
    <p>
      <b>{{ persistentStore.appsIds.length }}</b> apps:
      {{
        persistentStore.appsIds
          .slice(0, 20)
          .map((dom) => dom[0])
          .join(', ')
      }}{{ persistentStore.appsIds.length > 20 ? ',...' : '' }}
    </p>

    <div class="flex-shrink-1 mx-3">
      <b-button v-b-modal.modal-domains variant="primary"
        >Enter Apps IDs</b-button
      >
    </div>

    <b-modal
      id="modal-domains"
      title="Enter Apps IDs"
      ok-title="Confirm"
      size="lg"
      @ok="confirmSelection"
    >
      <div class="form-group">
        <textarea
          v-model="state.appsIdsRaw"
          rows="12"
          placeholder="Write/paste your list of apps IDs here"
          class="form-control"
        ></textarea>
        <small class="form-text text-muted"
          >See how to find apps IDs
          <a
            target="_blank"
            href="https://support.similarweb.com/hc/en-us/articles/4406102129553-How-can-I-find-app-IDs-"
            >here</a
          >.</small
        >
      </div>
    </b-modal>
  </div>
</template>
