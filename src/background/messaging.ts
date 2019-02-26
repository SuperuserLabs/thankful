type TGenericFunc = (...args: any[]) => any;

let _listeners: { [key: string]: TGenericFunc } = {};

export function registerListener(
  func: TGenericFunc,
  { name = null }: { name?: string }
) {
  name = name || func.name;
  _listeners[name] = func;
}

export async function dbListener({
  type,
  data,
}: {
  type: string;
  data: any;
}): Promise<any> {
  // Import must be here to prevent cyclic dependency
  let getDatabase = require('../lib/db.ts').getDatabase;
  const db = getDatabase();

  // FIXME: Make this work
  if (_listeners[type] !== undefined) {
    console.info(`Using registerListener for message type: ${type}`);
    let listener = <any>_listeners[type].bind(db);
    let response = await listener(...data);
    if (response === undefined) {
      console.warn(`Received no response from registered listener ${type}`);
    }
    return response;
  } else {
    // FIXME: Deprecated, replace with use of registerListener
    console.warn(`Using fallback dbListener for message type: ${type}`);
    switch (type) {
      case 'getDonation':
        return (<any>db.getDonation)(...data);
      case 'getDonations':
        return (<any>db.getDonations)(...data);
      case 'getCreators':
        return (<any>db.getCreators)(...data);
      case 'getActivities':
        return (<any>db.getActivities)(...data);
      case 'logDonation':
        return (<any>db.logDonation)(...data);
      case 'updateCreator':
        return (<any>db.updateCreator)(...data);
      default:
        throw `Unhandled message type: ${type}`;
    }
  }
}
