/*eslint no-shadow: [2, { "allow": ["find"] }]*/

import { map, find, intersection, sum, filter } from 'lodash';
import addressRegistry from '../../dist/crypto_addresses.json';

export function build_demodata() {
  let state = {
    activities: [],
    creators: [],
  };

  function addActivity(obj) {
    obj.id = state.activities.length + 1;
    state.activities.push(obj);
  }

  function addCreator(obj) {
    obj.id = state.creators.length + 1;
    obj.priority = obj.priority || 0;
    obj.thanksAmount = obj.thanksAmount || 0;
    obj.share = obj.share || null;
    if (obj.activity) {
      map(obj.activity, a => {
        a.creator_id = obj.id;
        addActivity(a);
      });
      obj.activity = undefined;
    }
    obj.duration = sum(
      map(filter(state.activities, a => a.creator_id === obj.id), 'duration')
    );

    // A shorter and simpler version of _attributeAddressToCreatorFromRegistry in db.ts
    let reg_creator = find(
      addressRegistry,
      reg_c => intersection(reg_c.urls, obj.url).length > 0
    );
    if (reg_creator) {
      obj.address = reg_creator['eth address'];
      obj.url = Array.from(new Set([...obj.url, ...reg_creator.urls]));
    }

    state.creators.push(obj);
  }

  // Add creators

  addCreator({
    name: 'Thankful Team',
    address: '0x44b8E57DE4494F6424Be86d28D2f0969d57aFca1',
    url: ['https://getthankful.io'],
    share: 0.05,
    //priority: 1,
    activity: [
      {
        title: 'Thankful',
        url: 'https://getthankful.io',
        duration: 3 * 60 + 23,
      },
    ],
  });

  addCreator({
    name: 'Erik Bjäreholt',
    address: '0x497A128cf7C1Dc455Df618eA833e3ed78E49466E',
    url: ['https://github.com/ErikBjare'],
    activity: [
      {
        title: 'dotfiles',
        url: 'https://github.com/ErikBjare/dotfiles',
        duration: 3 * 60 + 58,
      },
      {
        title: 'QuantifiedMe',
        url: 'https://github.com/ErikBjare/QuantifiedMe',
        duration: 6 * 60 + 38,
      },
    ],
  });

  addCreator({
    name: 'Dwight Lidman',
    address: '0xFad9Ba550BCaFC73754a4E5d0a2f61b9BEedE71c',
    url: ['https://github.com/dwilid'],
    activity: [
      {
        title: 'dwilid',
        url: 'https://github.com/dwilid',
        duration: 8,
      },
    ],
  });

  addCreator({
    name: 'Patrik Laurell',
    address: '0xbcEf85708670FA0127C484Ac649724B8028Ea08b',
    url: ['https://github.com/patrik-laurell'],
    activity: [
      {
        url: 'https://github.com/patrik-laurell',
        duration: 98,
      },
    ],
  });

  addCreator({
    name: 'Veritasium',
    url: ['https://www.youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA'],
    activity: [
      {
        url: 'https://www.youtube.com/watch?v=aIx2N-viNwY',
        duration: 7 * 60 + 41,
      },
    ],
  });

  addCreator({
    name: 'Ethereum Foundation',
    url: [
      'https://github.com/ethereum',
      'https://www.youtube.com/channel/UCNOfzGXD_C9YMYmnefmPH0g',
      'https://twitter.com/ethereum',
    ],
    thanksAmount: 1,
    activity: [
      {
        title: 'The Web We Want by Brewster Kahle (Devcon4)',
        url: 'https://www.youtube.com/watch?v=rkdFko6wNuc',
        duration: 37 * 60 + 45,
      },
    ],
  });

  addCreator({
    name: 'Scott Manley',
    url: ['https://www.youtube.com/channel/UCxzC4EngIsMrPmbm6Nxvb-A'],
    activity: [
      {
        url: 'https://www.youtube.com/watch?v=NCMpd7-Cp24',
        duration: 11 * 60 + 2,
      },
    ],
  });

  addCreator({
    name: 'Hampus Jakobsson',
    thanksAmount: 1,
    url: [
      'https://medium.com/@hajak',
      'https://hajak.se/',
      'https://twitter.com/hajak',
    ],
    activity: [
      {
        url: 'https://hajak.se/how-to-plan-your-next-move-7a68bb7d9a2',
        duration: 8 * 60 + 4,
      },
      {
        url:
          'https://hajak.se/founders-are-not-fuel-to-be-burnt-on-the-altar-of-innovation-1b7a5354a686',
        duration: 4 * 60 + 23,
      },
    ],
  });

  addCreator({
    name: 'Tom Scott',
    url: ['https://www.youtube.com/channel/UCBa659QWEk1AI4Tg--mrJ2A'],
  });

  addCreator({
    name: '3Blue1Brown',
    url: ['https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw'],
    thanksAmount: 1,
    activity: [
      {
        url: 'https://www.youtube.com/watch?v=aircAruvnKk',
        duration: 32 * 60 + 13,
      },
    ],
  });

  addCreator({
    name: 'Crypto Daily',
    url: ['https://www.youtube.com/channel/UC67AEEecqFEc92nVvcqKdhA'],
  });

  addCreator({
    name: 'Kurzgesagt - In a Nutshell',
    url: ['https://www.youtube.com/channel/UCsXVk37bltHxD1rDPwtNM8Q'],
    activity: [
      {
        url: 'https://www.youtube.com/watch?v=UjtOGPJ0URM',
        duration: 9 * 60 + 35,
      },
    ],
  });

  addCreator({
    name: 'Jackson Palmer',
    url: ['http://www.youtube.com/channel/UCTOzxu_HvuJfZtTJ6AZ7rkA'],
  });

  addCreator({
    name: 'aantonop',
    url: [
      'https://www.youtube.com/channel/UCJWCJCWOxBYSi5DhCieLOLQ',
      'https://twitter.com/aantonop',
    ],
    thanksAmount: 1,
    activity: [
      {
        url: 'https://www.youtube.com/watch?v=qlAhXo-d-64',
        duration: 29 * 60,
      },
    ],
  });

  addCreator({
    name: 'ActivityWatch',
    url: [
      'https://github.com/ActivityWatch',
      'https://twitter.com/ActivityWatchIt',
    ],
    activity: [
      {
        url: 'https://github.com/ActivityWatch/activitywatch',
        duration: 234,
      },
    ],
  });

  return state;
}
