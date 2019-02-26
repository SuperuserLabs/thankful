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

  if (_listeners[type] !== undefined) {
    console.info(`Using registerListener for message type: ${type}`);
    let listener = <any>_listeners[type].bind(db);
    return await listener(...data);
  } else {
    throw `Unhandled message type: ${type}`;
  }
}
