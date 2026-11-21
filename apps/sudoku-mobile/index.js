// App entry point. registerRootComponent wires App into the native shell
// (AppRegistry) and sets up the environment for both Expo Go and native
// builds. Replaces "main": "node_modules/expo/AppEntry.js", which assumes
// expo is installed in this app folder; in the npm-workspaces monorepo it
// is hoisted to the repo root, so that path no longer resolves.
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
