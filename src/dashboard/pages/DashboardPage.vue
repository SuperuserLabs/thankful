<template lang="pug">
div
    // Edit creator dialog
    v-dialog(v-model="dialog.edit", max-width='500px', @input='newCreator = false')
      v-card(tile)
        v-toolbar(card dark color="primary")
          v-toolbar-title
            | Editing
          v-spacer
          v-toolbar-items
            v-tooltip(v-if='!dialog.new', bottom)
              v-btn(slot='activator', dark, flat, @click='ignore(currentCreator)')
                | #[v-icon visibility_off] Ignore
              | {{ $t('tip.ignore') }}
        v-card-text
          v-layout(row, wrap)
            v-flex(xs12)
              v-form(v-model='valid')
                  v-text-field(v-model='editedCreator.name', :rules='[v => !!v || "Name is required"]', label='Name')
                  v-text-field(v-model='editedCreator.url', :rules='[v => !!v || "URL is required"]', label='Homepage')
                  v-text-field(v-model='editedCreator.address', :rules='ethAddressRules', label='ETH Address')
            v-flex(xs12)
              p(v-if="editedCreator.info")
                | {{ editedCreator.info }}
          v-layout(row, justify-end)
            v-btn(color="primary", flat, :disabled='!valid', @click='save(`Saved creator ${editedCreator.name}`)') Save

    // Creator activity dialog
    v-dialog(v-model="dialog.activity", max-width='800px')
      v-card(tile)
        v-toolbar(card dark color="primary")
          v-toolbar-title
            | Activity
        v-card-text
          v-data-table(v-if='dialog.activity', :headers="activityHeaders", :items="activityByCreator(currentCreator.id)", :pagination.sync='pagination')
            template(slot='items', slot-scope='props')
              td
                a(:href="props.item.url")
                  | {{ props.item.title || props.item.url }}
              td.text-right
                | {{ props.item.duration | friendlyDuration }}

    // Snackbar, for 'undo ignore' and stuff
    v-snackbar(v-model='showSnackbar', bottom) {{ snackMessage }}
      v-btn(color="pink", flat, @click="undo()") Undo

    v-container(grid-list-md)
      // Favorite creators
      v-layout(row)
        v-flex
          span.display-1 Your favorite creators
          span.ml-3.caption(v-show="daysSinceDonation !== null")
            | You last donated {{daysSinceDonation}} days ago
        v-flex(shrink)
          v-btn(flat, right, small, @click="addCreator()")
            v-icon add
            | Add creator

      v-layout(v-if='loading', row, justify-center, align-center).pa-5
        v-progress-circular(indeterminate, :size='50')
      v-layout(v-else, row, wrap)
        v-flex(v-for="creator in creators", :key='creator.id', xs12, sm6, md3)
          creator-card(v-bind:creator="creator",
                       v-bind:key="creator.id",
                       @edit="edit(creator)",
                       @activity="activity(creator)",
                       @ignore="ignore(creator)"
                       )

      div.my-3

      // Donation summary
      donation-summary(ref='donationSummary', @error="errfun('Donating failed')($event)")

      div.text-xs-center.pt-2.pb-3
        router-link(to="/checkout")
          v-btn(large color="primary")
            | Review & donate

      missing-addresses-card
</template>

<script>
import CreatorCard from '~/dashboard/components/CreatorCard.vue';
import ActivityComponent from '~/dashboard/components/ActivityComponent.vue';
import DonationSummary from '~/dashboard/components/DonationSummary.vue';
import MissingAddressesCard from '~/dashboard/components/MissingAddressesCard.vue';
import { Creator } from '~/lib/models';
import { secondsSinceDonation } from '~/lib/util';

import _ from 'lodash';
import { mapGetters } from 'vuex';
import { getDatabase } from '../../lib/db.ts';

export default {
  components: {
    'creator-card': CreatorCard,
    'activity-component': ActivityComponent,
    'donation-summary': DonationSummary,
    'missing-addresses-card': MissingAddressesCard,
  },
  data: () => ({
    valid: true,
    dialog: { edit: false, activity: false },
    loading: true,
    currentCreator: {},
    editedCreator: { name: '', url: '', address: '' },
    activityHeaders: [
      { text: 'Page', value: 'title' },
      { text: 'Duration', value: 'duration' },
    ],
    pagination: { sortBy: 'duration', descending: true },
    snackMessage: '',
    showSnackbar: false,
    ethAddressRules: [
      v => !v || this.isAddress(v) || 'Not a valid ETH address',
    ],
    newCreator: false,
    daysSinceDonation: null,
  }),
  computed: {
    ...mapGetters({
      creators: 'db/favoriteCreators',
      activityByCreator: 'db/activityByCreator',
      notifications: 'notifications/active',
      isAddress: 'metamask/isAddress',
    }),
  },
  methods: {
    addCreator() {
      let c = new Creator('', '');
      c.priority = 2;
      this.newCreator = true;
      this.edit(c, -1);
    },
    ignore(creator) {
      this.currentCreator = creator;
      this.editedCreator = { ignore: true };
      this.save(`Ignored ${this.currentCreator.name}.`);
    },
    save(message = '') {
      // Update creator in vuex store
      this.$store
        .dispatch('db/doUpdateCreator', {
          index: this.currentCreator.index,
          updates: this.editedCreator,
        })
        .then(() => {
          // Dismiss editing popup and show snackBar
          this.dialog.edit = false;
          this.snackMessage = message;
          this.showSnackbar = message.length > 0;
        });
    },
    undo() {
      this.$store.dispatch('db/undo');
      this.showSnackbar = false;
    },
    edit(creator) {
      this.currentCreator = creator;
      this.editedCreator = _.pick(creator, ['name', 'url', 'address']);
      this.dialog.edit = true;
      this.dialog.new = this.newCreator;
    },
    activity(creator) {
      this.currentCreator = creator;
      this.dialog.activity = true;
    },
  },
  beforeCreate() {
    this.$store.dispatch('db/ensureCreators').then(() => {
      this.loading = false;
    });
    this.$store.dispatch('db/ensureActivities');
  },
  async mounted() {
    let db = getDatabase();
    let seconds = await secondsSinceDonation(db);
    this.daysSinceDonation = Math.round(seconds / (24 * 60 * 60));
    console.log(this.daysSinceDonation);
  },
};
</script>
