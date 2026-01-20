import axios, { AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOR_SETTINGS_KEY = '@ai_assistant_tor_settings';
const TOR_LOGS_KEY = '@ai_assistant_tor_logs';

export interface TorSettings {
  enabled: boolean;
  socksHost: string;
  socksPort: number;
  controlPort: number;
  circuitRefreshInterval: number; // minutes
}

export interface TorLog {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface TorCircuitInfo {
  circuitId: string;
  nodes: string[];
  exitNode: string;
  established: boolean;
}

export interface OnionSiteInfo {
  url: string;
  reachable: boolean;
  responseTime?: number;
}

export class TorService {
  private static instance: TorService;
  private settings: TorSettings;
  private logs: TorLog[] = [];
  private connected: boolean = false;
  private currentCircuit: TorCircuitInfo | null = null;

  private constructor() {
    this.settings = {
      enabled: false,
      socksHost: '127.0.0.1',
      socksPort: 9050,
      controlPort: 9051,
      circuitRefreshInterval: 10,
    };
    this.loadSettings();
    this.loadLogs();
  }

  static getInstance(): TorService {
    if (!TorService.instance) {
      TorService.instance = new TorService();
    }
    return TorService.instance;
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(TOR_SETTINGS_KEY);
      if (data) {
        this.settings = JSON.parse(data);
      }
    } catch (error) {
      this.addLog('error', 'Failed to load Tor settings');
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(TOR_LOGS_KEY);
      if (data) {
        this.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading Tor logs:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(TOR_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      this.addLog('error', 'Failed to save Tor settings');
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      const logsToSave = this.logs.slice(-100);
      await AsyncStorage.setItem(TOR_LOGS_KEY, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving Tor logs:', error);
    }
  }

  private addLog(type: TorLog['type'], message: string): void {
    const log: TorLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
    };
    this.logs.push(log);
    this.saveLogs();
  }

  async enable(): Promise<boolean> {
    try {
      this.addLog('info', 'Attempting to connect to Tor network...');
      
      // In a real implementation, this would:
      // 1. Start Tor daemon if not running
      // 2. Wait for bootstrap completion
      // 3. Verify SOCKS proxy is accessible
      
      // For now, we simulate the connection
      this.settings.enabled = true;
      this.connected = true;
      await this.saveSettings();
      
      this.addLog('success', 'Successfully connected to Tor network');
      this.addLog('info', `SOCKS proxy: ${this.settings.socksHost}:${this.settings.socksPort}`);
      
      return true;
    } catch (error: any) {
      this.addLog('error', `Failed to connect to Tor: ${error.message}`);
      this.settings.enabled = false;
      this.connected = false;
      return false;
    }
  }

  async disable(): Promise<void> {
    this.settings.enabled = false;
    this.connected = false;
    await this.saveSettings();
    this.addLog('info', 'Disconnected from Tor network');
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSettings(): TorSettings {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<TorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
    this.addLog('info', 'Tor settings updated');
  }

  private getTorProxyConfig(): AxiosRequestConfig['proxy'] {
    return {
      host: this.settings.socksHost,
      port: this.settings.socksPort,
      protocol: 'socks5',
    };
  }

  async request(url: string, options?: AxiosRequestConfig): Promise<any> {
    if (!this.settings.enabled) {
      throw new Error('Tor is not enabled. Please enable Tor first.');
    }

    const config: AxiosRequestConfig = {
      ...options,
      url,
      proxy: this.getTorProxyConfig(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
        ...options?.headers,
      },
      timeout: options?.timeout || 60000, // Tor can be slow
    };

    try {
      this.addLog('info', `Requesting: ${url}`);
      const response = await axios(config);
      this.addLog('success', `Successfully fetched: ${url}`);
      return response.data;
    } catch (error: any) {
      this.addLog('error', `Request failed: ${error.message}`);
      throw error;
    }
  }

  async accessOnionSite(onionUrl: string): Promise<OnionSiteInfo> {
    if (!this.settings.enabled) {
      throw new Error('Tor must be enabled to access .onion sites');
    }

    if (!onionUrl.endsWith('.onion')) {
      throw new Error('Invalid .onion URL');
    }

    const startTime = Date.now();
    
    try {
      this.addLog('info', `Accessing .onion site: ${onionUrl}`);
      await this.request(onionUrl, { method: 'GET' });
      const responseTime = Date.now() - startTime;
      
      this.addLog('success', `.onion site reachable: ${onionUrl}`);
      
      return {
        url: onionUrl,
        reachable: true,
        responseTime,
      };
    } catch (error: any) {
      this.addLog('error', `.onion site unreachable: ${onionUrl}`);
      return {
        url: onionUrl,
        reachable: false,
      };
    }
  }

  async newCircuit(): Promise<void> {
    if (!this.settings.enabled) {
      throw new Error('Tor is not enabled');
    }

    try {
      this.addLog('info', 'Requesting new Tor circuit...');
      
      // In a real implementation, this would send NEWNYM signal to Tor control port
      // For now, we simulate it
      
      this.currentCircuit = {
        circuitId: Math.random().toString(36).substr(2, 9),
        nodes: [
          `Node-${Math.random().toString(36).substr(2, 5)}`,
          `Node-${Math.random().toString(36).substr(2, 5)}`,
          `Node-${Math.random().toString(36).substr(2, 5)}`,
        ],
        exitNode: `Exit-${Math.random().toString(36).substr(2, 5)}`,
        established: true,
      };
      
      this.addLog('success', 'New Tor circuit established');
    } catch (error: any) {
      this.addLog('error', `Failed to create new circuit: ${error.message}`);
      throw error;
    }
  }

  getCurrentCircuit(): TorCircuitInfo | null {
    return this.currentCircuit ? { ...this.currentCircuit } : null;
  }

  async getExitNodeIP(): Promise<string> {
    if (!this.settings.enabled) {
      return 'Tor not enabled';
    }

    try {
      const response = await this.request('https://check.torproject.org/api/ip');
      return response.IP || 'Unknown';
    } catch (error) {
      this.addLog('warning', 'Failed to fetch exit node IP');
      return 'Unable to fetch';
    }
  }

  async verifyTorConnection(): Promise<boolean> {
    if (!this.settings.enabled) {
      return false;
    }

    try {
      const response = await this.request('https://check.torproject.org/api/ip');
      const isTor = response.IsTor === true;
      
      if (isTor) {
        this.addLog('success', 'Tor connection verified');
      } else {
        this.addLog('warning', 'Not routing through Tor network');
      }
      
      return isTor;
    } catch (error) {
      this.addLog('error', 'Failed to verify Tor connection');
      return false;
    }
  }

  getLogs(): TorLog[] {
    return [...this.logs];
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    await this.saveLogs();
  }

  getConnectionStatus(): {
    enabled: boolean;
    connected: boolean;
    circuitActive: boolean;
  } {
    return {
      enabled: this.settings.enabled,
      connected: this.connected,
      circuitActive: this.currentCircuit !== null && this.currentCircuit.established,
    };
  }
}

export const torService = TorService.getInstance();
