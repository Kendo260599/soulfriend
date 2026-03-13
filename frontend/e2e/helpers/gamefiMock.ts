import { Page, Route } from '@playwright/test';

const API_HOST = 'https://soulfriend-api.onrender.com';
const TODAY = '2099-12-31';

export interface MockCounters {
  completeQuest: number;
  weekly: number;
  ritual: number;
}

export interface MockBehavior {
  jitterMs?: { min: number; max: number };
  failOnceByPath?: Record<string, number>;
  timeoutOncePaths?: string[];
}

const FULL_DATA = {
  profile: {
    character: {
      id: 'char_1',
      userId: 'e2e-user-1',
      archetype: 'The Explorer',
      level: 4,
      xp: 420,
      growthScore: 56,
      growthStats: {
        emotionalAwareness: 61,
        psychologicalSafety: 55,
        meaning: 64,
        cognitiveFlexibility: 58,
        relationshipQuality: 53,
      },
      soulPoints: 22,
      empathyPoints: 15,
      streak: 5,
      lastActiveDate: TODAY,
      completedQuestIds: ['quest_dass_2099-12-31'],
      badges: ['starter_badge'],
      createdAt: '2099-01-01T00:00:00.000Z',
    },
    quests: [
      {
        id: `quest_chat_${TODAY}`,
        title: 'Trò chuyện 3 tin nhắn',
        description: 'Mở chatbot và gửi 3 tin nhắn để kết nối cảm xúc',
        icon: '💬',
        xpReward: 15,
        eventType: 'chat',
        completed: false,
        completionMode: 'auto_event',
      },
      {
        id: `quest_journal_${TODAY}`,
        title: 'Nhật ký 3 câu',
        description: 'Viết ít nhất 3 câu về cảm xúc hôm nay',
        icon: '📝',
        xpReward: 20,
        eventType: 'journal',
        completed: false,
        completionMode: 'requires_input',
      },
      {
        id: `quest_breathing_${TODAY}`,
        title: 'Thở 5 phút',
        description: 'Thực hành một bài thở ngắn',
        icon: '🧘',
        xpReward: 10,
        eventType: 'breathing',
        completed: false,
        completionMode: 'manual_confirm',
      },
    ],
    badges: [
      {
        id: 'starter_badge',
        name: 'Khởi Đầu',
        icon: '🌱',
        description: 'Hoàn thành nhiệm vụ đầu tiên',
        unlocked: true,
      },
      {
        id: 'resilience_badge',
        name: 'Kiên Cường',
        icon: '🛡️',
        description: 'Duy trì streak 7 ngày',
        unlocked: false,
      },
    ],
    levelTitle: 'Người Khai Phá',
    xpToNextLevel: 80,
    xpProgress: 84,
  },
  skillTree: {
    skills: [
      {
        id: 'sk_1',
        branch: 'self_awareness',
        tier: 1,
        ten: 'Nhận diện cảm xúc',
        moTa: 'Gọi tên cảm xúc trong ngày',
        linkedLocation: 'thung_lung_cau_hoi',
        unlocked: true,
        canUnlock: false,
      },
      {
        id: 'sk_2',
        branch: 'emotional_regulation',
        tier: 1,
        ten: 'Điều hòa nhịp thở',
        moTa: 'Ổn định cảm xúc bằng hơi thở',
        linkedLocation: 'dong_song_cam_xuc',
        unlocked: false,
        canUnlock: true,
      },
    ],
    synergies: [
      {
        id: 'syn_1',
        ten: 'Tự chủ bình tĩnh',
        moTa: 'Kết hợp tự nhận thức và điều tiết cảm xúc',
        requiredSkills: ['sk_1', 'sk_2'],
        unlocked: false,
      },
    ],
    masteries: [
      {
        branch: 'self_awareness',
        ten: 'Tự Nhận Thức',
        danhHieu: 'Người Soi Chiếu',
        mastered: false,
      },
    ],
    unlockedCount: 1,
    totalCount: 2,
  },
  worldMap: {
    locations: [
      {
        id: 'thung_lung_cau_hoi',
        ten: 'Thung Lũng Câu Hỏi',
        moTa: 'Nơi bắt đầu hành trình tự vấn',
        levelRequired: 1,
        growthScoreRequired: 10,
        unlocked: true,
        isCurrent: true,
      },
      {
        id: 'rung_tu_nhan_thuc',
        ten: 'Rừng Tự Nhận Thức',
        moTa: 'Không gian suy ngẫm sâu',
        levelRequired: 3,
        growthScoreRequired: 40,
        unlocked: true,
        isCurrent: false,
      },
      {
        id: 'dinh_nui_y_nghia',
        ten: 'Đỉnh Núi Ý Nghĩa',
        moTa: 'Đích đến của hành trình',
        levelRequired: 8,
        growthScoreRequired: 80,
        unlocked: false,
        isCurrent: false,
      },
    ],
    currentLocation: 'thung_lung_cau_hoi',
    unlockedCount: 2,
    totalCount: 3,
  },
  state: {
    zone: 'growth',
    growthScore: 56,
    trajectory: [
      {
        timestamp: Date.now() - 86400000,
        zone: 'self_exploration',
        growthScore: 49,
        stats: {
          emotionalAwareness: 55,
          psychologicalSafety: 50,
          meaning: 59,
          cognitiveFlexibility: 53,
          relationshipQuality: 49,
        },
      },
    ],
    empathyRank: 'Người Lắng Nghe',
    empathyScore: 120,
  },
  behavior: {
    dailyRitual: {
      date: TODAY,
      checkinDone: false,
      reflectionDone: false,
      communityDone: false,
      completed: false,
    },
    weeklyChallenges: [
      {
        id: 'weekly_1',
        title: '1 cuộc trò chuyện sâu',
        description: 'Chủ động lắng nghe một người trong 10 phút',
        xpReward: 30,
        completed: false,
      },
    ],
    seasonalGoals: [
      {
        id: 'season_1',
        title: 'Mùa trưởng thành',
        rewardTitle: 'Huy hiệu Nở Hoa',
        xpReward: 120,
        progress: {
          questsCompleted: 3,
          reflections: 2,
          empathyActions: 1,
        },
        requirements: {
          questsCompleted: 10,
          reflections: 8,
          empathyActions: 6,
        },
        completed: false,
      },
    ],
    meaningShifts: [
      {
        from: 'Mình vô dụng',
        to: 'Mình đang học cách trưởng thành',
        detectedAt: Date.now() - 7200000,
      },
    ],
  },
  lore: {
    worldName: 'Vùng Đất Nội Tâm',
    playerRole: 'Người Học Hỏi',
    communityName: 'Cộng đồng Đồng Cảm',
    philosophies: [{ id: 'p1', noiDung: 'Hiểu mình để hiểu người.' }],
    legends: [
      {
        id: 'l1',
        ten: 'Người Kết Nối',
        moTa: 'Biết lắng nghe và tạo an toàn tâm lý',
        becomeCondition: 'Hoàn thành 20 nhiệm vụ kết nối',
      },
    ],
    locationLores: [
      {
        locationId: 'thung_lung_cau_hoi',
        ten: 'Thung Lũng Câu Hỏi',
        truyenThuyet: 'Nơi mọi câu hỏi đều có giá trị.',
        trieuLy: 'Không có câu hỏi sai, chỉ có câu hỏi chưa đủ sâu.',
      },
      {
        locationId: 'dinh_nui_y_nghia',
        ten: 'Đỉnh Núi Ý Nghĩa',
        truyenThuyet: 'Tầm nhìn của người đã hiểu bản thân.',
        trieuLy: 'Ý nghĩa không đến từ đích, mà từ hành trình.',
      },
    ],
  },
};

