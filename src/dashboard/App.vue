<template lang="pug">
v-app
  v-content
    v-layout
      div.pl-3
        h1 #[router-link(to="/") Thankful Dashboard]
        h3 We're in alpha
        div
          | We're still figuring things out. Please report any issues #[a(href='https://github.com/SuperuserLabs/thankful/issues') here].
      v-container(fluid, fill-height)
        v-spacer
        net-info
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
