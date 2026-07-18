import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import HomeScreen from './src/screens/HomeScreen'
import RetrieveScreen from './src/screens/RetrieveScreen'
import ClipboardDetailScreen from './src/screens/ClipboardDetailScreen'

const Stack = createStackNavigator()

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: '900', fontSize: 16 },
            headerTintColor: '#111827',
            cardStyle: { backgroundColor: '#F8F8F6' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Retrieve" component={RetrieveScreen} options={{ title: 'Retrieve' }} />
          <Stack.Screen name="ClipboardDetail" component={ClipboardDetailScreen} options={({ route }) => ({ title: route.params?.code ?? 'Clipboard' })} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
