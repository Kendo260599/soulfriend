/**
 * Vietnamese Test Cases - Comprehensive test suite
 * Tests 100+ Vietnamese sentences covering slang, metaphors, negation, emoji, no diacritics
 */

import moderationService from '../../src/services/moderationService';

describe('Vietnamese Test Cases - Comprehensive Suite', () => {
  describe('Direct Intent - Various Forms', () => {
    const directIntentCases = [
      'Tôi muốn chết',
      'toi muon chet', // No diacritics
      'TÔI MUỐN CHẾT', // Uppercase
      'Tôi muốn chết 😢', // With emoji
      'Tôi muốn chết!!!', // With punctuation
      'Tôi muốn chết và không muốn sống nữa',
      'Tôi nghĩ đến việc tự tử',
      'Tôi muốn kết thúc cuộc đời',
      'Tôi muốn biến mất vĩnh viễn',
      'Tôi không muốn tồn tại nữa',
    ];

    directIntentCases.forEach((message, index) => {
      it(`should detect direct intent (case ${index + 1}): "${message.substring(0, 30)}"`, async () => {
        const result = await moderationService.assess(message);
        expect(result.riskLevel).toBe('critical');
        expect(result.signals.some(s => s.category === 'direct_intent')).toBe(true);
      });
    });
  });

  describe('Planning Indicators', () => {
    const planningCases = [
      'Tôi đã lên kế hoạch để chết',
      'Tôi sẽ tự tử đêm nay',
      'Tôi sẽ làm việc đó ngày mai',
      'Tôi đã chuẩn bị sẵn sàng',
      'Tôi đã sẵn sàng để kết thúc',
      'Tôi sẽ viết thư tuyệt mệnh',
      'Tôi đã soạn thư',
      'Tôi sẽ tìm địa điểm',
      'Tôi sẽ nhảy cầu',
      'Tôi đã quyết định',
    ];

    planningCases.forEach((message, index) => {
      it(`should detect planning (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'plan')).toBe(true);
        // Risk level should be at least moderate (comparing risk levels as strings)
        expect(['moderate', 'high', 'critical']).toContain(result.riskLevel);
      });
    });
  });

  describe('Means/Methods', () => {
    const meansCases = [
      'Tôi đã mua dây thừng',
      'Tôi có dao',
      'Tôi có thuốc ngủ',
      'Tôi có thuốc trừ sâu',
      'Tôi có dao lam',
      'Tôi sẽ dùng dao găm',
      'Tôi có súng',
      'Tôi sẽ nhảy cầu',
      'Tôi sẽ dùng đường ray',
      'Tôi có thuốc độc',
    ];

    meansCases.forEach((message, index) => {
      it(`should detect means (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'means')).toBe(true);
      });
    });
  });

  describe('Timeframe Indicators', () => {
    const timeframeCases = [
      'Đêm nay tôi sẽ làm',
      'Tối nay tôi sẽ đi',
      'Ngày mai lúc 8 giờ',
      'Cuối tuần này',
      'Sáng mai',
      'Chiều nay',
      'Khi nào xong việc',
      'Sau khi làm xong',
      'Tôi sẽ làm khi nào',
    ];

    timeframeCases.forEach((message, index) => {
      it(`should detect timeframe (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'timeframe')).toBe(true);
      });
    });
  });

  describe('Farewell Messages', () => {
    const farewellCases = [
      'Tạm biệt mọi người',
      'Xin lỗi mọi người',
      'Đừng tìm em',
      'Em đi đây',
      'Hẹn gặp ở một nơi khác',
      'Cảm ơn vì tất cả',
      'Xin lỗi ba mẹ',
      'Xin lỗi gia đình',
      'Đừng tìm em nữa',
      'Em xin lỗi',
      'Chào tạm biệt',
      'Vĩnh biệt',
    ];

    farewellCases.forEach((message, index) => {
      it(`should detect farewell (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'farewell')).toBe(true);
      });
    });
  });

  describe('Internet Slang', () => {
    const slangCases = [
      'End game rồi',
      'Out game',
      'GG life',
      'Đi gặp ông bà',
      'Toang rồi',
      'Nghỉ chơi',
      'Xóa acc',
      'Delete account',
      'Log out forever',
      'Quit game',
      'Game over',
      'Reset life',
    ];

    slangCases.forEach((message, index) => {
      it(`should detect slang (case ${index + 1}): "${message}"`, async () => {
        const result = await moderationService.assess(message);
        // Slang alone should have lower risk
        expect(result.signals.some(s => s.category === 'other')).toBe(true);
      });
    });
  });

  describe('Combined Critical Cases', () => {
    const criticalCombinations = [
      'Tôi muốn chết và sẽ làm đêm nay',
      'Tôi muốn chết và đã mua dây thừng',
      'Tạm biệt mọi người, tôi muốn chết',
      'Tôi sẽ tự tử đêm nay và đã chuẩn bị',
      'Xin lỗi mọi người, tôi muốn chết ngày mai',
      'Tôi muốn chết, đã có thuốc và sẽ làm tối nay',
    ];

    criticalCombinations.forEach((message, index) => {
      it(`should detect critical combination (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.riskLevel).toBe('critical');
        expect(result.riskScore).toBeGreaterThan(60);
      });
    });
  });

  describe('Negation Patterns (False Positive Prevention)', () => {
    const negationCases = [
      'Tôi không muốn chết',
      'Tôi không tự tử',
      'Tôi không muốn làm đau bản thân',
      'Tôi không muốn tự hại',
      'Tôi không bao giờ nghĩ đến chuyện đó',
      'Tôi không muốn chết, tôi muốn sống',
      'Tôi không có ý định tự tử',
    ];

    negationCases.forEach((message, index) => {
      it(`should handle negation (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        // Should have lower risk due to negation
        expect(result.riskLevel).not.toBe('critical');
        // Check if signals have reduced confidence
        const directIntentSignal = result.signals.find(s => s.category === 'direct_intent');
        if (directIntentSignal) {
          expect(directIntentSignal.confidence).toBeLessThan(0.5);
        }
      });
    });
  });

  describe('Emoji Variations', () => {
    const emojiCases = [
      'Tôi muốn chết 😢',
      'Tôi muốn chết 💔',
      'Tôi muốn chết 😭',
      'Tôi muốn chết 😰',
      'Tôi muốn chết 😔',
      'Tôi muốn chết 😞',
      'Tôi muốn chết 😕',
      'Tôi muốn chết 😟',
      'Tôi muốn chết 😨',
      'Tôi muốn chết 😩',
    ];

    emojiCases.forEach((message, index) => {
      it(`should handle emoji (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.riskLevel).toBe('critical');
        // Emoji should be removed from normalized text
        expect(result.normalized).not.toContain('😢');
      });
    });
  });

  describe('Leet Speak', () => {
    const leetCases = [
      't0i mu0n ch3t',
      't0i mu0n ch3t',
      't0i mu0n ch3t!!!',
      't0i mu0n ch3t v4 kh0ng mu0n s0ng nua',
    ];

    leetCases.forEach((message, index) => {
      it(`should handle leet speak (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.normalized).toContain('toi muon chet');
        expect(result.riskLevel).toBe('critical');
      });
    });
  });

  describe('Normal Conversation (Should Not Trigger)', () => {
    const normalCases = [
      'Xin chào',
      'Hôm nay bạn thế nào?',
      'Tôi cảm thấy ổn',
      'Cảm ơn bạn đã hỏi',
      'Tôi đang học tập',
      'Tôi thích đi chơi',
      'Tôi yêu cuộc sống',
      'Tôi hạnh phúc',
      'Tôi cảm thấy tốt',
      'Tôi muốn sống',
    ];

    normalCases.forEach((message, index) => {
      it(`should not trigger for normal conversation (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.riskLevel).toBe('low');
        expect(result.riskScore).toBeLessThan(25);
      });
    });
  });

  describe('Metaphors and Indirect Expressions', () => {
    const metaphorCases = [
      'Cuộc sống vô nghĩa',
      'Tôi chán đời',
      'Tôi vô giá trị',
      'Tôi không còn ý nghĩa',
      'Tôi muốn ngủ mãi',
      'Tôi muốn biến mất khỏi thế giới',
      'Tôi không còn hy vọng',
      'Mọi thứ đều vô nghĩa',
      'Tôi không còn ai quan tâm',
      'Không ai cần mình',
    ];

    metaphorCases.forEach((message, index) => {
      it(`should detect metaphors (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'ideation')).toBe(true);
        // Risk level should be at least moderate
        expect(['moderate', 'high', 'critical']).toContain(result.riskLevel);
      });
    });
  });

  describe('Self-Harm (NSSI)', () => {
    const nssiCases = [
      'Tôi muốn cắt tay',
      'Tôi muốn tự làm đau',
      'Tôi muốn tự hành hạ',
      'Tôi muốn làm tổn thương bản thân',
      'Tôi muốn cắt cổ',
      'Tôi muốn đánh mình',
      'Tôi muốn tự sát thương',
      'Tôi muốn làm đau mình',
      'Tôi muốn tự làm tổn thương',
      'Tôi muốn cắt da',
    ];

    nssiCases.forEach((message, index) => {
      it(`should detect NSSI (case ${index + 1})`, async () => {
        const result = await moderationService.assess(message);
        expect(result.signals.some(s => s.category === 'nssi')).toBe(true);
        // Risk level should be at least high
        expect(['high', 'critical']).toContain(result.riskLevel);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', async () => {
      const result = await moderationService.assess('');
      expect(result.riskLevel).toBe('low');
      expect(result.riskScore).toBe(0);
    });

    it('should handle very long message', async () => {
      const longMessage = 'Tôi muốn chết '.repeat(500);
      const result = await moderationService.assess(longMessage);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle mixed Vietnamese and English', async () => {
      const result = await moderationService.assess('Tôi muốn chết and end my life');
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle repeated characters', async () => {
      const result = await moderationService.assess('Tôi muốn chếtttttt');
      expect(result.normalized).not.toContain('chetttttt');
      expect(result.riskLevel).toBe('critical');
    });
  });
});

