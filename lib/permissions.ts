import * as FileSystem from 'expo-file-system';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Audio permissions handled separately

const PERMISSIONS_KEY = '@ai_assistant_permissions';

export enum PermissionType {
  CAMERA = 'camera',
  MICROPHONE = 'microphone',
  MEDIA_LIBRARY = 'media_library',
  CONTACTS = 'contacts',
  LOCATION = 'location',
  CALENDAR = 'calendar',
  FILE_SYSTEM = 'file_system',
}

export interface Permission {
  type: PermissionType;
  name: string;
  description: string;
  icon: string;
  granted: boolean;
  systemGranted: boolean;
}

export interface PermissionUsageLog {
  type: PermissionType;
  action: string;
  timestamp: number;
  details?: string;
}

const PERMISSION_DEFINITIONS: Omit<Permission, 'granted' | 'systemGranted'>[] = [
  {
    type: PermissionType.CAMERA,
    name: 'Camera',
    description: 'Allow AI to take photos and scan documents',
    icon: 'camera',
  },
  {
    type: PermissionType.MICROPHONE,
    name: 'Microphone',
    description: 'Allow AI to record audio and transcribe speech',
    icon: 'mic',
  },
  {
    type: PermissionType.MEDIA_LIBRARY,
    name: 'Photo Library',
    description: 'Allow AI to access and analyze your photos',
    icon: 'photo-library',
  },
  {
    type: PermissionType.CONTACTS,
    name: 'Contacts',
    description: 'Allow AI to read and search your contacts',
    icon: 'contacts',
  },
  {
    type: PermissionType.LOCATION,
    name: 'Location',
    description: 'Allow AI to access your current location',
    icon: 'location-on',
  },
  {
    type: PermissionType.CALENDAR,
    name: 'Calendar',
    description: 'Allow AI to read and manage calendar events',
    icon: 'event',
  },
  {
    type: PermissionType.FILE_SYSTEM,
    name: 'File System',
    description: 'Allow AI to read, write, and manage files',
    icon: 'folder',
  },
];

export class PermissionService {
  private static instance: PermissionService;
  private usageLogs: PermissionUsageLog[] = [];

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const userPermissions = await this.getUserPermissions();
    const systemPermissions = await this.checkSystemPermissions();

    return PERMISSION_DEFINITIONS.map(def => ({
      ...def,
      granted: userPermissions[def.type] || false,
      systemGranted: systemPermissions[def.type] || false,
    }));
  }

  private async getUserPermissions(): Promise<Record<PermissionType, boolean>> {
    try {
      const data = await AsyncStorage.getItem(PERMISSIONS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
    
    // Default: all permissions denied
    return Object.values(PermissionType).reduce((acc, type) => {
      acc[type] = false;
      return acc;
    }, {} as Record<PermissionType, boolean>);
  }

  private async checkSystemPermissions(): Promise<Record<PermissionType, boolean>> {
    const permissions: Record<PermissionType, boolean> = {
      [PermissionType.CAMERA]: false,
      [PermissionType.MICROPHONE]: false,
      [PermissionType.MEDIA_LIBRARY]: false,
      [PermissionType.CONTACTS]: false,
      [PermissionType.LOCATION]: false,
      [PermissionType.CALENDAR]: false,
      [PermissionType.FILE_SYSTEM]: true, // Always available
    };

    try {
      const cameraStatus = await Camera.Camera.getCameraPermissionsAsync();
      permissions[PermissionType.CAMERA] = cameraStatus.status === 'granted';

      // Microphone permission check - requires runtime handling
      permissions[PermissionType.MICROPHONE] = false;

      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      permissions[PermissionType.MEDIA_LIBRARY] = mediaStatus.granted;

      const contactsStatus = await Contacts.getPermissionsAsync();
      permissions[PermissionType.CONTACTS] = contactsStatus.granted;

      const locationStatus = await Location.getForegroundPermissionsAsync();
      permissions[PermissionType.LOCATION] = locationStatus.granted;

      const calendarStatus = await Calendar.getCalendarPermissionsAsync();
      permissions[PermissionType.CALENDAR] = calendarStatus.granted;
    } catch (error) {
      console.error('Error checking system permissions:', error);
    }

    return permissions;
  }

  async setPermission(type: PermissionType, granted: boolean): Promise<void> {
    const permissions = await this.getUserPermissions();
    permissions[type] = granted;
    await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  async requestSystemPermission(type: PermissionType): Promise<boolean> {
    try {
      switch (type) {
        case PermissionType.CAMERA:
          const cameraResult = await Camera.Camera.requestCameraPermissionsAsync();
          return cameraResult.status === 'granted';

        case PermissionType.MICROPHONE:
          // Microphone permission - handled at runtime when recording
          return true;

        case PermissionType.MEDIA_LIBRARY:
          const mediaResult = await MediaLibrary.requestPermissionsAsync();
          return mediaResult.granted;

        case PermissionType.CONTACTS:
          const contactsResult = await Contacts.requestPermissionsAsync();
          return contactsResult.granted;

        case PermissionType.LOCATION:
          const locationResult = await Location.requestForegroundPermissionsAsync();
          return locationResult.granted;

        case PermissionType.CALENDAR:
          const calendarResult = await Calendar.requestCalendarPermissionsAsync();
          return calendarResult.granted;

        case PermissionType.FILE_SYSTEM:
          return true; // Always available

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  }

  async checkPermission(type: PermissionType): Promise<boolean> {
    const userPermissions = await this.getUserPermissions();
    const systemPermissions = await this.checkSystemPermissions();
    return userPermissions[type] && systemPermissions[type];
  }

  async logUsage(type: PermissionType, action: string, details?: string): Promise<void> {
    const log: PermissionUsageLog = {
      type,
      action,
      timestamp: Date.now(),
      details,
    };
    this.usageLogs.push(log);
    
    // Keep only last 100 logs
    if (this.usageLogs.length > 100) {
      this.usageLogs = this.usageLogs.slice(-100);
    }
  }

  getUsageLogs(): PermissionUsageLog[] {
    return [...this.usageLogs];
  }

  async clearUsageLogs(): Promise<void> {
    this.usageLogs = [];
  }
}

export const permissionService = PermissionService.getInstance();
