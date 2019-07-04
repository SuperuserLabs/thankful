import _ from 'lodash';

let state = {
  activities: [],
  creators: [],
};

function addActivity(obj) {
  state.activities.push(obj);
}

function addCreator(obj) {
  obj.duration = _.sum(
    _.map(_.filter(state.activities, a => a.creator_id === obj.id), 'duration')
  );
  state.creators.push(obj);
}

addActivity({
  id: 1,
  creator_id: 1,
  title: 'Thankful',
  url: 'https://getthankful.io',
  duration: 0,
});

addActivity({
  id: 2,
  creator_id: 2,
  title: 'dotfiles',
  url: 'https://github.com/ErikBjare/dotfiles',
  duration: 120,
});

addActivity({
  id: 3,
  creator_id: 3,
  title: 'dwilid',
  url: 'https://github.com/dwilid',
  duration: 8,
});

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
  priority: 0,
});

addCreator({
  id: 3,
  name: 'Dwight Lidman',
  address: '0xFad9Ba550BCaFC73754a4E5d0a2f61b9BEedE71c',
  url: ['https://github.com/dwilid'],
  priority: 0,
});

addCreator({
  id: 4,
  name: 'Patrik Laurell',
  address: '0xbcEf85708670FA0127C484Ac649724B8028Ea08b',
  url: ['https://github.com/patrik-laurell'],
  priority: 0,
});

export default state;
