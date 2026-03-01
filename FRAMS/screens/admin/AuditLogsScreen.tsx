import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, StatusBar, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { getAuditLogs, AuditLogItem } from '../../lib/audit';

export default function AuditLogsScreen() {
  const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor } = useTheme();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await getAuditLogs();
    if (data) setLogs(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const { data } = await getAuditLogs();
    if (data) setLogs(data);
    setRefreshing(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return tokens.colors.error.main;
    if (action.includes('CREATE') || action.includes('INSERT')) return tokens.colors.success.main;
    if (action.includes('UPDATE')) return tokens.colors.warning.main;
    return tokens.colors.info.main;
  };

  const renderLogItem = ({ item }: { item: AuditLogItem }) => (
    <TouchableOpacity
      style={[styles.logCard, { backgroundColor: getSurfaceColor() }]}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.logHeader}>
        <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(item.action)}20` }]}>
          <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>{item.action}</Text>
        </View>
        <Text style={[styles.logTime, { color: getTextSecondaryColor() }]}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>

      <Text style={[styles.logActor, { color: getTextColor() }]}>
        <Text style={{ fontWeight: 'bold' }}>{item.actor_name}</Text> performed action on {item.target_table || 'system'}
      </Text>

      <View style={styles.logFooter}>
        <Ionicons name="calendar-outline" size={14} color={getTextSecondaryColor()} />
        <Text style={[styles.footerText, { color: getTextSecondaryColor() }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.ip_address && (
          <>
            <View style={[styles.dot, { backgroundColor: getTextSecondaryColor() }]} />
            <Ionicons name="globe-outline" size={14} color={getTextSecondaryColor()} />
            <Text style={[styles.footerText, { color: getTextSecondaryColor() }]}>{item.ip_address}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.roles.admin.main} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.roles.admin.main }]}>
        <Text style={styles.headerTitle}>Audit Logs</Text>
        <Text style={styles.headerSubtitle}>System activity monitoring</Text>
      </View>

      {loading ? (
        <View style={{ marginTop: 50 }}>
          <LoadingSpinner size="large" />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-list-outline"
              title="No logs found"
              message="System activities will appear here once they occur."
            />
          }
        />
      )}

      <Modal visible={!!selectedLog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getSurfaceColor() }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: getTextColor() }]}>Log Details</Text>
              <TouchableOpacity onPress={() => setSelectedLog(null)}>
                <Ionicons name="close" size={24} color={getTextSecondaryColor()} />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <View style={styles.detailsContainer}>
                <DetailRow label="Action" value={selectedLog.action} valueColor={getActionColor(selectedLog.action)} />
                <DetailRow label="Actor" value={selectedLog.actor_name || 'System'} />
                <DetailRow label="Table" value={selectedLog.target_table || 'N/A'} />
                <DetailRow label="Target ID" value={selectedLog.target_id || 'N/A'} />
                <DetailRow label="Time" value={new Date(selectedLog.created_at).toLocaleString()} />
                <DetailRow label="IP Address" value={selectedLog.ip_address || 'N/A'} />

                <Text style={[styles.detailsLabel, { color: getTextSecondaryColor(), marginTop: 16 }]}>Details (JSON):</Text>
                <View style={[styles.jsonContainer, { backgroundColor: getBackgroundColor() }]}>
                  <Text style={[styles.jsonText, { color: getTextColor() }]}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { getTextColor, getTextSecondaryColor } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailsLabel, { color: getTextSecondaryColor() }]}>{label}:</Text>
      <Text style={[styles.detailsValue, { color: valueColor || getTextColor() }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 26,
    paddingBottom: 33,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 22,
  },
  list: { padding: 20 },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  actionText: { fontSize: 10, fontWeight: 'bold' },
  logTime: { fontSize: 12 },
  logActor: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  logFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  detailsContainer: { gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsLabel: { fontSize: 14, fontWeight: '500' },
  detailsValue: { fontSize: 14 },
  jsonContainer: { marginTop: 8, padding: 12, borderRadius: 8, maxHeight: 200 },
  jsonText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
