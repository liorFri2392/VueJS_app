<script setup>
import { reactive } from 'vue';

import { persistentStore } from '../store.js';

// Model
const state = reactive({
  domainsRaw: '',
});

// Methods
function confirmSelection() {
  const reDomain =
    /(?:https?:\/\/)?([-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})(?:\/.*)?/i;
  const values = state.domainsRaw.split(/[\t\s\n\r,;"'()]+/);
  const domains = values
    .map((val) => val.match(reDomain)?.slice(0, 2))
    .filter((val) => val);
  // const previousResults = new Set(appendItems ? persistentStore.domains : []);
  // const uniqueResults = new Set([...domains, previousResults]);

  persistentStore.domains = Array.from(new Set(domains));
  state.showDomainsModal = false;
  state.domainsRaw = '';
}
</script>

<template>
  <div class="mb-4">
    <h4>Domains</h4>
    <p>
      <b>{{ persistentStore.domains.length }}</b> domains:
      {{
        persistentStore.domains
          .slice(0, 20)
          .map((dom) => dom[0])
          .join(', ')
      }}{{ persistentStore.domains.length > 20 ? ',...' : '' }}
    </p>

    <div class="flex-shrink-1 mx-3">
      <b-button v-b-modal.modal-domains variant="primary"
        >Enter Domains</b-button
      >
    </div>
    <div class="col-sm-4 form-check">
      <label class="form-check-label">
        <input
          id="include-subdomains"
          v-model="persistentStore.includeSubdomains"
          type="checkbox"
          class="form-check-input"
        />
        <span class="ml-2">Include subdomains in analysis</span>
      </label>
    </div>

    <b-modal
      id="modal-domains"
      title="Enter Domains"
      ok-title="Confirm"
      size="lg"
      @ok="confirmSelection"
    >
      <div class="form-group">
        <textarea
          v-model="state.domainsRaw"
          rows="12"
          placeholder="Write/paste your list of domains here"
          class="form-control"
        ></textarea>
      </div>
    </b-modal>
  </div>
</template>
