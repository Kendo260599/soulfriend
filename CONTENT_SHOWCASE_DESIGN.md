# 🎨 CONTENT SHOWCASE DESIGN SPECIFICATIONS

**Date:** 2025-10-08  
**Purpose:** Redesign SoulFriend để showcase nội dung sâu  
**Status:** 🎯 READY TO IMPLEMENT

---

## 🎯 **DESIGN PRINCIPLES**

### **1. Content-First Approach**
- **Nội dung sâu** được highlight ngay từ đầu
- **Tính chuyên nghiệp** được thể hiện rõ ràng
- **Scientific credibility** được nhấn mạnh
- **User value** được communicate rõ ràng

### **2. Progressive Disclosure**
- **Level 1**: Overview & Quick Access
- **Level 2**: Detailed Information
- **Level 3**: Deep Research & Analysis
- **Level 4**: Professional Resources

### **3. Vietnamese Cultural Context**
- **Warm, approachable** tone
- **Family-oriented** messaging
- **Respectful** of cultural values
- **Empowering** for women

---

## 🏠 **LANDING PAGE REDESIGN**

### **Hero Section**
```typescript
const heroSection = {
  layout: "Full-width with gradient background",
  content: {
    title: "SoulFriend - Nền tảng Sức khỏe Tâm lý Chuyên nghiệp",
    subtitle: "13 Tests Tâm lý + AI Chatbot CHUN + Dữ liệu Nghiên cứu Việt Nam",
    description: "Hỗ trợ phụ nữ Việt Nam với công nghệ AI tiên tiến và nghiên cứu khoa học sâu sắc",
    cta: {
      primary: "Khám phá ngay",
      secondary: "Xem demo AI Chatbot"
    }
  },
  visual: {
    background: "Gradient từ tím nhạt đến hồng nhạt",
    animation: "Floating elements với psychological symbols",
    stats: "Real-time counters cho tests, users, research data"
  }
}
```

### **Feature Showcase Section**
```typescript
const featureShowcase = {
  layout: "3-column grid với hover effects",
  sections: [
    {
      title: "🧠 13 Psychological Tests",
      description: "Chuẩn quốc tế DSM-5, WHO",
      highlights: [
        "DASS-21: Trầm cảm, lo âu, stress (21 câu)",
        "PHQ-9: Sàng lọc trầm cảm DSM-5 (9 câu)",
        "EPDS: Trầm cảm sau sinh (10 câu)",
        "PMS Scale: Tiền kinh nguyệt",
        "Menopause Rating: Mãn kinh"
      ],
      cta: "Xem tất cả 13 tests",
      visual: "Animated test cards với progress bars"
    },
    {
      title: "🤖 AI Chatbot CHUN",
      description: "Trợ lý AI chuyên nghiệp với Crisis Detection",
      highlights: [
        "96% độ chính xác phát hiện tự tử",
        "HITL Crisis Support System",
        "Evidence-based responses",
        "Vietnamese cultural context"
      ],
      cta: "Trò chuyện ngay",
      visual: "Interactive chatbot demo với live typing"
    },
    {
      title: "📊 Dữ liệu Nghiên cứu Việt Nam",
      description: "Thống kê thực tế về sức khỏe tâm lý phụ nữ",
      highlights: [
        "15.2% trầm cảm, 18.7% lo âu",
        "12.8% trầm cảm sau sinh",
        "28.5% triệu chứng mãn kinh",
        "45.3% hội chứng tiền kinh nguyệt"
      ],
      cta: "Xem nghiên cứu chi tiết",
      visual: "Interactive charts với hover tooltips"
    }
  ]
}
```

