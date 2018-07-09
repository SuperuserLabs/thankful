<template lang="pug">
v-app
  v-content
    v-layout
      a(href="#/")
        h1 Thankful Dashboard
        h3 We're in alpha
        div
          | We're still figuring things out. Please report any issues to.
      v-container(fluid, fill-height)
        v-spacer
        net-info
    div.row
      div.col
        hr

  v-container(fluid)
    router-view
</template>
<script>
import NetInfo from './NetInfo.vue';

export default {
  components: {
    'net-info': NetInfo,
  },
  data: function() {
    return {};
  },
};
</script>
