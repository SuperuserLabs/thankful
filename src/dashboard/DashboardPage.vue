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
      v-card(tile)
        v-toolbar(card dark color="primary")
          v-toolbar-title
            | Editing
          v-spacer
          v-toolbar-items
            v-btn(v-if='!editedCreator.new' dark flat @click='ignore(editing);')
              | #[v-icon visibility_off] Ignore
        v-card-text
          v-layout(wrap)
            v-form(v-model='valid')
              v-flex(xs12)
                v-text-field(v-model='editedCreator.name', :rules='[v => !!v || "Name is required"]', label='Name')
              v-flex(xs12)
                v-text-field(v-model='editedCreator.url', :rules='[v => !!v || "URL is required"]', label='Homepage')
              v-flex(xs12)
                v-text-field(v-model='editedCreator.address', :rules='ethAddressRules', label='ETH Address')
          p(v-if="editedCreator.info")
            | {{ editedCreator.info }}
          v-layout(row)
            v-spacer
            v-btn(color="primary", flat, :disabled='!valid', @click='save(`Saved creator ${editedCreator.name}`)') Save
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
        div.display-1 Your favorite creators
      div(v-if="creators.length === 0")
        | No creators to show

      v-layout(row, wrap)
        v-flex(v-for="(creator, index) in creators", :key='creator.url', xs12, sm6, md3)
          creator-card(v-bind:creator="creator",
                       v-bind:key="creator.url",
                       @click="edit(creator, index)")
        v-flex(xs12, sm6, md3)
          v-card(hover, @click.native="addCreator()", height='116px')
            v-container.text-xs-center
              v-icon(x-large) add
              div.title(style="color: #666")
                | Add creator

      donation-summary-component(:creators="creators", ref='donationSummary', @error="errfun('Donating failed')($event)")
</template>

<script>
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
import DonationHistoryComponent from './DonationHistoryComponent.vue';
import DonationSummaryComponent from './DonationSummaryComponent.vue';
import { Creator } from '../lib/db.js';
import _ from 'lodash';

function initThankfulTeamCreator() {
  const creator = new Creator('https://getthankful.io', 'Thankful Team');
  // Erik's address
  // TODO: Change to a multisig wallet
  creator.address = '0xbD2940e549C38Cc6b201767a0238c2C07820Ef35';
  creator.info =
    'Be thankful for Thankful, donate so we can keep helping people to be thankful!';
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
    valid: true,
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
    ethAddressRules: [
      v => !v || /^0x[0-9A-F]{40}$/i.test(v) || 'Not a valid ETH address',
    ],
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
      let c = new Creator('', '');
      c.priority = 2;
      c.new = true;
      this.edit(c, -1);
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
      this.$db
        .getCreators({ withTimespent: true })
        .then(
          // Filter ignored creators
          _.partialRight(_.filter, c => c.ignore !== true)
        )
        .then(
          // Order the creators
          _.partialRight(_.orderBy, ['priority', 'duration'], ['asc', 'desc'])
        )
        .then(c => {
          this.creatorList = c;
        })
        .then(() => {
          this.$refs.donationHistory.refresh;
          this.$refs.donationSummary.distribute;
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