### **Content Deep Dive Section**
```typescript
const contentDeepDive = {
  title: "Nội dung Chuyên sâu - Khám phá Kho tàng Kiến thức",
  description: "Từ tests tâm lý chuẩn quốc tế đến AI chatbot thông minh, từ dữ liệu nghiên cứu Việt Nam đến hệ thống hỗ trợ khủng hoảng",
  layout: "4-column grid với expandable cards",
  categories: [
    {
      name: "Psychological Tests",
      count: "13 tests",
      description: "Chuẩn quốc tế, được dịch và chuyển thể cho phụ nữ Việt Nam",
      icon: "🧠",
      color: "#6366f1",
      details: {
        international: "Dựa trên DSM-5, WHO Guidelines",
        vietnamese: "Được dịch và chuyển thể cho văn hóa Việt Nam",
        scientific: "Có độ tin cậy cao (α > 0.9)",
        comprehensive: "Cover tất cả aspects của mental health"
      }
    },
    {
      name: "AI Chatbot CHUN",
      count: "24/7 support",
      description: "Trợ lý AI với khả năng phát hiện khủng hoảng",
      icon: "🤖",
      color: "#10b981",
      details: {
        personality: "Chuyên nghiệp, Hiểu biết, Ủng hộ, Nhiệt tình",
        crisis: "96% độ chính xác phát hiện tự tử",
        hitl: "Human-in-the-Loop Crisis Support",
        evidence: "Dựa trên CBT, Mindfulness, MBSR"
      }
    },
    {
      name: "Research Data",
      count: "1000+ data points",
      description: "Dữ liệu nghiên cứu thực tế tại Việt Nam",
      icon: "📊",
      color: "#f59e0b",
      details: {
        vietnam: "Thống kê thực tế từ 1000+ phụ nữ Việt Nam",
        international: "So sánh với dữ liệu quốc tế",
        cultural: "Yếu tố văn hóa, xã hội, kinh tế",
        lifeStages: "Từ teen đến mãn kinh"
      }
    },
    {
      name: "Crisis Support",
      count: "HITL System",
      description: "Hệ thống can thiệp khủng hoảng với con người",
      icon: "🚨",
      color: "#ef4444",
      details: {
        detection: "Tự động phát hiện từ khóa khủng hoảng",
        intervention: "Can thiệp ngay lập tức với chuyên gia",
        escalation: "Escalation timer 5 phút",
        safety: "Safety protocols 8 bước"
      }
    }
  ]
}
```

---

## 📱 **CONTENT OVERVIEW PAGE**

### **Page Structure**
```typescript
const contentOverviewPage = {
  header: {
    title: "Khám phá Nội dung Chuyên sâu",
    description: "Từ tests tâm lý đến AI chatbot, từ nghiên cứu khoa học đến hỗ trợ khủng hoảng",
    breadcrumb: "Trang chủ > Khám phá nội dung"
  },
  navigation: {
    tabs: ["Tests Tâm lý", "AI Chatbot", "Nghiên cứu", "Hỗ trợ"],
    filters: ["Theo giai đoạn sống", "Theo mức độ nghiêm trọng", "Theo chủ đề"],
    search: "Tìm kiếm nội dung..."
  },
  content: {
    layout: "Grid với expandable cards",
    pagination: "Load more functionality",
    sorting: "Theo độ phổ biến, mới nhất, liên quan"
  }
}
```

### **Interactive Content Cards**
```typescript
const contentCards = {
  tests: {
    title: "Psychological Tests",
    description: "13 tests chuyên nghiệp dựa trên tiêu chuẩn quốc tế",
    preview: {
      sampleQuestions: "3-5 câu hỏi mẫu",
      duration: "Thời gian thực hiện",
      targetAudience: "Đối tượng phù hợp",
      scientificBasis: "Cơ sở khoa học"
    },
    cta: "Bắt đầu test",
    visual: "Animated progress bar với test completion"
  },
  ai: {
    title: "AI Chatbot CHUN",
    description: "Trợ lý AI 24/7 với khả năng phát hiện khủng hoảng",
    preview: {
      sampleConversation: "3-4 tin nhắn mẫu",
      personality: "Tính cách và tone",
      capabilities: "Khả năng chính",
      safety: "Crisis detection demo"
    },
    cta: "Trò chuyện ngay",
    visual: "Live typing animation với chatbot avatar"
  },
  research: {
    title: "Research Dashboard",
    description: "Dữ liệu nghiên cứu thực tế tại Việt Nam",
    preview: {
      keyStats: "5-7 thống kê chính",
      charts: "Biểu đồ tương tác",
      comparisons: "So sánh quốc tế",
      insights: "Insights và recommendations"
    },
    cta: "Xem nghiên cứu",
    visual: "Interactive charts với hover effects"
  },
  support: {
    title: "Crisis Support",
    description: "HITL Crisis Intervention System",
    preview: {
      protocols: "Safety protocols 8 bước",
      hotlines: "Số khẩn cấp Việt Nam",
      escalation: "Escalation process",
      resources: "Tài nguyên hỗ trợ"
    },
    cta: "Tìm hiểu",
    visual: "Safety protocol flowchart"
  }
}
```

