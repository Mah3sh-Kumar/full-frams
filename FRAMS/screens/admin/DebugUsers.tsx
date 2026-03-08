import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Button from '../../components/design-system/primitives/Button';
import AdminLayout from '../../components/admin/AdminLayout';
import { debugUserTables, fixOrphanedUsers } from '../../lib/debugUsers';

export default function DebugUsers() {
  const { tokens, getTextColor, getSurfaceColor, getBackgroundColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const handleDebug = async () => {
    setLoading(true);
    setOutput([]);

    // Capture console.log output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalLog(...args);
    };

    try {
      await debugUserTables();
      setOutput(logs);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      console.log = originalLog;
      setLoading(false);
    }
  };

  const handleFix = async () => {
    Alert.alert(
      'Fix Orphaned Users',
      'This will create missing teacher/student profiles for users. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fix',
          onPress: async () => {
            setLoading(true);
            setOutput([]);

            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (...args: any[]) => {
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              logs.push(message);
              originalLog(...args);
            };

            try {
              await fixOrphanedUsers();
              setOutput(logs);
              Alert.alert('Success', 'Orphaned users have been fixed');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              console.log = originalLog;
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <AdminLayout title="Debug Users">
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={handleDebug}
            loading={loading}
            disabled={loading}
          >
            Check User Tables
          </Button>
          <Button
            variant="secondary"
            onPress={handleFix}
            loading={loading}
            disabled={loading}
            style={styles.fixButton}
          >
            Fix Orphaned Users
          </Button>
        </View>

        {output.length > 0 && (
          <ScrollView style={[styles.output, { backgroundColor: getSurfaceColor() }]}>
            {output.map((line, index) => (
              <Text key={index} style={[styles.outputText, { color: getTextColor() }]}>
                {line}
              </Text>
            ))}
          </ScrollView>
        )}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  fixButton: {
    marginTop: 12,
  },
  output: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
  },
  outputText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
