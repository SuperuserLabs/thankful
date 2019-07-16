import _ from 'lodash';

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
    _.map(obj.activity, a => {
      a.creator_id = obj.id;
      addActivity(a);
    });
    obj.activity = undefined;
  }
  obj.duration = _.sum(
    _.map(_.filter(state.activities, a => a.creator_id === obj.id), 'duration')
  );
  state.creators.push(obj);
}

// Add creators

addCreator({
  name: 'Thankful Team',
  address: '0x44b8E57DE4494F6424Be86d28D2f0969d57aFca1',
  url: ['https://getthankful.io'],
  priority: 1,
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
      duration: 120,
    },
  ],
});

addCreator({
  name: 'Dwight Lidman',
  address: '0xFad9Ba550BCaFC73754a4E5d0a2f61b9BEedE71c',
  url: ['https://github.com/dwilid'],
  thanksAmount: 1,
  activity: [
    {
      creator_id: 3,
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
  thanksAmount: 1,
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
  url: ['https://www.youtube.com/channel/UCNOfzGXD_C9YMYmnefmPH0g'],
  thanksAmount: 3,
  activity: [
    {
      creator_id: 6,
      title: 'The Web We Want by Brewster Kahle (Devcon4)',
      url: 'https://www.youtube.com/watch?v=rkdFko6wNuc',
      duration: 37 * 60 + 45,
    },
  ],
});

addCreator({
  name: 'Scott Manley',
  url: ['https://www.youtube.com/channel/UCxzC4EngIsMrPmbm6Nxvb-A'],
});

addCreator({
  name: 'Tom Scott',
  url: ['https://www.youtube.com/channel/UCBa659QWEk1AI4Tg--mrJ2A'],
});

addCreator({
  name: 'Crypto Daily',
  url: ['https://www.youtube.com/channel/UC67AEEecqFEc92nVvcqKdhA'],
});

addCreator({
  name: 'Jackson Palmer',
  url: ['http://www.youtube.com/channel/UCTOzxu_HvuJfZtTJ6AZ7rkA'],
});

addCreator({
  name: 'aantonop',
  url: ['https://www.youtube.com/channel/UCJWCJCWOxBYSi5DhCieLOLQ'],
  thanksAmount: 2,
  activity: [
    {
      url: 'https://www.youtube.com/watch?v=qlAhXo-d-64',
      duration: 29 * 60,
    },
  ],
});

addCreator({
  name: 'ActivityWatch',
  url: ['https://github.com/ActivityWatch'],
  activity: [
    {
      url: 'https://github.com/ActivityWatch/activitywatch',
      duration: 234,
    },
  ],
});

export default state;
