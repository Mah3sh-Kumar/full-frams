import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { Button, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../lib/design-system/ThemeContext';

interface ImagePickerComponentProps {
    currentImageUrl?: string;
    onImageSelected: (uri: string) => void;
    onImageUploaded?: (url: string) => void;
    size?: number;
}

export default function ImagePickerComponent({
    currentImageUrl,
    onImageSelected,
    onImageUploaded,
    size = 120,
}: ImagePickerComponentProps) {
    const { tokens, getSurfaceColor, getTextSecondaryColor, getBorderColor } = useTheme();
    const [uploading, setUploading] = useState(false);
    const [imageUri, setImageUri] = useState<string | undefined>(currentImageUrl);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
                return false;
            }

            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return false;
            }
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                {
                    text: 'Camera',
                    onPress: takePhoto,
                },
                {
                    text: 'Gallery',
                    onPress: selectFromGallery,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setImageUri(uri);
                onImageSelected(uri);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const selectFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setImageUri(uri);
                onImageSelected(uri);
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const styles = StyleSheet.create({
        container: {
            alignItems: 'center',
            marginVertical: tokens.spacing.md,
        },
        imageContainer: {
            position: 'relative',
            borderRadius: tokens.borders.radius.full,
            overflow: 'hidden',
        },
        image: {
            borderRadius: tokens.borders.radius.full,
        },
        placeholder: {
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.full,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: tokens.borders.width.medium,
            borderColor: getBorderColor(),
        },
        uploadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: tokens.borders.radius.full,
        },
        cameraButton: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            margin: 0,
        },
    });

    return (
        <View style={styles.container}>
            <View style={[styles.imageContainer, { width: size, height: size }]}>
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={[styles.image, { width: size, height: size }]}
                    />
                ) : (
                    <View style={[styles.placeholder, { width: size, height: size }]}>
                        <IconButton
                            icon="account"
                            size={size * 0.5}
                            iconColor={getTextSecondaryColor()}
                        />
                    </View>
                )}

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
                    </View>
                )}

                <IconButton
                    icon="camera"
                    mode="contained"
                    iconColor="white"
                    containerColor={tokens.colors.primary.main}
                    size={24}
                    style={styles.cameraButton}
                    onPress={pickImage}
                    disabled={uploading}
                />
            </View>
        </View>
    );
}
