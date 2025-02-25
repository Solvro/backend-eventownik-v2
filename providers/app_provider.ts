export default class AppProvider {
  async boot() {
    await import("../extenstions/participant_event_extension.js");
  }
}
