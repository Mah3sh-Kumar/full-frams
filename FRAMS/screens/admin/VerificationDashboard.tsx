import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { verifyUser, verifyUsersBatch, deleteUser } from '../../lib/admin';
import Button from '../../components/design-system/primitives/Button';
import Checkbox from 'react-native-paper/src/components/Checkbox/Checkbox';
import { ActionButton } from '../../components/common/ActionButtons'; // Using internal if needed or Segmented for select

export default function VerificationDashboard() {
  const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor } = useTheme();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingUsers();
    setRefreshing(false);
  };

  const toggleSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedUserIds.length === 0) return;
    
    setProcessing(true);
    const { error } = await verifyUsersBatch(selectedUserIds);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', `Successfully verified ${selectedUserIds.length} users`);
      setSelectedUserIds([]);
      fetchPendingUsers();
    }
    setProcessing(false);
  };

  const handleApproveSingle = async (userId: string) => {
    setProcessing(true);
    const { error } = await verifyUser(userId);
    if (error) {
      Alert.alert('Error', error);
    } else {
      fetchPendingUsers();
    }
    setProcessing(false);
  };

  const handleDelete = async (userId: string) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to delete this registration request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject & Delete', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteUser(userId);
            if (error) Alert.alert('Error', error);
            else fetchPendingUsers();
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => {
    const isSelected = selectedUserIds.includes(item.id);
    return (
      <View style={[styles.userCard, { backgroundColor: getSurfaceColor() }]}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => toggleSelect(item.id)}
        >
          <View style={[
            styles.checkbox, 
            { borderColor: tokens.colors.primary.main },
            isSelected && { backgroundColor: tokens.colors.primary.main }
          ]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: getTextColor() }]}>{item.full_name || 'No Name'}</Text>
          <Text style={[styles.userEmail, { color: getTextSecondaryColor() }]}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(item.role)}20` }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleApproveSingle(item.id)} style={styles.actionButton}>
            <Ionicons name="checkmark-circle" size={28} color={tokens.colors.success.main} />
          </TouchableOpacity>
          <ActionButton
            type="delete"
            onPress={() => handleDelete(item.id)}
            accessibilityLabel={`Delete ${item.full_name}`}
            size={24}
          />
        </View>
      </View>
    );
  };

  const getRoleColor = (role: string) => {
    if (role === 'teacher') return tokens.colors.roles.teacher.main;
    return tokens.colors.roles.student.main;
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar barStyle="light-content" />
      
      {loading ? (
        <View style={{ marginTop: 50 }}>
          <LoadingSpinner size="large" />
        </View>
      ) : (
        <>
          <FlatList
            data={pendingUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <EmptyState
                icon="account-check-outline"
                title="No pending requests"
                message="All current user registrations have been processed."
              />
            }
          />
          
          {selectedUserIds.length > 0 && (
            <View style={[styles.batchActions, { backgroundColor: getSurfaceColor() }]}>
              <Text style={[styles.selectionText, { color: getTextColor() }]}>
                {selectedUserIds.length} users selected
              </Text>
              <Button 
                onPress={handleApproveSelected} 
                loading={processing}
                style={styles.batchButton}
              >
                Approve Selected
              </Button>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkboxContainer: { padding: 4, marginRight: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { padding: 4 },
  batchActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectionText: { fontSize: 14, fontWeight: '600' },
  batchButton: { minWidth: 150 },
});
