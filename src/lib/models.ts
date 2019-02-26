import { canonicalizeUrl } from './url.ts';

// TODO: Write tests

// In the future, maybe use private fields instead:?
//   https://github.com/tc39/proposal-class-fields
// I thought I could use symbols, but that didn't work out.
let modelAttrs = {};

class Model {
  constructor() {}

  async save() {
    // Does an update if the row already exists, otherwise does a put.
    let keyname = modelAttrs[this.constructor.name].key;
    let key = this[keyname];
    let table = modelAttrs[this.constructor.name].table;
    return table.add(this).catch(() => table.update(key, this));
  }

  put() {
    let table = modelAttrs[this.constructor.name].table;
    return table.put(this);
  }

  delete() {
    let key = this[modelAttrs[this.constructor.name].key];
    let table = modelAttrs[this.constructor.name].table;
    return table.delete(key);
  }
}

export interface IActivity {
  url: string;
  title?: string;
  duration: number;
  creator_id?: number;
  creator?: number;
}

export class Activity extends Model implements IActivity {
  url: string;
  title: string;
  duration: number;
  creator_id: number;

  constructor(url, title, duration, creator_id) {
    super();
    this.url = canonicalizeUrl(url);
    this.title = cleanTitle(title);
    this.duration = duration;
    this.creator_id = creator_id;
  }
}

export interface ICreator {
  id?: number;
  url: string[];
  name: string;
  ignore: boolean;
  address?: string;
  share?: number;
  info?: string;
  duration?: number;
  priority?: number;
}

export class Creator extends Model {
  url: string[];
  name: string;
  ignore: boolean;

  constructor(url, name, ignore = false) {
    super();
    if (typeof url !== 'string') {
      throw 'url was invalid type';
    }
    this.url = [url];
    this.name = name;
    this.ignore = ignore;
  }
}

export interface IDonation {
  date: string;
  creator_id: number;
  weiAmount: string;
  usdAmount: string;
  transaction: number;
}

export class Donation {
  date: string;
  creator_id: number;
  weiAmount: string;
  usdAmount: string;
  transaction: number;

  constructor(creator_id, weiAmount, usdAmount, transaction) {
    this.date = new Date().toISOString();
    this.creator_id = creator_id;
    this.weiAmount = weiAmount;
    this.usdAmount = usdAmount;
    this.transaction = transaction;
  }
}

export interface IThank {
  url: string;
  date: string;
  title: string;
  creator_id: number;
}

export class Thank {
  url: string;
  date: string;
  title: string;
  creator_id: number;

  constructor(url, title, creator_id) {
    this.url = canonicalizeUrl(url);
    this.date = new Date().toISOString();
    this.title = cleanTitle(title);
    this.creator_id = creator_id;
  }
}

export function registerModel(db, cls, table, key) {
  table.mapToClass(cls);
  modelAttrs[cls.prototype.constructor.name] = {
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
