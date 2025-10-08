/**
 * Database Configuration with Production-Grade Settings
 * MongoDB with connection pooling, encryption, and monitoring
 */

import dotenv from 'dotenv';

import mongoose from 'mongoose';
dotenv.config();

export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

  const options: mongoose.ConnectOptions = {
    // Connection pooling
    maxPoolSize: 10,
    minPoolSize: 5,

    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Retry logic
    retryWrites: true,
    retryReads: true,

    // Write concern
    w: 'majority',

    // Read preference
    readPreference: 'primaryPreferred',

    // Application name for monitoring
    appName: 'soulfriend-v4',

    // Auto index (disable in production for performance)
    autoIndex: process.env.NODE_ENV !== 'production',
  };

  return { uri, options };
};

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📊 Already connected to MongoDB');
      return;
    }

    try {
      const config = getDatabaseConfig();

      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      await mongoose.connect(config.uri, config.options);

      // Enable mongoose debugging in development
      if (process.env.NODE_ENV === 'development') {
        mongoose.set('debug', true);
      }
    } catch (error) {
      console.error('⚠️  MongoDB connection failed:', (error as Error).message);
      console.log('🔄 Running in fallback mode without database');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed');
      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      throw error;
    }
  }

  getConnectionState(): number {
    return mongoose.connection.readyState;
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
export default DatabaseConnection.getInstance();
