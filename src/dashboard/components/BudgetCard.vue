<template lang="pug">
  v-card.my-3
    v-card-title.display-1.pb-0
      | Budget
    v-card-text
      b Not sure how much to support with?
      br
      | Start with something sustainable, like $10 a month (about what you pay for Spotify or Netflix).
      br
      span.text--secondary (You're getting more bang for your buck: Thankful is a much more effective way of supporting creators compared to Spotify or Netflix)

    v-layout.row
      v-flex.xs4
        v-subheader Support per month
      v-flex.xs8.pr-3
        //v-text-field(value="10.00", prefix="$", suffi="/month", )
        v-text-field(outline, v-model="budget", type='number', prefix="$", suffix="/month", step=1, min=0, single-line, hide-details)
        // label="Monthly time budget",
    v-layout.row(style="opacity: 0.3")
      v-flex.xs4
        v-subheader
          | Support per "thank you"
          br
          | (Coming soon)
      v-flex.xs8.pr-3
        //v-text-field(
          label="Money sent with each thank you",
          value="10.00",
          prefix="$")
        v-text-field(outline, disabled, style="secondary", v-model="thanks_amount", type='number', prefix="$", suffix="/thanks", step=1, min=0, single-line, hide-details)

    v-card-actions.justify-end
      //v-flex(style="align-items: center; justify-content: center;")
      v-btn(large, outline, color="primary", @click="this.$emit('updateBudget', budget)")
        | Redistribute ${{ budget }}
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data: function() {
    return {};
  },
  computed: {
    budget: {
      get() {
        return this.$store.state.settings.totalAmount;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', { totalAmount: value });
      },
    },
  },
  methods: {
    distribute() {
      this.distribution = this.creators.map(c => {
        return {
          ...c,
          funds: parseFloat((c.share * this.budget).toFixed(2)),
        };
      });
    },
    ...mapGetters({
      isAddress: 'metamask/isAddress',
      creators: 'db/creatorsWithShare',
    }),
  },
};
</script>
