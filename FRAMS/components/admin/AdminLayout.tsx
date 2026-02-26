import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenuItem: string;
  onMenuItemPress: (itemId: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  statusBarColor?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  statusBarColor,
}) => {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: statusBarColor || tokens.colors.roles.admin.main }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={statusBarColor || tokens.colors.roles.admin.main}
        translucent={true}
      />

      <View style={styles.layout}>
        <View style={[
          styles.content,
          {
            backgroundColor: tokens.colors.theme.light.background,
          }
        ]}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});

export default AdminLayout;