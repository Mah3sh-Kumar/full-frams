import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Helper function to export CSV data to a file and share it
 * Uses the new Expo FileSystem API (File class) instead of deprecated writeAsStringAsync
 * 
 * @param csvContent - The CSV content as a string
 * @param filename - The name of the file to create (e.g., 'users_export.csv')
 * @returns Promise that resolves when the file is shared
 */
export async function exportCSV(csvContent: string, filename: string): Promise<void> {
  try {
    // Ensure filename has .csv extension
    if (!filename.endsWith('.csv')) {
      filename += '.csv';
    }

    // Create a File instance in the document directory using the new API
    const file = new File(Paths.document, filename);
    
    // Write the CSV content to the file using the new write() method
    await file.write(csvContent);
    
    // Share the file using its URI
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export CSV',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw new Error('Failed to export CSV file');
  }
}
