<template>
  <div class="search-container">
    <input
      v-model="searchState.query"
      type="text"
      placeholder="Rechercher un article..."
      class="search-input"
    />
  </div>
</template>

<script>
import { searchState } from '../utils/searchState';

export default {
  name: 'SearchBar',
  data() {
    return {
      searchState,
    };
  },
};
</script>
