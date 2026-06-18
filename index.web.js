import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('smoke', () => App);
AppRegistry.runApplication('smoke', {
  initialProps: {},
  // Expo's generated web HTML mounts on #root; the custom index.html uses
  // #app-root. Support whichever element is present.
  rootTag: document.getElementById('root') || document.getElementById('app-root'),
});
