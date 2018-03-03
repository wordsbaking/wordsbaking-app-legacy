export namespace SelectionListPopup {
  export interface ListItem<T> {
    text: string;
    comment?: string;
    value: T | undefined;
    selected?: boolean;
  }
}
