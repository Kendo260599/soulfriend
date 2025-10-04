// MongoDB initialization script for SoulFriend V3.0

// Switch to the soulfriend database
db = db.getSiblingDB('soulfriend');

// Create collections with validation
db.createCollection('admins', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'fullName', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be a string between 3-30 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        fullName: {
          bsonType: 'string',
          maxLength: 100,
          description: 'Full name must be a string up to 100 characters'
        },
        role: {
          enum: ['admin', 'super_admin'],
          description: 'Role must be either admin or super_admin'
        },
        isActive: {
          bsonType: 'bool',
          description: 'isActive must be a boolean'
        }
      }
    }
  }
});

db.createCollection('consents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['agreed', 'timestamp', 'ipAddress'],
      properties: {
        agreed: {
          bsonType: 'bool',
          description: 'Agreed must be a boolean'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp must be a date'
        },
        ipAddress: {
          bsonType: 'string',
          description: 'IP address must be a string'
        }
      }
    }
  }
});

db.createCollection('test_results', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['testType', 'answers', 'totalScore', 'evaluation', 'consentId', 'completedAt'],
      properties: {
        testType: {
          enum: ['DASS-21', 'GAD-7', 'PHQ-9', 'EPDS', 'SELF_COMPASSION', 'MINDFULNESS', 'SELF_CONFIDENCE', 'ROSENBERG_SELF_ESTEEM', 'PMS', 'MENOPAUSE_RATING'],
          description: 'Test type must be one of the allowed values'
        },
        answers: {
          bsonType: 'array',
          items: {
            bsonType: 'number',
            minimum: 0,
            maximum: 10
          },
          description: 'Answers must be an array of numbers between 0-10'
        },
        totalScore: {
          bsonType: 'number',
          minimum: 0,
          description: 'Total score must be a non-negative number'
        },
        evaluation: {
          bsonType: 'object',
          required: ['testType', 'totalScore', 'severity', 'interpretation', 'recommendations'],
          description: 'Evaluation must contain required fields'
        }
      }
    }
  }
});

// Create indexes for better performance
db.admins.createIndex({ username: 1 }, { unique: true });
db.admins.createIndex({ email: 1 }, { unique: true });
db.admins.createIndex({ isActive: 1 });

db.consents.createIndex({ timestamp: -1 });
db.consents.createIndex({ ipAddress: 1 });

db.test_results.createIndex({ completedAt: -1 });
db.test_results.createIndex({ testType: 1 });
db.test_results.createIndex({ consentId: 1 });
db.test_results.createIndex({ 'evaluation.severity': 1 });

// Create a default admin user (will be overridden by application setup)
print('MongoDB initialization completed for SoulFriend V3.0');
print('Collections created: admins, consents, test_results');
print('Indexes created for optimal performance');
print('Validation rules applied for data integrity');
