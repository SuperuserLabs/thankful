<template lang="pug">
v-footer(height="auto") 
  v-card.text-xs-center.m-0(flat, tile, style="width: 100%")
    v-card-text
      v-btn(v-for="link in links" :key="link.text" flat :href="link.link" :icon="link.icon" target="_blank" large)
        | {{ link.icon ? '' : link.text }}
        font-awesome-icon(:icon="['fab', link.icon]")
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
          text: 'Twitter',
          link: 'https://twitter.com/getthankful',
        },
        {
          text: 'Facebook',
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
