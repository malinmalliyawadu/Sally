import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="ic_menu_home" />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} drawable="ic_menu_mapmode" />
        <Label>Map</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: 'safari', selected: 'safari.fill' }} drawable="ic_menu_compass" />
        <Label>Explore</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="journal">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} drawable="ic_menu_agenda" />
        <Label>Journal</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
