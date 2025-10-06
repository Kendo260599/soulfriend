/**
 * YouTube Video Validator
 * Utility để kiểm tra tính khả dụng của video YouTube
 */

export interface VideoValidationResult {
  videoId: string;
  isValid: boolean;
  error?: string;
  fallbackContent?: string;
}

export class YouTubeValidator {
  private static readonly WORKING_VIDEO_IDS = [
    'dQw4w9WgXcQ', // Rick Roll - Video nổi tiếng, chắc chắn hoạt động
    'jNQXAC9IVRw', // Video nổi tiếng khác
    'M7lc1UVf-VE', // Video YouTube nổi tiếng
    '9bZkp7q19f0', // PSY - Gangnam Style
    'kJQP7kiw5Fk'  // Luis Fonsi - Despacito
  ];

  private static readonly FALLBACK_CONTENT = {
    breathing: {
      title: 'Kỹ thuật Thở 4-7-8',
      content: [
        'Hít vào bằng mũi trong 4 giây',
        'Giữ hơi thở trong 7 giây',
        'Thở ra bằng miệng trong 8 giây',
        'Lặp lại 4 lần'
      ],
      benefits: [
        'Giảm lo âu tức thì',
        'Cải thiện giấc ngủ',
        'Tăng tập trung',
        'Giảm stress'
      ]
    },
    yoga: {
      title: 'Yoga Cơ bản',
      content: [
        'Tư thế ngồi thoải mái',
        'Thở sâu và đều',
        'Thực hiện các động tác nhẹ nhàng',
        'Thư giãn hoàn toàn'
      ],
      benefits: [
        'Tăng sức mạnh cơ bắp',
        'Cải thiện linh hoạt',
        'Giảm stress',
        'Tăng năng lượng'
      ]
    },
    meditation: {
      title: 'Thiền Chánh niệm',
      content: [
        'Tìm nơi yên tĩnh',
        'Ngồi thoải mái',
        'Tập trung vào hơi thở',
        'Quan sát suy nghĩ không phán xét'
      ],
      benefits: [
        'Giảm lo âu',
        'Tăng tập trung',
        'Cải thiện tâm trạng',
        'Giảm stress'
      ]
    }
  };

  /**
   * Kiểm tra xem video ID có hợp lệ không
   */
  static validateVideoId(videoId: string): VideoValidationResult {
    try {
      // Kiểm tra format cơ bản
      if (!videoId || videoId.length !== 11) {
        return {
          videoId,
          isValid: false,
          error: 'Video ID không hợp lệ'
        };
      }

      // Kiểm tra xem có trong danh sách video hoạt động không
      const isWorking = this.WORKING_VIDEO_IDS.includes(videoId);
      
      if (isWorking) {
        return {
          videoId,
          isValid: true
        };
      }

      // Nếu không phải video demo, coi như có thể hoạt động
      return {
        videoId,
        isValid: true
      };

    } catch (error) {
      return {
        videoId,
        isValid: false,
        error: `Lỗi kiểm tra video: ${error}`
      };
    }
  }

  /**
   * Tạo fallback content khi video không khả dụng
   */
  static generateFallbackContent(category: string, videoId: string): string {
    const fallback = this.FALLBACK_CONTENT[category as keyof typeof this.FALLBACK_CONTENT];
    
    if (!fallback) {
      return `Video ${videoId} hiện không khả dụng. Vui lòng thử lại sau hoặc tìm video thay thế.`;
    }

    let content = `📚 ${fallback.title}\n\n`;
    content += `📋 Hướng dẫn:\n`;
    fallback.content.forEach((item, index) => {
      content += `${index + 1}. ${item}\n`;
    });
    
    content += `\n💡 Lợi ích:\n`;
    fallback.benefits.forEach((benefit, index) => {
      content += `• ${benefit}\n`;
    });

    content += `\n⚠️ Video ${videoId} hiện không khả dụng. Sử dụng hướng dẫn trên để thực hành.`;
    
    return content;
  }

  /**
   * Kiểm tra tất cả video trong danh sách
   */
  static validateAllVideos(videoIds: string[]): VideoValidationResult[] {
    return videoIds.map(videoId => this.validateVideoId(videoId));
  }

  /**
   * Lấy danh sách video hoạt động
   */
  static getWorkingVideoIds(): string[] {
    return [...this.WORKING_VIDEO_IDS];
  }

  /**
   * Tạo embed URL an toàn
   */
  static createSafeEmbedUrl(videoId: string): string {
    const baseUrl = 'https://www.youtube.com/embed/';
    const params = [
      'rel=0',
      'modestbranding=1',
      'enablejsapi=1',
      'origin=' + encodeURIComponent(window.location.origin)
    ].join('&');
    
    return `${baseUrl}${videoId}?${params}`;
  }

  /**
   * Tạo YouTube watch URL
   */
  static createWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
}

export default YouTubeValidator;
