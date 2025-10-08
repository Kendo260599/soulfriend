/**
 * Research Data Routes
 * API endpoints cho việc lưu và truy xuất dữ liệu nghiên cứu
 */

import express, { Request, Response } from 'express';
import { ResearchData, IResearchData } from '../models/ResearchData';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/research
 * Lưu dữ liệu research mới
 * Public route - không cần authentication
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { participantId, testResults, sessionData, qualityMetrics, metadata } = req.body;

    // Validation
    if (!testResults || !Array.isArray(testResults) || testResults.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test results are required and must be a non-empty array',
      });
    }

    // Auto-generate participantId if not provided
    const finalParticipantId = participantId || `P${Date.now()}`;

    // Create research data
    const researchData = new ResearchData({
      participantId: finalParticipantId,
      timestamp: new Date(),
      testResults,
      sessionData: sessionData || {
        sessionId: `session_${Date.now()}`,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
      },
      qualityMetrics: qualityMetrics || {
        completeness: 1.0,
        validity: 1.0,
        reliability: 1.0,
        responseTime: 0,
      },
      metadata: metadata || {
        version: '3.0',
        platform: 'web',
        locale: 'vi',
      },
    });

    await researchData.save();

    res.status(201).json({
      success: true,
      message: 'Research data saved successfully',
      data: {
        id: researchData._id,
        participantId: researchData.participantId,
        timestamp: researchData.timestamp,
        testCount: researchData.testResults.length,
      },
    });
  } catch (error) {
    console.error('Error saving research data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save research data',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/research
 * Lấy tất cả dữ liệu research (Admin only)
 */
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, testType, limit = 100, skip = 0 } = req.query;

    // Build query
    const query: any = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    if (testType) {
      query['testResults.testType'] = testType;
    }

    // Execute query với pagination
    const data = await ResearchData.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(_limit))
      .skip(Number(skip))
      .lean();

    const total = await ResearchData.countDocuments(query);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: Number(_limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + data.length,
      },
    });
  } catch (error) {
    console.error('Error fetching research data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch research data',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/research/stats
 * Lấy thống kê tổng quan (Admin only)
 */
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await (ResearchData as any).getStatistics();

    // Thêm breakdown by test type
    const testTypeStats = await ResearchData.aggregate([
      { $unwind: '$testResults' },
      {
        $group: {
          _id: '$testResults.testType',
          count: { $sum: 1 },
          avgScore: { $avg: '$testResults.score' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: {
        ...stats,
        testTypeBreakdown: testTypeStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/research/export
 * Export dữ liệu dạng CSV hoặc JSON (Admin only)
 */
router.get('/export', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    const data = await ResearchData.find(query).lean();

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID',
        'Participant ID',
        'Timestamp',
        'Test Type',
        'Score',
        'Severity',
        'Completion Time',
        'Quality',
      ];

      const rows = data.flatMap((d: any) =>
        d.testResults.map((t: any) => [
          d._id,
          d.participantId,
          d.timestamp,
          t.testType,
          t.score,
          t.severity || 'N/A',
          t.completionTime || 0,
          d.qualityMetrics.completeness,
        ])
      );

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="research_data_${Date.now()}.csv"`
      );
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="research_data_${Date.now()}.json"`
      );
      res.json({
        success: true,
        exportDate: new Date(),
        totalRecords: data.length,
        data,
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/research/:id
 * Lấy chi tiết một research record (Admin only)
 */
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await ResearchData.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Research data not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching research data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch research data',
      details: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/research/:id
 * Xóa một research record (Admin only)
 */
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await ResearchData.findByIdAndDelete(id);

    if (!_result) {
      return res.status(404).json({
        success: false,
        error: 'Research data not found',
      });
    }

    res.json({
      success: true,
      message: 'Research data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting research data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete research data',
      details: (error as Error).message,
    });
  }
});

export default router;
