export function mapToDict<T>(map: Map<string, T>): Dict<T> {
  // tslint:disable-next-line:no-null-keyword
  let dict: Dict<T> = Object.create(null);

  for (let [key, value] of map) {
    dict[key] = value;
  }

  return dict;
}
