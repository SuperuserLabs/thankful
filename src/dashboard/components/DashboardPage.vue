<template lang="pug">
div
  a(v-on:click='toTop()', v-if='notifications.length > 0', style='position:fixed;bottom:20px;right:100px;z-index:100')
    v-icon(color='warning', x-large) warning
  div
    // For testing notifications:
    // v-btn(@click="errfun('lol')('lol')")
    v-alert(v-for="(msg, index) in notifications", :key='index', :type='msg.type', value="msg.active", dismissible, @input='hideNotification(msg.index)')
      b(v-if="msg.title")
        | {{ msg.title }}:&nbsp;
      | {{ msg.text }}
    v-dialog(v-model="dialog", max-width='500px')
      v-card(tile)
        v-toolbar(card dark color="primary")
          v-toolbar-title
            | Editing
          v-spacer
          v-toolbar-items
            v-btn(v-if='!editedCreator.new' dark flat @click='ignore();')
              | #[v-icon visibility_off] Ignore
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
          v-data-table(:headers="activityHeaders", :items="activityByCreator(currentCreator.url)", :pagination.sync='pagination')
            template(slot='items', slot-scope='props')
              td
                a(:href="props.item.url")
                  | {{ props.item.title || props.item.url }}
              td.text-right
                | {{ props.item.duration | friendlyDuration }}
    v-snackbar(v-model='showSnackbar', top) {{ snackMessage }}
      v-btn(color="pink", flat, @click="undo()") Undo
    v-container(grid-list-md)
      v-flex(xs12).mb-3
        div.display-1 Your favorite creators
      v-layout(v-if='loading', row, justify-center, align-center).pa-5
        v-progress-circular(indeterminate, :size='50')
      v-layout(v-else, row, wrap)
        v-flex(v-for="(creator, index) in creators", :key='creator.url', xs12, sm6, md3)
          creator-card(v-bind:creator="creator",
                       v-bind:key="creator.url",
                       @edit="edit(creator, index)")
        v-flex(xs12, sm6, md3)
          v-card(hover, @click.native="addCreator()", height='116px')
            v-container.text-xs-center
              v-icon(x-large) add
              div.text--secondary.title
                | Add creator

      v-layout(row)
        v-flex(xs12)
          donation-summary-component(:creators="creators", ref='donationSummary', @error="errfun('Donating failed')($event)")
</template>

<script>
import CreatorCard from './CreatorCard.vue';
import ActivityComponent from './ActivityComponent.vue';
import DonationHistoryComponent from './DonationHistoryComponent.vue';
import DonationSummaryComponent from './DonationSummaryComponent.vue';
import { Creator } from '../../lib/db.js';
import _ from 'lodash';
import { mapGetters } from 'vuex';

export default {
  components: {
    'creator-card': CreatorCard,
    'activity-component': ActivityComponent,
    'donation-history-component': DonationHistoryComponent,
    'donation-summary-component': DonationSummaryComponent,
  },
  data: () => ({
    valid: true,
    dialog: false,
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
      v => !v || this.$donate.isAddress(v) || 'Not a valid ETH address',
    ],
  }),
  computed: {
    ...mapGetters({
      creators: 'db/creatorsNotIgnored',
      activityByCreator: 'db/activityByCreator',
      notifications: 'notifications/active',
    }),
  },
  methods: {
    hideNotification(index) {
      this.$store.commit('notifications/hide', index);
    },
    toTop() {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    },
    errfun(title) {
      return message => {
        console.error(`${title}: ${message}`);
        this.$store.commit('notifications/insert', {
          title,
          text: message,
          type: 'error',
        });
      };
    },
    addCreator() {
      let c = new Creator('', '');
      c.priority = 2;
      c.new = true;
      this.edit(c, -1);
    },
    ignore() {
      this.currentCreator.ignore = false;
      this.editedCreator.ignore = true;
      this.save(`Ignored ${this.editedCreator.name}.`);
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
          this.dialog = false;
          this.snackMessage = message;
          this.showSnackbar = message.length > 0;
        });
    },
    undo() {
      this.$store.dispatch('db/undo');
    },
    edit(creator) {
      this.currentCreator = creator;
      this.editedCreator = _.pick(creator, ['name', 'url', 'address']);
      this.dialog = true;
    },
  },
  beforeCreate() {
    this.$store.dispatch('db/ensureCreators').then(() => {
      this.loading = false;
    });
    this.$store.dispatch('db/ensureActivities');
  },
};
</script>
