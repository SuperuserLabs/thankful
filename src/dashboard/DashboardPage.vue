<template lang="pug">
div
  a(v-on:click='toTop()', v-if='dismissedErrors < errors.length', style='position:fixed;bottom:20px;right:100px;z-index:100')
    v-icon(color='warning', x-large) warning
  v-layout(row, wrap)
    v-flex(xs6)
      v-alert(v-for="(error, index) in errors", :key='index', show, dismissible, variant='warning', @dismissed='dismissedErrors++')
        | {{ error }}
  div
    v-dialog(v-model="dialog", max-width='500px')
      v-card
        v-card-title
          span.headline Editing
          v-btn(color="secondary", flat, @click='ignore(editing);')
            | #[v-icon visibility_off] Ignore
        v-card-text
          v-layout(wrap)
            v-flex(xs12)
              v-text-field(v-model='editedCreator.name', label='Name')
            v-flex(xs12)
              v-text-field(v-model='editedCreator.url', label='Homepage')
            v-flex(xs12)
              v-text-field(v-model='editedCreator.address', label='ETH Address')
          p(v-if="editedCreator.info")
            | {{ editedCreator.info }}
          v-layout(row)
            v-spacer
            v-btn(color="primary", flat, @click='save(`Saved creator ${editedCreator.name}`)') Save
          v-data-table(:headers="activityHeaders", :items="activities", :pagination.sync='pagination')
            template(slot='items', slot-scope='props')
              td
                a(:href="props.item.url")
                  | {{ props.item.title || props.item.url }}
              td.text-right
                | {{ props.item.duration | friendlyDuration }}
    v-snackbar(v-model='snackMessage.length > 0', top) {{ snackMessage }}
      v-btn(color="pink", flat, @click="undo();") Undo
    v-container(grid-list-md)
      v-flex(xs12).mb-3
        div.headline Your favorite creators
      div(v-if="creators.length === 0")
        | No creators to show

      v-layout(row, wrap)
        v-flex(v-for="(creator, index) in creators", :key='creator.url', xs12, sm6, md3)
          creator-card(v-bind:creator="creator",
                       v-bind:key="creator.url",
                       @click="edit(creator, index)"
                       )
        v-flex(xs12, sm6, md3)
          v-card(hover)
            v-card-title
              v-container.text-xs-center
                v-icon(x-large) add

      donation-summary-component(:creators="creators", ref='donationSummary', @error="errfun('Donating failed')($event)")

      v-layout(row)
        v-flex(xs12,sm6)
          v-card.p-2.bt-0(no-body)
            v-toolbar(flat, color='white')
              v-toolbar-title Unattributed activity
            activity-component(:limit="10", :unattributed="true", toAll="/activity")
        v-flex(xs12,sm6)
          v-card.p-2.bt-0(no-body)
            v-toolbar(flat, color='white')
              v-toolbar-title Donation history
            donation-history-component(:limit="10", ref="donationHistory", toAll="/donations")
</template>

<script>
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
import DonationHistoryComponent from './DonationHistoryComponent.vue';
import DonationSummaryComponent from './DonationSummaryComponent.vue';
import { Creator } from '../lib/db.js';
import _ from 'lodash';

// TODO: Move to appropriate location

function initThankfulTeamCreator() {
  const creator = new Creator('https://getthankful.io', 'Thankful Team');
  // Erik's address
  // TODO: Change to a multisig wallet
  creator.address = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
  creator.info = 'Be thankful for Thankful and donate to the Thankful team!';
  creator.priority = 1;
  creator.share = 0.2;
  return creator.save();
}

export default {
  components: {
    'creator-card': CreatorCard,
    'activity-component': ActivityComponent,
    'donation-history-component': DonationHistoryComponent,
    'donation-summary-component': DonationSummaryComponent,
  },
  data: () => ({
    creatorList: [],
    editing: -1,
    errors: [],
    dismissedErrors: 0,
    dialog: false,
    currentCreator: {},
    editedCreator: { name: '', url: '', address: '' },
    activities: [],
    activityHeaders: [
      { text: 'Page', value: 'title' },
      { text: 'Duration', value: 'duration' },
    ],
    pagination: { sortBy: 'duration', descending: true },
    snackMessage: '',
  }),
  computed: {
    creators() {
      return _.take(this.creatorList, 12);
    },
  },
  methods: {
    getActivities(creator) {
      this.$db.getCreatorActivity(creator.url).then(activities => {
        this.activities = activities;
      });
    },
    toTop() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    },
    errfun(title, sink = this.errors) {
      return message => {
        sink.push(`${title}: ${message}`);
      };
    },
    addCreator() {
      if (this.editing < 0) {
        let c = new Creator('', '');
        c.priority = 2;
        this.creatorList.unshift(c);
        this.editing = 0;
      }
    },
    remove(creator, index) {
      Object.assign(this.editedCreator, creator);
      creator.delete();
      this.creatorList.splice(index, 1);
      this.editing = -1;
      this.dialog = false;
    },
    ignore(index) {
      this.currentCreator.ignore = false;
      this.editedCreator.ignore = true;
      this.save(`Ignored ${this.editedCreator.name}.`);
      this.creatorList.splice(index, 1);
    },
    save(message = '') {
      const alternate = this.editedCreator;
      const current = this.currentCreator;
      const tmp = Object.assign({}, current);
      return current
        .delete()
        .then(() => {
          Object.assign(current, alternate);
          return current.save();
        })
        .then(() => {
          this.editing = -1;
          this.editedCreator = tmp;
          this.dialog = false;
          this.snackMessage = message;
        });
    },
    undo() {
      this.save().then(() => {
        this.refresh();
      });
    },
    edit(creator, index) {
      this.currentCreator = creator;
      this.editing = index;
      this.editedCreator = _.assignIn({}, creator);
      this.getActivities(creator);
      this.dialog = true;
    },

    refresh() {
      this.$db.getCreators().then(creators => {
        // Find accumulated duration for creators
        let creatorsWithDuration = Promise.all(
          creators.filter(c => c.ignore !== true).map(c =>
            this.$db.getCreatorActivity(c.url).then(acts =>
              Object.assign({ __proto__: c.__proto__ }, c, {
                duration: _.sum(acts.map(act => act.duration)),
              })
            )
          )
        );

        // Sort creators by duration
        creatorsWithDuration.then(x => {
          this.creatorList = _.orderBy(
            x,
            ['priority', 'duration'],
            ['asc', 'desc']
          );
        });

        this.$refs.donationHistory.refresh();
        this.$refs.donationSummary.distribute();
      });
    },
  },
  created() {
    this.refresh();
  },
  beforeCreate() {
    // These below are async, might not have run in time
    initThankfulTeamCreator();
    this.$db.attributeGithubActivity();
  },
};
</script>

<style src="./dashboard.css">
</style>
