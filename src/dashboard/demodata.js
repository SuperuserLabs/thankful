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
  obj.duration = _.sum(
    _.map(_.filter(state.activities, a => a.creator_id === obj.id), 'duration')
  );
  obj.priority = obj.priority || 0;
  obj.thanksAmount = obj.thanksAmount || 0;
  obj.share = obj.share || null;
  state.creators.push(obj);
}

// Add activity

addActivity({
  creator_id: 1,
  title: 'Thankful',
  url: 'https://getthankful.io',
  duration: 0,
});

addActivity({
  creator_id: 2,
  title: 'dotfiles',
  url: 'https://github.com/ErikBjare/dotfiles',
  duration: 120,
});

addActivity({
  creator_id: 3,
  title: 'dwilid',
  url: 'https://github.com/dwilid',
  duration: 8,
});

addActivity({
  creator_id: 6,
  title: 'The Web We Want by Brewster Kahle (Devcon4)',
  url: 'https://www.youtube.com/watch?v=rkdFko6wNuc',
  duration: 37 * 60 + 45,
});

// Add creators

addCreator({
  id: 1,
  name: 'Thankful Team',
  address: '0x44b8E57DE4494F6424Be86d28D2f0969d57aFca1',
  url: ['https://getthankful.io'],
  priority: 1,
});

addCreator({
  id: 2,
  name: 'Erik Bjäreholt',
  address: '0x497A128cf7C1Dc455Df618eA833e3ed78E49466E',
  url: ['https://github.com/ErikBjare'],
});

addCreator({
  id: 3,
  name: 'Dwight Lidman',
  address: '0xFad9Ba550BCaFC73754a4E5d0a2f61b9BEedE71c',
  url: ['https://github.com/dwilid'],
  thanksAmount: 1,
});

addCreator({
  id: 4,
  name: 'Patrik Laurell',
  address: '0xbcEf85708670FA0127C484Ac649724B8028Ea08b',
  url: ['https://github.com/patrik-laurell'],
});

addCreator({
  id: 5,
  name: 'Veritasium',
  url: ['https://www.youtube.com/channel/UCHnyfMqiRRG1u-2MsSQLbXA'],
});

addCreator({
  id: 6,
  name: 'Ethereum Foundation',
  url: ['https://www.youtube.com/channel/UCNOfzGXD_C9YMYmnefmPH0g'],
  thanksAmount: 3,
});

addCreator({
  id: 7,
  name: 'Scott Manley',
  url: ['https://www.youtube.com/channel/UCxzC4EngIsMrPmbm6Nxvb-A'],
});

addCreator({
  id: 8,
  name: 'Tom Scott',
  url: ['https://www.youtube.com/channel/UCBa659QWEk1AI4Tg--mrJ2A'],
});

addCreator({
  id: 9,
  name: 'Crypto Daily',
  url: ['https://www.youtube.com/channel/UC67AEEecqFEc92nVvcqKdhA'],
});

addCreator({
  id: 10,
  name: 'Jackson Palmer',
  url: ['http://www.youtube.com/channel/UCTOzxu_HvuJfZtTJ6AZ7rkA'],
});

addCreator({
  id: 11,
  name: 'aantonop',
  url: ['https://www.youtube.com/channel/UCJWCJCWOxBYSi5DhCieLOLQ'],
  thanksAmount: 2,
});

export default state;
