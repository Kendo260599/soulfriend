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

    // Timeouts (increased for stability)
    serverSelectionTimeoutMS: 30000, // 30 seconds instead of 5
    socketTimeoutMS: 60000, // 60 seconds instead of 45
    connectTimeoutMS: 30000,

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

    // Check if database is disabled
    if (process.env.DISABLE_DATABASE === 'true') {
      console.log('🔄 Database disabled - running in mock mode');
      this.isConnected = false; // Mark as not connected but don't throw error
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
        console.log('⚠️  MongoDB disconnected unexpectedly');
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected unexpectedly');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
        this.isConnected = true;
      });

      // ❌ REMOVED: Graceful shutdown handler moved to simple-server.ts to avoid duplicate
      // This prevents multiple SIGINT handlers from closing the connection twice

      await mongoose.connect(config.uri, config.options);

      // Enable mongoose debugging in development
      if (process.env.NODE_ENV === 'development') {
        mongoose.set('debug', true);
      }
    } catch (error) {
      console.error('⚠️  MongoDB connection failed:', (error as Error).message);
      console.log('🔄 Running in fallback mode without database');
      this.isConnected = false; // Don't throw error, just mark as not connected
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected && mongoose.connection.readyState === 0) {
      console.log('ℹ️  MongoDB already disconnected');
      return;
    }

    try {
      // Force close all connections in the pool
      await mongoose.connection.close(true); // true = force close
      console.log('👋 MongoDB connection closed gracefully');
      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      // Don't throw - just log the error during shutdown
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
