<template lang="pug">
  v-card.my-3
    v-card-title.display-1.pb-0
      | Missing addresses
    v-card-text
      | To donate, you have to manually fill in the creator addresses. (We're working on making this easier, sorry for the inconvenience)
      br
      | The below are links to known addresses, and a form to submit missing addresses. In the future, a database with known addresses will be loaded automatically.

    v-card-actions.justify-end
      v-btn(outline, target="_blank", href="https://docs.google.com/spreadsheets/d/1-eQaGFvbwCnxY9UCgjYtXRweCT7yu92UC2sqK1UEBWc/edit?usp=sharing")
        | List of addresses
      v-btn(outline, color="blue", target="_blank", href="https://docs.google.com/forms/d/e/1FAIpQLSc0E_Ea6KAa_UELMexYYyJh4E6A0XJCrHGsRRlWDleafNvByA/viewform")
        | Submit new addresses
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
