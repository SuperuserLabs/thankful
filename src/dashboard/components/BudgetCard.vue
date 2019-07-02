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
        v-text-field(outline, v-model="budget_per_month", type='number', prefix="$", suffix="/month", step=1, min=0, single-line, hide-details)
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
        v-text-field(outline, disabled, style="secondary", v-model="budget_per_thanks", type='number', prefix="$", suffix="/thanks", step=1, min=0, single-line, hide-details)

    v-card-actions.justify-end
      //v-flex(style="align-items: center; justify-content: center;")
      v-btn(large, outline, color="primary")
        | Redistribute ${{ budget_per_month.toFixed(2) }}
</template>

<style>
/* This is needed to fix weird behavior of prefix */
.v-text-field__prefix {
  margin-top: 0 !important;
}
</style>

<script>
import { mapGetters } from 'vuex';

export default {
  data: function() {
    return {};
  },
  computed: {
    budget_per_month: {
      get() {
        return this.$store.state.settings.budget_per_month;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', {
          budget_per_month: value,
        });
      },
    },
    budget_per_thanks: {
      get() {
        return this.$store.state.settings.budget_per_thanks;
      },
      set(value) {
        this.$store.commit('settings/updateSettings', {
          budget_per_thanks: value,
        });
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
