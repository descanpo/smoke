import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('smoke', () => App);
AppRegistry.runApplication('smoke', {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
