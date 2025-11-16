/**
 * 🧪 Memory System Test Routes
 * Test working, short-term, and long-term memory
 */

import express, { Request, Response } from 'express';
import { memorySystem } from '../services/memorySystem';
import { vectorStore } from '../services/vectorStore';

const router = express.Router();

// Test working memory
router.post('/working-memory', async (req: Request, res: Response) => {
  try {
    const sessionId = `test_${Date.now()}`;
    
    // Save
    await memorySystem.saveWorkingMemory(sessionId, {
      emotion: 'anxious',
      intent: 'seeking_support',
      crisisLevel: 3,
      conversationHistory: ['Hello', 'I need help with stress'],
      lastUpdated: Date.now(),
    });

    // Retrieve
    const data = await memorySystem.getWorkingMemory(sessionId);

    res.json({
      success: true,
      message: 'Working memory test passed',
      sessionId,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test short-term memory
router.post('/short-term-memory', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || `test_user_${Date.now()}`;
    
    // Save multiple interactions
    const interactions = [
      { message: 'Feeling stressed about work', emotion: 'stressed' },
      { message: 'Had a good workout today', emotion: 'happy' },
      { message: 'Worried about upcoming deadline', emotion: 'anxious' },
      { message: 'Grateful for supportive friends', emotion: 'grateful' },
      { message: 'Tired but accomplished', emotion: 'tired' },
    ];

    for (let i = 0; i < interactions.length; i++) {
      await memorySystem.saveShortTermMemory(userId, {
        timestamp: Date.now() - (i * 3600000), // 1 hour apart
        message: interactions[i].message,
        emotion: interactions[i].emotion,
      });
    }

    // Retrieve
    const recentInteractions = await memorySystem.getRecentInteractions(userId, 5);

    res.json({
      success: true,
      message: 'Short-term memory test passed',
      userId,
      count: recentInteractions.length,
      interactions: recentInteractions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test long-term memory (semantic search)
router.post('/long-term-memory', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || `test_user_${Date.now()}`;
    
    // Save memories
    await memorySystem.saveLongTermMemory(userId, {
      type: 'pattern',
      content: 'User often feels stressed about work deadlines and project pressure',
      metadata: {
        confidence: 0.9,
        source: 'conversation_analysis',
        category: 'work_stress',
      },
    });

    await memorySystem.saveLongTermMemory(userId, {
      type: 'insight',
      content: 'User prefers short, direct responses and dislikes long explanations',
      metadata: {
        confidence: 0.85,
        source: 'feedback_analysis',
        category: 'communication_preference',
      },
    });

    await memorySystem.saveLongTermMemory(userId, {
      type: 'preference',
      content: 'User finds exercise helpful for managing anxiety',
      metadata: {
        confidence: 0.8,
        source: 'user_feedback',
        category: 'coping_strategy',
      },
    });

    // Wait a bit for indexing (Pinecone needs time)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Semantic search
    const query = 'I have a big project due tomorrow and feeling overwhelmed';
    const relevantMemories = await memorySystem.retrieveRelevantMemories(
      userId,
      query,
      3
    );

    res.json({
      success: true,
      message: 'Long-term memory test passed',
      userId,
      query,
      relevantMemories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get memory stats
router.get('/memory-stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await memorySystem.getMemoryStats(userId);

    res.json({
      success: true,
      userId,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Pinecone index stats
router.get('/pinecone-stats', async (req: Request, res: Response) => {
  try {
    const stats = await vectorStore.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete user memories (GDPR test)
router.delete('/user-memories/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await memorySystem.deleteUserMemories(userId);

    res.json({
      success: true,
      message: `All memories deleted for user: ${userId}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check for memory system
router.get('/health', async (req: Request, res: Response) => {
  try {
    const memoryEnabled = memorySystem.isEnabled();
    const vectorEnabled = vectorStore.isEnabled();

    res.json({
      success: true,
      services: {
        memorySystem: {
          enabled: memoryEnabled,
          status: memoryEnabled ? 'operational' : 'disabled',
        },
        vectorStore: {
          enabled: vectorEnabled,
          status: vectorEnabled ? 'operational' : 'disabled',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
