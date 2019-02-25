<template lang="pug">
v-card(height='116px').mt-1
  v-layout
    v-flex
      a(:href="url" target="_blank" style="text-decoration: none !important").headline
        v-btn(flat large block style="text-transform: none; padding: 0 0.2em 0 0.2em")
          div.headline.pr-1
            font-awesome-icon(v-if='isOnDomain(url, "getthankful.io")', :icon="['fas', 'star']", color='#FFCC44')
            font-awesome-icon(v-if='isOnDomain(url, "youtube.com")', :icon="['fab', 'youtube']", color='red')
            font-awesome-icon(v-if='isOnDomain(url, "github.com")', :icon="['fab', 'github']", color='black')
            font-awesome-icon(v-if='isOnDomain(url, "medium.com")', :icon="['fab', 'medium']", color='black')
          div(style="text-overflow: ellipsis; overflow-x: hidden;")
            | {{ name }}
  v-card-actions
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
            v-icon(small) favorite
            span.px-1
              | {{ thanksAmount }}
          span
            // Times you've thanked this creators content
            | {{ $t('tip.thanks_creator') }}
    v-spacer
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
                v-icon visibility_off
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
import { isOnDomain } from '../../lib/url.ts';

export default {
  data() {
    return this.setDefaultData({});
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
    isOnDomain: isOnDomain,
    setDefaultData(obj) {
      return Object.assign(obj, {
        address: this.creator.address || '',
        name: this.creator.name,
        url: this.creator.url[0],
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
