<template lang="pug">
v-card
  v-card-title.display-1.pb-0
    | Database cleanup
  v-card-text
    p
      | If Thankful starts running slow, you might want to delete all activity that could not be attributed to a creator, and you can do so here.
    v-layout
      v-flex
      v-flex(shrink)
        v-btn(@click="cleanEvents()", color="warning")
          | #[v-icon delete] Clean unattributed activity

</template>

<script>
import { mapActions } from 'vuex';

export default {
  methods: {
    ...mapActions('db', ['deleteUnattributedActivity']),

    async cleanEvents() {
      console.log('Cleaning unattributed events...');
      await this.deleteUnattributedActivity();
      console.log('Done!');
    },
  },
};
</script>
