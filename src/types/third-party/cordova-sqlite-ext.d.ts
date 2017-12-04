interface Window {
  sqlitePlugin?: {
    openDatabase(options: any): Database;
  };
}