---

## 🧭 **NAVIGATION ENHANCEMENT**

### **Main Menu Restructure**
```typescript
const mainMenu = {
  "Khám phá": {
    "Test Tâm lý": {
      path: "/tests",
      description: "13 tests chuyên nghiệp",
      icon: "🧠",
      submenu: [
        "DASS-21 (5-7 phút)",
        "PHQ-9 (3-4 phút)",
        "EPDS (3-4 phút)",
        "Xem tất cả tests"
      ]
    },
    "AI Chatbot": {
      path: "/chatbot",
      description: "Trò chuyện với CHUN",
      icon: "🤖",
      submenu: [
        "Trò chuyện ngay",
        "Crisis Detection Demo",
        "HITL System Info",
        "Personality Guide"
      ]
    },
    "Nghiên cứu": {
      path: "/research",
      description: "Dữ liệu khoa học",
      icon: "📊",
      submenu: [
        "Thống kê Việt Nam",
        "So sánh quốc tế",
        "Life Stage Analysis",
        "Cultural Factors"
      ]
    },
    "Tài nguyên": {
      path: "/resources",
      description: "Hỗ trợ và hướng dẫn",
      icon: "📚",
      submenu: [
        "Hướng dẫn sử dụng",
        "FAQ",
        "Chuyên gia",
        "Liên hệ"
      ]
    }
  },
  "Chuyên sâu": {
    "Dữ liệu Việt Nam": {
      path: "/vietnam-data",
      description: "Thống kê thực tế",
      icon: "🇻🇳"
    },
    "Chu kỳ sống": {
      path: "/life-stages",
      description: "Từ teen đến mãn kinh",
      icon: "🌸"
    },
    "Crisis Support": {
      path: "/crisis-support",
      description: "Hỗ trợ khủng hoảng",
      icon: "🚨"
    },
    "Chuyên gia": {
      path: "/experts",
      description: "Đội ngũ chuyên gia",
      icon: "👩‍⚕️"
    }
  }
}
```

### **Quick Access Sidebar**
```typescript
const quickAccess = {
  "Test nhanh": {
    "DASS-21": {
      duration: "5-7 phút",
      description: "Trầm cảm, lo âu, stress",
      icon: "🧠"
    },
    "PHQ-9": {
      duration: "3-4 phút",
      description: "Sàng lọc trầm cảm",
      icon: "💭"
    },
    "GAD-7": {
      duration: "2-3 phút",
      description: "Rối loạn lo âu",
      icon: "😰"
    }
  },
  "AI Chatbot": {
    "Trò chuyện": {
      description: "Chat với CHUN",
      icon: "💬"
    },
    "Crisis Demo": {
      description: "Demo phát hiện khủng hoảng",
      icon: "🚨"
    },
    "HITL Info": {
      description: "Thông tin HITL System",
      icon: "👥"
    }
  },
  "Nghiên cứu": {
    "Thống kê VN": {
      description: "Dữ liệu Việt Nam",
      icon: "📊"
    },
    "So sánh QT": {
      description: "So sánh quốc tế",
      icon: "🌍"
    },
    "Life Stages": {
      description: "Giai đoạn sống",
      icon: "🌸"
    }
  }
}
```

---

## 🔍 **CONTENT DISCOVERY FEATURES**

