import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

// Simple inline tab icons using View shapes

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#8B6F47',
        tabBarInactiveTintColor: '#C4B5A5',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { borderColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIconHeart, { borderColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIconFavorite, { borderColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIconCircle, { borderColor: color }]} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopColor: '#E0D8D0',
    paddingTop: 8,
    height: 80,
  },
  tabLabel: { fontSize: 11, fontWeight: '500', marginBottom: 8 },
  tabIcon: { width: 22, height: 22, borderRadius: 4, borderWidth: 2 },
  tabIconHeart: { width: 20, height: 18, borderRadius: 2, borderWidth: 2 },
  tabIconFavorite: { width: 20, height: 18, borderRadius: 10, borderWidth: 2 },
  tabIconCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
});
