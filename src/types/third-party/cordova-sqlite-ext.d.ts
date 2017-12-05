interface CordovaSqlitePluginStatic {
  openDatabase(options: any): Database;
}

interface Window {
  sqlitePlugin?: CordovaSqlitePluginStatic;
}
