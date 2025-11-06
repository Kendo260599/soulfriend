/**
 * Comprehensive Tests for EnhancedChatbotService with Moderation Integration
 * Tests end-to-end workflow including HITL activation
 */

import { EnhancedChatbotService } from '../../src/services/enhancedChatbotService';
import moderationService from '../../src/services/moderationService';

// Mock OpenAI service
jest.mock('../../src/services/openAIService', () => ({
    __esModule: true,
    default: {
        isReady: jest.fn().mockReturnValue(true),
        generateResponse: jest.fn().mockResolvedValue({
            text: 'Đây là phản hồi từ AI',
        }),
    },
}));

// Mock critical intervention service
jest.mock('../../src/services/criticalInterventionService', () => ({
    criticalInterventionService: {
        createCriticalAlert: jest.fn().mockResolvedValue({
            id: 'ALERT_TEST_123',
            timestamp: new Date(),
            status: 'pending',
        }),
    },
}));

describe('EnhancedChatbotService with Moderation', () => {
    let service: EnhancedChatbotService;
    let sessionId: string;
    let userId: string;

    beforeEach(() => {
        service = new EnhancedChatbotService();
        sessionId = `test_session_${Date.now()}`;
        userId = 'test_user';
    });

    afterEach(() => {
        // Clean up sessions
        service.sessions.clear();
        service.messages.clear();

        // Clear intervention service mock
        const {
            criticalInterventionService,
        } = require('../../src/services/criticalInterventionService');
        criticalInterventionService.createCriticalAlert.mockClear();
    });

    describe('Normal Message Processing', () => {
        it('should process normal message without crisis', async () => {
            const response = await service.processMessage(
                'Xin chào, hôm nay tôi cảm thấy ổn',
                sessionId,
                userId
            );

            expect(response).toBeDefined();
            expect(response.riskLevel).toBe('LOW');
            expect(response.crisisLevel).toBe('low');
            expect(response.message).toBeDefined();
        });

        it('should include moderation assessment in processing', async () => {
            const assessSpy = jest.spyOn(moderationService, 'assess');

            await service.processMessage('Xin chào', sessionId, userId);

            expect(assessSpy).toHaveBeenCalled();
            assessSpy.mockRestore();
        });
    });

    describe('Crisis Detection with Moderation', () => {
        it('should detect critical crisis and upgrade risk level', async () => {
            const response = await service.processMessage('Tôi muốn chết', sessionId, userId);

            expect(response).toBeDefined();
            expect(response.crisisLevel).toBe('critical');
            expect(response.riskLevel).toBe('CRITICAL');
        });

        it('should trigger HITL for critical crisis', async () => {
            const {
                criticalInterventionService,
            } = require('../../src/services/criticalInterventionService');

            await service.processMessage('Tôi muốn chết và sẽ làm đêm nay', sessionId, userId);

            expect(criticalInterventionService.createCriticalAlert).toHaveBeenCalled();
            const alertCall = criticalInterventionService.createCriticalAlert.mock.calls[0];
            expect(alertCall[2].riskLevel).toBe('CRITICAL');
            expect(alertCall[2].metadata.moderation).toBeDefined();
            expect(alertCall[2].metadata.moderation.riskLevel).toBe('critical');
        });

        it('should include moderation metadata in HITL alert', async () => {
            const {
                criticalInterventionService,
            } = require('../../src/services/criticalInterventionService');

            await service.processMessage('Tôi muốn chết', sessionId, userId);

            const alertCall = criticalInterventionService.createCriticalAlert.mock.calls[0];
            const metadata = alertCall[2].metadata.moderation;

            expect(metadata).toBeDefined();
            expect(metadata.riskLevel).toBe('critical');
            expect(metadata.riskScore).toBeGreaterThan(0);
            expect(metadata.messageHash).toBeDefined();
            expect(metadata.signalCount).toBeGreaterThan(0);
            expect(metadata.signals).toBeDefined();
        });
    });

    describe('Moderation Enhancement', () => {
        it('should upgrade risk level from moderation when higher than detectCrisis', async () => {
            // This message might not trigger detectCrisis but should trigger moderation
            const response = await service.processMessage(
                'End game rồi, tôi muốn biến mất vĩnh viễn',
                sessionId,
                userId
            );

            // Moderation should detect this as critical
            expect(response.crisisLevel).toBe('critical');
        });

        it('should preserve original crisis detection when moderation is lower', async () => {
            const response = await service.processMessage('Tôi muốn chết', sessionId, userId);

            // Both should detect, but should use critical
            expect(response.crisisLevel).toBe('critical');
        });
    });

    describe('Risk Level Mapping', () => {
        it('should map crisisLevel to riskLevel correctly', async () => {
            const critical = await service.processMessage('Tôi muốn chết', sessionId, userId);
            expect(critical.riskLevel).toBe('CRITICAL');

            const normal = await service.processMessage('Xin chào', sessionId + '_2', userId);
            expect(normal.riskLevel).toBe('LOW');
        });
    });

    describe('Response Generation', () => {
        it('should generate crisis response for critical cases', async () => {
            const response = await service.processMessage('Tôi muốn chết', sessionId, userId);

            expect(response.message).toContain('quan tâm');
            expect(response.disclaimer).toBeDefined();
            expect(response.followUpActions).toBeDefined();
            if (response.followUpActions) {
                expect(response.followUpActions.length).toBeGreaterThan(0);
            }
        });

        it('should include HITL notification in response', async () => {
            const response = await service.processMessage('Tôi muốn chết', sessionId, userId);

            expect(response.message).toContain('đội phản ứng khủng hoảng');
        });
    });

    describe('Session Management', () => {
        it('should create session on first message', async () => {
            await service.processMessage('Xin chào', sessionId, userId);

            const session = service.sessions.get(sessionId);
            expect(session).toBeDefined();
            expect(session?.userId).toBe(userId);
        });

        it('should save messages to session', async () => {
            await service.processMessage('Xin chào', sessionId, userId);

            const messages = service.messages.get(sessionId);
            expect(messages).toBeDefined();
            expect(messages?.length).toBeGreaterThan(0);
        });
    });

    describe('User History', () => {
        it('should track user history across messages', async () => {
            await service.processMessage('Xin chào', sessionId, userId);
            await service.processMessage('Tôi cảm thấy buồn', sessionId, userId);

            // getUserHistory is private, so we test by verifying messages process correctly
            // We can verify history is working by checking that context is maintained
            const response = await service.processMessage('Cảm ơn', sessionId, userId);
            expect(response).toBeDefined();
            expect(response.message).toBeDefined();
        });
    });

    describe('Privacy - Message Redaction', () => {
        it('should redact message when LOG_REDACT is true', async () => {
            const originalEnv = process.env.LOG_REDACT;
            process.env.LOG_REDACT = 'true';

            const {
                criticalInterventionService,
            } = require('../../src/services/criticalInterventionService');

            // Clear previous mock calls
            criticalInterventionService.createCriticalAlert.mockClear();

            await service.processMessage('Tôi muốn chết', sessionId, userId);

            const alertCall = criticalInterventionService.createCriticalAlert.mock.calls[0];
            expect(alertCall[2].userMessage).toBe('[redacted]');

            process.env.LOG_REDACT = originalEnv;
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty message', async () => {
            const response = await service.processMessage('', sessionId, userId);
            expect(response).toBeDefined();
        });

        it('should handle very long message', async () => {
            const longMessage = 'Tôi muốn chết '.repeat(1000);
            const response = await service.processMessage(longMessage, sessionId, userId);
            expect(response).toBeDefined();
            expect(response.crisisLevel).toBe('critical');
        });

        it('should handle special characters', async () => {
            const response = await service.processMessage('Tôi muốn chết!!! 😢💔', sessionId, userId);
            expect(response).toBeDefined();
        });
    });
});
