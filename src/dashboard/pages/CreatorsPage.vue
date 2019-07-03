<template lang="pug">
v-container
  v-card
    v-toolbar(flat color="white")
      v-toolbar-title
        | Creators
      v-spacer
      v-toolbar-items
        |
    creator-list
</template>

<script>
import CreatorList from '../components/CreatorList.vue';

export default {
  components: {
    'creator-list': CreatorList,
  },
};
</script>
