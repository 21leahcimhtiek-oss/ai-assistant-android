import axios, { AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROXY_LIST_KEY = '@ai_assistant_proxy_list';
const SCRAPING_LOGS_KEY = '@ai_assistant_scraping_logs';

export interface ProxyConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks5';
  username?: string;
  password?: string;
  active: boolean;
}

export interface ScrapingLog {
  id: string;
  url: string;
  timestamp: number;
  success: boolean;
  proxyUsed?: string;
  responseTime: number;
  error?: string;
}

export interface ScrapingOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: any;
  useProxy?: boolean;
  useTor?: boolean;
  timeout?: number;
}

export class WebScraperService {
  private static instance: WebScraperService;
  private proxyList: ProxyConfig[] = [];
  private currentProxyIndex: number = 0;
  private scrapingLogs: ScrapingLog[] = [];
  private torEnabled: boolean = false;

  private constructor() {
    this.loadProxyList();
    this.loadScrapingLogs();
  }

  static getInstance(): WebScraperService {
    if (!WebScraperService.instance) {
      WebScraperService.instance = new WebScraperService();
    }
    return WebScraperService.instance;
  }

  private async loadProxyList(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(PROXY_LIST_KEY);
      if (data) {
        this.proxyList = JSON.parse(data);
      } else {
        // Default free proxy list (these are examples, real proxies should be added by user)
        this.proxyList = [
          {
            host: 'proxy1.example.com',
            port: 8080,
            protocol: 'http',
            active: false,
          },
          {
            host: 'proxy2.example.com',
            port: 3128,
            protocol: 'http',
            active: false,
          },
        ];
      }
    } catch (error) {
      console.error('Error loading proxy list:', error);
    }
  }

  private async loadScrapingLogs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SCRAPING_LOGS_KEY);
      if (data) {
        this.scrapingLogs = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading scraping logs:', error);
    }
  }

  private async saveProxyList(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROXY_LIST_KEY, JSON.stringify(this.proxyList));
    } catch (error) {
      console.error('Error saving proxy list:', error);
    }
  }

  private async saveScrapingLogs(): Promise<void> {
    try {
      // Keep only last 100 logs
      const logsToSave = this.scrapingLogs.slice(-100);
      await AsyncStorage.setItem(SCRAPING_LOGS_KEY, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving scraping logs:', error);
    }
  }

  private getNextProxy(): ProxyConfig | null {
    const activeProxies = this.proxyList.filter(p => p.active);
    if (activeProxies.length === 0) return null;

    const proxy = activeProxies[this.currentProxyIndex % activeProxies.length];
    this.currentProxyIndex++;
    return proxy;
  }

  private buildProxyConfig(proxy: ProxyConfig): AxiosRequestConfig['proxy'] {
    return {
      host: proxy.host,
      port: proxy.port,
      protocol: proxy.protocol,
      auth: proxy.username && proxy.password ? {
        username: proxy.username,
        password: proxy.password,
      } : undefined,
    };
  }

  async scrape(options: ScrapingOptions): Promise<any> {
    const startTime = Date.now();
    const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let proxyUsed: string | undefined;
    let config: AxiosRequestConfig = {
      method: options.method || 'GET',
      url: options.url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers,
      },
      timeout: options.timeout || 30000,
      data: options.data,
    };

    // Use Tor if enabled
    if (options.useTor && this.torEnabled) {
      config.proxy = {
        host: '127.0.0.1',
        port: 9050,
        protocol: 'socks5',
      };
      proxyUsed = 'Tor (127.0.0.1:9050)';
    }
    // Use rotating proxy if enabled
    else if (options.useProxy) {
      const proxy = this.getNextProxy();
      if (proxy) {
        config.proxy = this.buildProxyConfig(proxy);
        proxyUsed = `${proxy.host}:${proxy.port}`;
      }
    }

    try {
      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      const log: ScrapingLog = {
        id: logId,
        url: options.url,
        timestamp: Date.now(),
        success: true,
        proxyUsed,
        responseTime,
      };

      this.scrapingLogs.push(log);
      await this.saveScrapingLogs();

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      const log: ScrapingLog = {
        id: logId,
        url: options.url,
        timestamp: Date.now(),
        success: false,
        proxyUsed,
        responseTime,
        error: errorMessage,
      };

      this.scrapingLogs.push(log);
      await this.saveScrapingLogs();

      throw new Error(`Scraping failed: ${errorMessage}`);
    }
  }

  async addProxy(proxy: ProxyConfig): Promise<void> {
    this.proxyList.push(proxy);
    await this.saveProxyList();
  }

  async removeProxy(index: number): Promise<void> {
    this.proxyList.splice(index, 1);
    await this.saveProxyList();
  }

  async toggleProxy(index: number): Promise<void> {
    if (this.proxyList[index]) {
      this.proxyList[index].active = !this.proxyList[index].active;
      await this.saveProxyList();
    }
  }

  getProxyList(): ProxyConfig[] {
    return [...this.proxyList];
  }

  getScrapingLogs(): ScrapingLog[] {
    return [...this.scrapingLogs];
  }

  async clearScrapingLogs(): Promise<void> {
    this.scrapingLogs = [];
    await this.saveScrapingLogs();
  }

  setTorEnabled(enabled: boolean): void {
    this.torEnabled = enabled;
  }

  isTorEnabled(): boolean {
    return this.torEnabled;
  }

  async getCurrentIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        timeout: 5000,
      });
      return response.data.ip;
    } catch (error) {
      return 'Unable to fetch IP';
    }
  }

  async getProxyIP(): Promise<string> {
    const proxy = this.getNextProxy();
    if (!proxy) return 'No proxy configured';

    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: this.buildProxyConfig(proxy),
        timeout: 5000,
      });
      return response.data.ip;
    } catch (error) {
      return 'Unable to fetch proxy IP';
    }
  }
}

export const webScraper = WebScraperService.getInstance();
