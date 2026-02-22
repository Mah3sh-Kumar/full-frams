import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: number;
}

interface AdminSidebarProps {
  menuItems: MenuItem[];
  activeItem: string;
  onItemPress: (item: MenuItem) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  menuItems,
  activeItem,
  onItemPress,
  onLogout,
  userName = 'Admin User',
  userEmail = 'admin@example.com',
  collapsed = false,
  onToggleCollapse
}) => {
  const { tokens, getTextColor, getTextSecondaryColor } = useTheme();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isItemActive = (item: MenuItem) => {
    return activeItem === item.id || 
           (item.children && item.children.some(child => child.id === activeItem));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = isItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              paddingLeft: 16 + (level * 20),
              backgroundColor: isActive ? `${tokens.colors.primary.main}15` : 'transparent',
              borderLeftWidth: isActive ? 3 : 0,
              borderLeftColor: tokens.colors.primary.main,
            }
          ]}
          onPress={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else if (item.route) {
              onItemPress(item);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <Ionicons 
              name={item.icon as any} 
              size={20} 
              color={isActive ? tokens.colors.primary.main : getTextSecondaryColor()}
            />
            
            {!collapsed && (
              <>
                <Text style={[
                  styles.itemText,
                  {
                    color: isActive ? tokens.colors.primary.main : getTextColor(),
                    fontWeight: isActive ? '600' : '400'
                  }
                ]}>
                  {item.title}
                </Text>
                
                {item.badge && item.badge > 0 && (
                  <View style={[
                    styles.badge,
                    { backgroundColor: tokens.colors.error.main }
                  ]}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
                
                {hasChildren && (
                  <Ionicons 
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                    size={16} 
                    color={getTextSecondaryColor()} 
                  />
                )}
              </>
            )}
          </View>
        </TouchableOpacity>

        {!collapsed && hasChildren && isExpanded && (
          <View style={styles.subMenu}>
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { 
        backgroundColor: tokens.colors.neutral.gray900,
        width: collapsed ? 80 : 280,
      }
    ]}>
      {/* Header */}
      {!collapsed && (
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[
              styles.logo,
              { backgroundColor: tokens.colors.primary.main }
            ]}>
              <Ionicons name="school" size={24} color={tokens.colors.primary.contrast} />
            </View>
            <View>
              <Text style={[styles.appName, { color: tokens.colors.neutral.white }]}>
                FRAMS Admin
              </Text>
              <Text style={[styles.version, { color: tokens.colors.neutral.gray400 }]}>
                v2.0
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.collapseButton}
            onPress={onToggleCollapse}
          >
            <Ionicons 
              name={collapsed ? 'menu' : 'menu-outline'} 
              size={24} 
              color={tokens.colors.neutral.gray400} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* User Profile */}
      {!collapsed && (
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: tokens.colors.neutral.white }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: tokens.colors.neutral.gray400 }]}>
              {userEmail}
            </Text>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map(item => renderMenuItem(item))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color={tokens.colors.neutral.gray400} 
          />
          {!collapsed && (
            <Text style={[styles.logoutText, { color: tokens.colors.neutral.gray400 }]}>
              Logout
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRightWidth: 1,
    borderRightColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
  },
  version: {
    fontSize: 12,
    fontWeight: '400',
  },
  collapseButton: {
    padding: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    paddingVertical: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  subMenu: {
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    marginLeft: 28,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default AdminSidebar;