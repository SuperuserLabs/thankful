<template lang="pug">
v-card(height='116px').mt-1
  v-card-title.pb-0
    div(style="text-overflow: ellipsis; overflow-x: hidden; width: 100%; text-align: center;")
      h3.mb-0 {{ name }}
    div(style="margin: 0 auto;")
      t-creator-sites(:urls='urls')
  v-card-actions.pt-0
    v-layout(row, align-center).ma-0.pl-1.body-1.text--secondary
      span(v-if="duration").pr-1
        v-tooltip(bottom)
          span(slot="activator")
            v-icon(small) watch_later
            span.px-1
              | {{ duration | fixed(0) | friendlyShortDuration }}
          span
            // Time spent on creator
            | {{ $t('tip.timespent_creator') }}
      span(v-if="thanksAmount").pr-1
        v-tooltip(bottom)
          span(slot="activator")
            v-icon(small, color="red", style="opacity: 0.8") favorite
            span.px-1
              | {{ thanksAmount }}
          span
            // Times you've thanked this creators content
            | {{ $t('tip.thanks_creator') }}
    v-spacer
    v-tooltip(bottom left)
      v-btn(slot="activator", icon, @click='$emit("ignore")')
        v-icon clear
      span
        | {{ $t('tip.ignore') }}
    v-menu(bottom left)

      v-btn(slot="activator" icon)
        v-icon more_vert

      v-list(hover)
        v-list-tile(@click='$emit("edit")')
          v-list-tile-action
            v-icon edit
          v-list-tile-content
            v-list-tile-title
              | Edit
        v-tooltip(bottom)
          template(slot='activator')
            v-list-tile(@click='$emit("ignore")')
              v-list-tile-action
                v-icon clear
              v-list-tile-content
                v-list-tile-title
                  | Ignore
          | {{ $t('tip.ignore') }}
        v-list-tile(@click='$emit("activity")')
          v-list-tile-action
            v-icon history
          v-list-tile-content
            v-list-tile-title
              | Show activity
</template>

<script>
import CreatorSites from './CreatorSites.vue';

export default {
  data() {
    return this.setDefaultData({});
  },
  components: {
    't-creator-sites': CreatorSites,
  },
  props: {
    creator: Object,
  },
  watch: {
    allocatedFunds(to) {
      this.$emit('allocatedFunds', to);
    },
  },
  methods: {
    setDefaultData(obj) {
      return Object.assign(obj, {
        address: this.creator.address || '',
        name: this.creator.name,
        urls: this.creator.url,
        duration: this.creator.duration,
        thanksAmount: this.creator.thanksAmount,
      });
    },
    ignore() {
      this.$store.commit('notifications/insert', {
        text: 'ignore not implemented',
        type: 'error',
      });
    },
    cancel() {
      this.setDefaultData(this);
      this.$emit('cancel');
    },
  },
};
</script>

<style>
a h6,
a h6:visited {
  color: #222 !important;
}
</style>
