export namespace SelectionListPopup {
  export interface ListItem<T> {
    text: string;
    value: T | undefined;
    selected?: boolean;
  }
}