const DASHBOARD_DATA = {
  identity: {
    name: 'E2E Player',
    archetype: 'The Explorer',
    level: 4,
    xp: 420,
    xpProgress: 84,
    xpToNextLevel: 80,
    levelTitle: 'Người Khai Phá',
    soulPoints: 22,
    empathyPoints: 15,
    streak: 5,
    createdAt: '2099-01-01T00:00:00.000Z',
  },
  psychologicalState: FULL_DATA.profile.character.growthStats,
  skillBranches: [],
  questProgress: {
    dailyQuests: FULL_DATA.profile.quests.map((q) => ({
      id: q.id,
      title: q.title,
      icon: q.icon,
      completed: q.completed,
    })),
    questsCompletedTotal: 3,
    reflectionStreak: 2,
    currentQuestHint: 'Giữ nhịp đều mỗi ngày',
  },
  narrativeTimeline: [
    {
      timestamp: Date.now() - 100000,
      label: 'Bắt đầu hành trình GameFi',
      type: 'start',
    },
  ],
  milestones: [
    {
      id: 'm1',
      name: 'Khởi Đầu',
      icon: '🌱',
      description: 'Hoàn thành nhiệm vụ đầu tiên',
      unlocked: true,
    },
  ],
  communityRole: {
    role: 'Người Lắng Nghe',
    empathyScore: 120,
    empathyRank: 'Bạc',
    peoplHelped: 2,
  },
  worldProgress: {
    locations: [
      {
        id: 'thung_lung_cau_hoi',
        name: 'Thung Lũng Câu Hỏi',
        icon: '🏞️',
        unlocked: true,
        isCurrent: true,
      },
    ],
    currentLocation: 'thung_lung_cau_hoi',
    unlockedCount: 2,
    totalCount: 3,
  },
  personalInsight: 'Bạn tiến bộ rõ ở khả năng nhận diện cảm xúc.',
  dailySuggestion: 'Dành 5 phút viết lại một điều bạn biết ơn.',
  zone: 'growth',
  growthScore: 56,
};

