import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { widgetTaskHandler } from './src/widgets/PrayerWidgetTaskHandler';

// Register Android Home Screen Widget Task Handler
registerWidgetTaskHandler(widgetTaskHandler);

// Register Main Expo App Component
registerRootComponent(App);