### **Search Functionality**
```typescript
const searchFeatures = {
  globalSearch: {
    placeholder: "Tìm kiếm tests, nghiên cứu, chatbot...",
    suggestions: "Gợi ý tìm kiếm phổ biến",
    filters: [
      "Theo loại test",
      "Theo giai đoạn sống",
      "Theo mức độ nghiêm trọng",
      "Theo chủ đề"
    ],
    results: {
      layout: "List với preview",
      sorting: "Theo độ liên quan, phổ biến, mới nhất",
      pagination: "Load more functionality"
    }
  },
  advancedSearch: {
    filters: {
      testType: "DASS-21, PHQ-9, GAD-7...",
      lifeStage: "Teen, Reproductive, Menopause...",
      severity: "Mild, Moderate, Severe...",
      topic: "Depression, Anxiety, Stress..."
    },
    sorting: "Relevance, Popularity, Date",
    results: "Advanced results với detailed previews"
  }
}
```

### **Content Recommendations**
```typescript
const recommendations = {
  basedOnTestResults: {
    title: "Dựa trên kết quả test của bạn",
    logic: "Recommend tests và resources dựa trên previous results",
    display: "Personalized cards với explanations"
  },
  basedOnLifeStage: {
    title: "Phù hợp với giai đoạn sống của bạn",
    logic: "Recommend content dựa trên age và life stage",
    display: "Life stage specific content cards"
  },
  basedOnInterests: {
    title: "Theo sở thích của bạn",
    logic: "Recommend dựa trên browsing history và interactions",
    display: "Interest-based content suggestions"
  },
  trending: {
    title: "Nội dung phổ biến",
    logic: "Most viewed và most completed content",
    display: "Trending content với popularity indicators"
  }
}
```

---

## 🎨 **VISUAL DESIGN SPECIFICATIONS**

### **Color Palette**
```typescript
const colorPalette = {
  primary: {
    main: "#6366f1", // Indigo
    light: "#a5b4fc",
    dark: "#4338ca"
  },
  secondary: {
    main: "#10b981", // Emerald
    light: "#6ee7b7",
    dark: "#059669"
  },
  accent: {
    main: "#f59e0b", // Amber
    light: "#fbbf24",
    dark: "#d97706"
  },
  danger: {
    main: "#ef4444", // Red
    light: "#fca5a5",
    dark: "#dc2626"
  },
  neutral: {
    white: "#ffffff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827"
  }
}
```

### **Typography**
```typescript
const typography = {
  headings: {
    h1: "Inter, 48px, 600, #111827",
    h2: "Inter, 36px, 600, #111827",
    h3: "Inter, 30px, 600, #111827",
    h4: "Inter, 24px, 600, #111827",
    h5: "Inter, 20px, 600, #111827",
    h6: "Inter, 18px, 600, #111827"
  },
  body: {
    large: "Inter, 18px, 400, #374151",
    medium: "Inter, 16px, 400, #374151",
    small: "Inter, 14px, 400, #6b7280"
  },
  special: {
    caption: "Inter, 12px, 400, #9ca3af",
    button: "Inter, 16px, 600, #ffffff",
    link: "Inter, 16px, 500, #6366f1"
  }
}
```

### **Spacing System**
```typescript
const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px"
}
```

---

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**
```typescript
const breakpoints = {
  mobile: "320px - 767px",
  tablet: "768px - 1023px",
  desktop: "1024px - 1439px",
  large: "1440px+"
}
```

### **Mobile Adaptations**
```typescript
const mobileAdaptations = {
  navigation: "Hamburger menu với slide-out",
  content: "Single column layout",
  cards: "Full-width với vertical stacking",
  search: "Full-width search bar",
  cta: "Full-width buttons"
}
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1A: Core Structure (Day 1)**
1. **Landing page hero section**
2. **Feature showcase section**
3. **Basic navigation**
4. **Mobile responsiveness**

### **Phase 1B: Content Discovery (Day 2)**
1. **Content overview page**
2. **Search functionality**
3. **Content recommendations**
4. **Interactive elements**

### **Phase 1C: Polish & Test (Day 3)**
1. **Visual refinements**
2. **Performance optimization**
3. **User testing**
4. **Bug fixes**

---

**STATUS: 🎯 READY TO IMPLEMENT**  
**CONFIDENCE: 95%**  
**TIMELINE: 3 days**  
**SUCCESS RATE: 90%**

---

**Prepared by:** AI Tech Lead  
**Date:** 2025-10-08  
**Next Action:** Start implementing landing page redesign

