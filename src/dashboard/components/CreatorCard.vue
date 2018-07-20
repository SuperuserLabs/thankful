<template lang="pug">
v-card(height='116px').mt-1
  v-layout
    v-flex
      a(:href="url" target="_blank" style="text-decoration: none !important").headline
        v-btn(flat large block style="text-transform: none")
          div.headline.pr-1
            font-awesome-icon(v-if='isOnDomain(url, "getthankful.io")', :icon="['fas', 'star']", color='#FFCC44')
            font-awesome-icon(v-if='isOnDomain(url, "youtube.com")', :icon="['fab', 'youtube']", color='red')
            font-awesome-icon(v-if='isOnDomain(url, "github.com")', :icon="['fab', 'github']", color='black')
          | {{ name }}
  v-card-actions
    v-layout(row, align-center).ma-0.subheading.text--secondary
      span(v-if="duration").px-1
        | {{ duration | fixed(0) | friendlyDuration(1) }}
      span.px-1
        | 10
      v-icon(small) favorite
    v-spacer
    v-menu(bottom left)
      v-btn(slot="activator" icon)
        v-icon more_vert

      v-list(hover)
        v-list-tile(@click='$emit("click")')
          v-list-tile-action
            v-icon edit
          v-list-tile-content
            v-list-tile-title
              | Edit
        v-list-tile(@click='ignore()')
          v-list-tile-action
            v-icon visibility_off
          v-list-tile-content
            v-list-tile-title
              | Ignore (no impl.)
        v-list-tile(@click='show_activity()')
          v-list-tile-action
            v-icon history
          v-list-tile-content
            v-list-tile-title
              | Show activity (no impl.)
</template>

<script>
import { isOnDomain } from '../../lib/url.js';

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
        url: this.creator.url,
        duration: this.creator.duration,
      });
    },
    show_activity() {
      this.$store.commit('notifications/insert', {
        text: 'show_activity not implemented',
        type: 'error',
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