const ADAPTIVE_DATA = {
  playerPhase: 'growth',
  userType: 'explorer',
  recommendations: [
    {
      questId: 'adaptive_gratitude_1',
      title: 'Viết 3 điều biết ơn',
      description: 'Ghi lại 3 điều nhỏ khiến bạn thấy trân trọng hôm nay.',
      category: 'gratitude',
      xpReward: 22,
      totalScore: 88,
      reason: 'Phù hợp để tăng chỉ số ý nghĩa và an toàn tâm lý.',
      completionMode: 'requires_input',
    },
  ],
  questChain: null,
  allChains: [
    {
      id: 'chain_reflection',
      theme: 'reflection',
      title: 'Hành trình soi chiếu',
      totalXp: 60,
      completedSteps: 0,
      steps: [
        {
          order: 1,
          title: 'Gọi tên cảm xúc hôm nay',
          description: 'Viết 3 câu về cảm xúc nổi bật trong ngày.',
          xpReward: 20,
          completed: false,
          completionMode: 'requires_input',
        },
      ],
    },
  ],
  difficulty: {
    current: 'medium',
    suggested: 'medium',
    completionRate: 0.65,
    shouldAdjust: false,
    reason: 'Nhịp ổn định.',
  },
};

const QUEST_DB_DATA = {
  quests: [
    {
      id: 'q_db_1',
      title: 'Nhật ký biết ơn',
      description: 'Viết ngắn về 3 điều biết ơn.',
      category: 'gratitude',
      location: 'Thung Lũng Câu Hỏi',
      xpReward: 25,
      loai: 'y_nghia',
      completed: false,
      completionMode: 'requires_input',
    },
  ],
  totalCount: 1,
  completedCount: 0,
  categories: ['gratitude'],
};

const QUEST_HISTORY_DATA = [
  {
    questId: 'quest_dass_2099-12-31',
    title: 'Hoàn thành DASS-21',
    category: 'reflection',
    xpReward: 20,
    completedAt: Date.now() - 86400000,
  },
];

function e2eToken(): string {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = 'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImUyZS11c2VyLTEifQ';
  return `${header}.${payload}.e2e-signature`;
}

export async function seedAuthForGameFi(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem(
      'userData',
      JSON.stringify({
        id: 'e2e-user-1',
        email: 'e2e@soulfriend.test',
        displayName: 'E2E Player',
      })
    );
    localStorage.setItem('gamefi_onboarding_done', '1');
    localStorage.setItem('gamefi_first_focus_started_at', String(Date.now() - 20 * 60 * 1000));
  }, e2eToken());
}

