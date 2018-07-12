<template lang="pug">
div
  v-data-table(:headers="headers", :items="creatorList", :pagination.sync='pagination')
    template(slot='items', slot-scope='props')
      td.subheading
        a(:href="props.item.url", target="_blank")
          | {{ props.item.name || props.item.url }}
      td.subheading
        | {{ props.item.duration | friendlyDuration }}
      td.subheading
        v-btn(icon, @click='ignore(props.item)')
          v-icon(v-show='!props.item.ignore') visibility
          v-icon(v-show='props.item.ignore') visibility_off
      td.subheading
        v-icon(v-show='props.item.priority == 2') star
        v-icon(v-show='props.item.priority == 1') heart
      td.subheading
        v-btn(color='warning', @click='remove(props.item)') Delete
  div.text-xs-center.pt-2
    v-btn(v-if="toAll", size="sm", :to="toAll")
      | Show all
</template>

<script>
import _ from 'lodash';

export default {
  data: () => ({
    creatorList: [],
    headers: [
      { text: 'Creator', value: 'name', width: '500px' },
      { text: 'Duration', value: 'duration' },
      { text: 'Ignored', value: 'ignore', width: '50px' },
      { text: 'Favorite', value: 'priority', width: '50px' },
      { text: 'Remove', value: 'name', sortable: false, width: '200px' },
    ],
    pagination: { sortBy: 'duration', descending: true, rowsPerPage: -1 },
  }),
  props: {
    limit: { default: Infinity, type: Number },
    unattributed: { default: false, type: Boolean },
    toAll: { default: null, type: String },
  },
  computed: {},
  methods: {
    ignore(creator) {
      creator.ignore = !creator.ignore;
      creator.put();
    },
    remove(creator) {
      creator.delete();
      this.refresh();
    },
    refresh() {
      this.$db.getCreators().then(creators => {
        // Find accumulated duration for creators
        let creatorsWithDuration = Promise.all(
          creators.map(c =>
            this.$db.getCreatorActivity(c.url).then(acts =>
              Object.assign({ __proto__: c.__proto__ }, c, {
                duration: _.sum(acts.map(act => act.duration)),
              })
            )
          )
        );
        creatorsWithDuration.then(x => {
          this.creatorList = x;
        });
      });
    },
  },
  created() {
    this.refresh();
  },
};
</script>
