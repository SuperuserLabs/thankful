<template lang="pug">
v-card(height='116px')
  //v-card-title
  v-flex.text-xs-center
    a(:href="creator.url" target="_blank" style="text-decoration: none !important").headline
      v-btn(flat large block style="text-transform: none")
        div(style="font-size: 1.5em; padding-right: 0.5em")
          font-awesome-icon(v-if='url.includes("getthankful.io")', :icon="['fas', 'star']", color='#FFCC44')
          font-awesome-icon(v-if='isOnDomain(url,"youtube.com")', :icon="['fab', 'youtube']", color='red')
          font-awesome-icon(v-if='isOnDomain(url,"github.com")', :icon="['fab', 'github']", color='black')
        | {{ name }}
  v-card-actions
    div(v-if="duration" style="padding-left: 0.5em").subheading.text--secondary
      | {{ duration | fixed(0) | friendlyDuration }}
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
    ignore() {
      console.warn('ignore not implemented');
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
