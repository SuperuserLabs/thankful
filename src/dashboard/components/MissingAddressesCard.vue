<template lang="pug">
  v-card.my-3
    v-card-title.title.pb-0
      v-icon.mr-2(color="blue") info
      | Missing addresses
    v-card-text
      | We couldn't automatically find the addresses for some of your favorite creators.
      br
      | You can either fill them in manually or submit them to #[a(href="https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/edit?usp=sharing") our registry] (a copy of which is shipped with Thankful) using the button below.

    v-card-actions.justify-end
      v-btn(outline, color="primary", target="_blank", href="https://docs.google.com/forms/d/e/1FAIpQLSc0E_Ea6KAa_UELMexYYyJh4E6A0XJCrHGsRRlWDleafNvByA/viewform")
        | Submit address to registry
</template>

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
