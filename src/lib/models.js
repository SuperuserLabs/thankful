import { canonicalizeUrl } from './url.js';

// In the future, use private fields instead:
//   https://github.com/tc39/proposal-class-fields
// I thought I could use symbols, but that didn't work out.
let modelAttrs = {};

class Model {
  constructor() {}

  async save() {
    // Does an update if the row already exists, otherwise does a put.
    let keyname = modelAttrs[this.constructor].key;
    let key = this[keyname];
    let table = modelAttrs[this.constructor].table;
    return table.add(this).catch(() => table.update(key, this));
  }

  put() {
    let table = modelAttrs[this.constructor].table;
    return table.put(this);
  }

  delete() {
    let key = this[modelAttrs[this.constructor].key];
    let table = modelAttrs[this.constructor].table;
    return table.delete(key);
  }
}

export class Activity extends Model {
  constructor(url, title, duration, creator) {
    super();
    this.url = canonicalizeUrl(url);
    this.title = cleanTitle(title);
    this.duration = duration;
    this.creator = creator;
  }
}

export class Creator extends Model {
  constructor(url, name, ignore = false) {
    super();
    if (typeof url !== 'string') {
      throw 'url was invalid type';
    }
    this.url = url;
    this.name = name;
    this.ignore = ignore;
  }
}

export class Donation {
  constructor(creatorUrl, weiAmount, usdAmount, transaction) {
    this.date = new Date().toISOString();
    this.url = creatorUrl;
    this.weiAmount = weiAmount;
    this.usdAmount = usdAmount;
    this.transaction = transaction;
  }
}

export class Thank {
  constructor(url, title, creator) {
    this.url = canonicalizeUrl(url);
    this.date = new Date().toISOString();
    this.title = cleanTitle(title);
    this.creator = creator;
  }
}

export function registerModel(db, cls, table, key) {
  table.mapToClass(cls);
  modelAttrs[cls.prototype.constructor] = {
    table: table,
    key: key,
  };
}

function cleanTitle(title) {
  // Clean title from leading ({number}) as common for
  // notification counters on e.g. YouTube.
  if (title !== undefined) {
    return title.replace(/^\([0-9]+\)\s*/, '');
  }
}