export async function installGameFiMocks(
  page: Page,
  counters: MockCounters,
  behavior: MockBehavior = {}
): Promise<void> {
  const failRemaining = new Map<string, number>(Object.entries(behavior.failOnceByPath || {}));
  const timeoutRemaining = new Set<string>(behavior.timeoutOncePaths || []);

  const maybeJitter = async (): Promise<void> => {
    const jitter = behavior.jitterMs;
    if (!jitter) return;
    const delay = Math.floor(Math.random() * (jitter.max - jitter.min + 1)) + jitter.min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  };

  const applyChaosIfNeeded = async (routePath: string, routeObj: Route): Promise<boolean> => {
    await maybeJitter();

    if (timeoutRemaining.has(routePath)) {
      timeoutRemaining.delete(routePath);
      await routeObj.abort('timedout');
      return true;
    }

    const remain = failRemaining.get(routePath) || 0;
    if (remain > 0) {
      failRemaining.set(routePath, remain - 1);
      await routeObj.fulfill({
        status: 500,
        json: { success: false, error: `E2E injected failure for ${routePath}` },
      });
      return true;
    }

    return false;
  };

  await page.route(`${API_HOST}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;

    if (path.startsWith('/socket.io/')) {
      await route.fulfill({ status: 200, body: 'ok' });
      return;
    }

    if (path === '/api/v2/gamefi/full/e2e-user-1') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({ json: { success: true, data: FULL_DATA } });
      return;
    }

    if (path === '/api/v2/gamefi/dashboard/e2e-user-1') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({ json: { success: true, data: DASHBOARD_DATA } });
      return;
    }

    if (path === '/api/v2/gamefi/adaptive/e2e-user-1') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({ json: { success: true, data: ADAPTIVE_DATA } });
      return;
    }

    if (path === '/api/v2/gamefi/quests/e2e-user-1') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({ json: { success: true, data: QUEST_DB_DATA } });
      return;
    }

    if (path === '/api/v2/gamefi/history/e2e-user-1') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({ json: { success: true, data: QUEST_HISTORY_DATA } });
      return;
    }

    if (path === '/api/v2/gamefi/quest/complete' || path === '/api/v2/gamefi/quests/complete') {
      if (await applyChaosIfNeeded(path, route)) return;
      counters.completeQuest += 1;
      await route.fulfill({
        json: {
          success: true,
          data: {
            xpGained: 20,
            growthImpact: { meaning: 2 },
            newLevel: 4,
            levelTitle: 'Người Khai Phá',
            milestone: null,
            rewards: { soulPoints: 2, empathyPoints: 1 },
            feedback: 'Tuyệt vời',
            eventType: 'reflection',
          },
        },
      });
      return;
    }

    if (path === '/api/v2/gamefi/behavior/daily') {
      if (await applyChaosIfNeeded(path, route)) return;
      counters.ritual += 1;
      await route.fulfill({
        json: {
          success: true,
          data: {
            eventResult: {
              xpGained: 10,
              growthImpact: { emotionalAwareness: 1 },
              newLevel: 4,
              levelTitle: 'Người Khai Phá',
              milestone: null,
              rewards: { soulPoints: 1, empathyPoints: 0 },
              feedback: 'Bạn đã check-in cảm xúc.',
              eventType: 'reflection',
            },
          },
        },
      });
      return;
    }

    if (path === '/api/v2/gamefi/behavior/weekly') {
      if (await applyChaosIfNeeded(path, route)) return;
      counters.weekly += 1;
      await route.fulfill({
        json: {
          success: true,
          data: {
            title: 'Thử thách tuần',
            eventResult: {
              xpGained: 30,
              growthImpact: { relationshipQuality: 2 },
              newLevel: 4,
              levelTitle: 'Người Khai Phá',
              milestone: null,
              rewards: { soulPoints: 2, empathyPoints: 2 },
              feedback: 'Bạn hoàn thành thử thách tuần.',
              eventType: 'community_impact',
            },
          },
        },
      });
      return;
    }

    if (path === '/api/v2/gamefi/world/travel') {
      if (await applyChaosIfNeeded(path, route)) return;
      await route.fulfill({
        json: {
          success: true,
          data: {
            message: '✅ Đã di chuyển thành công',
          },
        },
      });
      return;
    }

    if (path === '/api/v5/learning/feedback') {
      await route.fulfill({ json: { success: true } });
      return;
    }

    if (path.startsWith('/api/')) {
      await route.fulfill({ json: { success: true } });
      return;
    }

    await route.continue();
  });
}

export async function openGameFiWithMocks(
  page: Page,
  counters: MockCounters,
  behavior: MockBehavior = {}
): Promise<void> {
  await seedAuthForGameFi(page);
  await installGameFiMocks(page, counters, behavior);
  await page.goto('/gamefi');
  await page.waitForLoadState('networkidle');
}
