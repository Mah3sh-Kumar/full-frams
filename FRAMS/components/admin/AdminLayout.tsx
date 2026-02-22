import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminSidebar from './AdminSidebar';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenuItem: string;
  onMenuItemPress: (itemId: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeMenuItem,
  onMenuItemPress,
  onLogout,
  userName = 'Admin User',
  userEmail = 'admin@example.com'
}) => {
  const { tokens } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'home',
      route: 'AdminDashboard'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: 'people',
      route: 'UserManagement'
    },
    {
      id: 'organization',
      title: 'Organization',
      icon: 'business',
      route: 'OrganizationManager'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: 'bar-chart',
      route: 'ReportsScreen'
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      icon: 'list',
      route: 'AuditLogsScreen'
    },
    {
      id: 'verification',
      title: 'Verification',
      icon: 'checkmark-circle',
      route: 'VerificationDashboard'
    }
  ];

  const handleMenuItemPress = (item: any) => {
    onMenuItemPress(item.id);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={tokens.colors.neutral.gray900}
      />

      <View style={styles.layout}>
        <AdminSidebar
          menuItems={menuItems}
          activeItem={activeMenuItem}
          onItemPress={handleMenuItemPress}
          onLogout={onLogout}
          userName={userName}
          userEmail={userEmail}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <View style={[
          styles.content,
          {
            backgroundColor: tokens.colors.theme.light.background,
            marginLeft: sidebarCollapsed ? 80 : 280
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