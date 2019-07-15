<template lang="pug">
v-container
  v-stepper(:value="step")
    v-stepper-header
      v-stepper-step(step="1", :complete="step > 1") Review your donations
      v-divider
      v-stepper-step(step="2", :complete="step > 2") Sign transactions
      v-divider
      v-stepper-step(step="3", :complete="step > 2") Done

    v-stepper-content(step="1")
      donation-summary(ref='donationSummary', @error="$error('Donation failed')($event)", checkout="true", :distribution="distribution")
      v-layout(row)
        v-flex
        v-flex(shrink)
          v-btn(color="primary", @click="processTransactions()") Continue 
    v-stepper-content(step="2")
      h3 Sign transactions in metamask
      v-list
        v-list-tile(v-for="d in pendingDonations", :key="d.id")
          v-list-tile-action
            v-progress-circular(v-if="d.status === 'pending'", indeterminate, color="primary")
            v-icon(v-else-if="d.status === 'failed'") error
            v-icon(v-else-if="d.status === 'completed'", color="primary") check_circle
          v-list-tile-content
            v-list-tile-title(v-text="d.name")
    v-stepper-content(step="3")
      h3 All donations where successful! 
      p Thank you for supporting these creators, it helps build a healthier internet! You can now go back to browsing as usual. We will remind you when it is time to donate again. 
</template>

<script>
import DonationSummary from '../components/DonationSummary.vue';
import { mapState, mapGetters } from 'vuex';

export default {
  components: {
    'donation-summary': DonationSummary,
  },
  data: () => ({
    step: 1,
    transactions: [],
  }),
  computed: {
    ...mapState('settings', ['budget_per_month']),
    ...mapState('metamask', ['pendingDonations', 'distribution']),
    ...mapGetters({
      creators: 'db/creatorsWithShare',
    }),
  },
  methods: {
    processTransactions() {
      console.log('processTransactions()');
      this.step = 2;
      console.log(this.distribution);
      this.transactions = Object.values(this.distribution).map(d => {
        return {
          ...d,
          status: 'in-progress',
        };
      });
      this.donateAll();
    },
    async donateAll() {
      console.log(this.distribution);
      try {
        await this.$store.dispatch('metamask/donateAll', this.distribution);
      } catch (e) {
        console.error('donateAll (in vue) error:', e);
        // We're currently not catching the emitting anywhere so we
        // console.error for now
        this.$emit('error', e);
      }
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
  },
  async created() {
    await this.$store.dispatch('db/ensureDonations');
  },
  watch: {
    pendingDonations() {
      let donationSuccess = Object.values(this.pendingDonations).every(
        x => x.status === 'completed'
      );
      let donationFailure = Object.values(this.pendingDonations).some(
        x => x.status === 'failed'
      );

      if (donationSuccess) {
        this.step = 3;
      }

      if (donationFailure) {
        this.$error('Donation failed')('One or more of the donations failed.');
      }
    },
  },
};
</script>
