<template lang="pug">
v-card(height='14rem', @click.native='$emit("click")', hover)
  v-container
    v-flex.text-xs-center
      font-awesome-icon(v-if='isOnDomain(url,"youtube.com")', :icon="['fab', 'youtube']", size="4x", color='red')
      font-awesome-icon(v-if='isOnDomain(url,"github.com")', :icon="['fab', 'github']", size="4x", color='black')
    v-card-title(primary-title)
      v-flex.text-xs-center
          div.headline
            |  {{ name }}
      //-b-input-group(prepend="ETH Address", size="sm")
        //-b-form-input(placeholder="Address", v-model='address')
      //-div.pt-3
        //-v-btn(v-if='creator.edited', variant="danger", size="sm", v-on:click='$emit("remove")')
          //-| #[font-awesome-icon(icon="trash")] Delete
        //-v-btn(variant="success", size="sm", v-on:click='save()').float-right.mr-2
          //-| #[font-awesome-icon(icon="save")] Save
        //-v-btn(variant="danger", size="sm", v-on:click='cancel()').float-right.mr-2
          //-| #[font-awesome-icon(icon="ban")] Cancel
</template>

<script>
import _ from 'lodash';
import { isOnDomain } from '../lib/url.js';

export default {
  data() {
    return this.setDefaultData({});
  },
  props: {
    creator: Object,
    editing: Boolean,
  },
  watch: {
    allocatedFunds(to) {
      this.$emit('allocatedFunds', to);
    },
    address(to) {
      if (!this.editing) {
        this.$emit('address', to);
      }
    },
  },
  methods: {
    isDomain(url, hostname) {
      let reg = RegExp(`^.*://(www\.)?${hostname}/?`);
      return reg.test(url);
    },
    isOnDomain: isOnDomain,
    setDefaultData(obj) {
      return Object.assign(obj, {
        address: this.creator.address || '',
        name: this.creator.name,
        url: this.creator.url,
      });
    },
    save() {
      if (this.url && this.name) {
        if (!/^https?:\/\//i.test(this.url)) {
          this.url = 'http://' + this.url;
        }
        this.$emit('save', {
          name: this.name,
          url: this.url,
          address: this.address,
          edited: true,
        });
      } else {
        this.errors['url'] = this.url === '';
        this.errors['name'] = this.name === '';
      }
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
