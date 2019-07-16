<template lang="pug">
v-footer(height="auto") 
  v-card.text-xs-center.m-0(flat, tile, style="width: 100%")
    v-card-text.pa-2
      v-btn(v-for="link in links" :key="link.text" flat :href="link.link" :icon="link.icon" target="_blank" large)
        font-awesome-icon(v-if="link.icon === 'globe'", :icon="['fas', link.icon]")
        font-awesome-icon(v-else, :icon="['fab', link.icon]")
    v-divider
    v-card-text(py-3 text-xs-center xs12)
      | © MPL-2.0 — <strong>Thankful</strong>
</template>

<script>
export default {
  data: function() {
    return {
      links: [
        {
          text: 'Website',
          icon: 'globe',
          link: 'https://getthankful.io',
        },
        {
          text: 'Twitter',
          icon: 'twitter',
          link: 'https://twitter.com/getthankful',
        },
        {
          text: 'Facebook',
          icon: 'facebook-f',
          link: 'https://www.facebook.com/Thankful-2303002679777110/',
        },
        {
          text: 'GitHub',
          icon: 'github',
          link: 'https://github.com/SuperuserLabs/thankful/',
        },
      ],
    };
  },
};
</script>
