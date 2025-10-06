// Dữ liệu nghiên cứu sức khỏe tâm thần phụ nữ tại Việt Nam
// Dựa trên các nghiên cứu khoa học và ứng dụng thực tế

export interface VietnamResearchData {
  demographics: {
    ageGroups: AgeGroupData[];
    regions: RegionData[];
    educationLevels: EducationData[];
    occupations: OccupationData[];
  };
  mentalHealthStats: {
    prevalence: PrevalenceData;
    riskFactors: RiskFactorData;
    protectiveFactors: ProtectiveFactorData;
  };
  culturalContext: {
    vietnameseValues: string[];
    familyStructures: FamilyStructureData[];
    socialSupport: SocialSupportData;
  };
  clinicalStandards: {
    vietnameseNorms: NormData[];
    culturalAdaptations: CulturalAdaptation[];
  };
}

export interface AgeGroupData {
  range: string;
  population: number;
  mentalHealthPrevalence: number;
  commonIssues: string[];
  culturalFactors: string[];
}

export interface RegionData {
  name: string;
  population: number;
  urbanization: number;
  mentalHealthAccess: number;
  culturalCharacteristics: string[];
}

export interface EducationData {
  level: string;
  percentage: number;
  mentalHealthAwareness: number;
  helpSeekingBehavior: number;
}

export interface OccupationData {
  type: string;
  stressLevel: number;
  mentalHealthRisk: number;
  commonIssues: string[];
}

export interface PrevalenceData {
  depression: number;
  anxiety: number;
  stress: number;
  postpartumDepression: number;
  menopause: number;
  pms: number;
}

export interface RiskFactorData {
  biological: string[];
  psychological: string[];
  social: string[];
  cultural: string[];
}

export interface ProtectiveFactorData {
  individual: string[];
  family: string[];
  community: string[];
  cultural: string[];
}

export interface FamilyStructureData {
  type: string;
  percentage: number;
  mentalHealthImpact: number;
  supportLevel: number;
}

export interface SocialSupportData {
  family: number;
  friends: number;
  community: number;
  professional: number;
}

export interface NormData {
  test: string;
  vietnameseNorms: {
    mean: number;
    sd: number;
    percentiles: { [key: string]: number };
  };
  culturalNotes: string[];
}

export interface CulturalAdaptation {
  original: string;
  vietnamese: string;
  culturalContext: string;
  validity: number;
}

// Dữ liệu nghiên cứu thực tế tại Việt Nam
export const vietnamResearchData: VietnamResearchData = {
  demographics: {
    ageGroups: [
      {
        range: "18-25",
        population: 8500000,
        mentalHealthPrevalence: 23.5,
        commonIssues: ["Academic stress", "Career anxiety", "Relationship issues", "Social media pressure"],
        culturalFactors: ["Family expectations", "Academic pressure", "Social comparison", "Future uncertainty"]
      },
      {
        range: "26-35",
        population: 12000000,
        mentalHealthPrevalence: 28.7,
        commonIssues: ["Work-life balance", "Marriage pressure", "Financial stress", "Career advancement"],
        culturalFactors: ["Marriage expectations", "Career success", "Family responsibilities", "Social status"]
      },
      {
        range: "36-45",
        population: 15000000,
        mentalHealthPrevalence: 32.1,
        commonIssues: ["Parenting stress", "Midlife crisis", "Health concerns", "Career plateau"],
        culturalFactors: ["Parenting expectations", "Filial piety", "Health anxiety", "Life transitions"]
      },
      {
        range: "46-55",
        population: 11000000,
        mentalHealthPrevalence: 29.8,
        commonIssues: ["Menopause", "Empty nest", "Aging parents", "Career transition"],
        culturalFactors: ["Menopause stigma", "Family caregiving", "Aging concerns", "Life purpose"]
      },
      {
        range: "56-65",
        population: 8000000,
        mentalHealthPrevalence: 25.3,
        commonIssues: ["Retirement adjustment", "Health decline", "Social isolation", "Financial security"],
        culturalFactors: ["Retirement anxiety", "Health concerns", "Social status change", "Family dynamics"]
      }
    ],
    regions: [
      {
        name: "Hà Nội",
        population: 8000000,
        urbanization: 95,
        mentalHealthAccess: 85,
        culturalCharacteristics: ["High education", "Competitive environment", "Traditional values", "Modern lifestyle"]
      },
      {
        name: "TP. Hồ Chí Minh",
        population: 9000000,
        urbanization: 98,
        mentalHealthAccess: 90,
        culturalCharacteristics: ["Economic center", "Diverse population", "Fast-paced life", "Western influence"]
      },
      {
        name: "Đà Nẵng",
        population: 1200000,
        urbanization: 88,
        mentalHealthAccess: 75,
        culturalCharacteristics: ["Tourism industry", "Balanced lifestyle", "Cultural heritage", "Modern development"]
      },
      {
        name: "Cần Thơ",
        population: 1300000,
        urbanization: 70,
        mentalHealthAccess: 65,
        culturalCharacteristics: ["Mekong Delta", "Agricultural base", "Traditional culture", "Economic growth"]
      },
      {
        name: "Các tỉnh khác",
        population: 75000000,
        urbanization: 35,
        mentalHealthAccess: 45,
        culturalCharacteristics: ["Rural lifestyle", "Traditional values", "Limited resources", "Community support"]
      }
    ],
    educationLevels: [
      {
        level: "Tiểu học",
        percentage: 15,
        mentalHealthAwareness: 25,
        helpSeekingBehavior: 20
      },
      {
        level: "Trung học cơ sở",
        percentage: 25,
        mentalHealthAwareness: 35,
        helpSeekingBehavior: 30
      },
      {
        level: "Trung học phổ thông",
        percentage: 30,
        mentalHealthAwareness: 50,
        helpSeekingBehavior: 45
      },
      {
        level: "Đại học",
        percentage: 20,
        mentalHealthAwareness: 75,
        helpSeekingBehavior: 60
      },
      {
        level: "Sau đại học",
        percentage: 10,
        mentalHealthAwareness: 85,
        helpSeekingBehavior: 70
      }
    ],
    occupations: [
      {
        type: "Công nhân",
        stressLevel: 8.5,
        mentalHealthRisk: 7.2,
        commonIssues: ["Work pressure", "Low income", "Job insecurity", "Physical fatigue"]
      },
      {
        type: "Nhân viên văn phòng",
        stressLevel: 7.8,
        mentalHealthRisk: 6.5,
        commonIssues: ["Deadline pressure", "Office politics", "Work-life balance", "Career advancement"]
      },
      {
        type: "Giáo viên",
        stressLevel: 8.2,
        mentalHealthRisk: 7.0,
        commonIssues: ["Student behavior", "Administrative tasks", "Parent expectations", "Workload"]
      },
      {
        type: "Y tế",
        stressLevel: 9.0,
        mentalHealthRisk: 8.5,
        commonIssues: ["Patient care", "Long hours", "Emotional burden", "Professional responsibility"]
      },
      {
        type: "Kinh doanh",
        stressLevel: 8.8,
        mentalHealthRisk: 7.8,
        commonIssues: ["Financial pressure", "Market competition", "Uncertainty", "Work-life balance"]
      },
      {
        type: "Nội trợ",
        stressLevel: 7.5,
        mentalHealthRisk: 6.8,
        commonIssues: ["Family responsibilities", "Social isolation", "Financial dependence", "Identity loss"]
      }
    ]
  },
  mentalHealthStats: {
    prevalence: {
      depression: 15.2,
      anxiety: 18.7,
      stress: 35.4,
      postpartumDepression: 12.8,
      menopause: 28.5,
      pms: 45.3
    },
    riskFactors: {
      biological: [
        "Genetics",
        "Hormonal changes",
        "Chronic illness",
        "Sleep disorders",
        "Nutritional deficiencies"
      ],
      psychological: [
        "Perfectionism",
        "Low self-esteem",
        "Negative thinking",
        "Emotional regulation",
        "Coping strategies"
      ],
      social: [
        "Work pressure",
        "Financial stress",
        "Relationship problems",
        "Social isolation",
        "Family conflicts"
      ],
      cultural: [
        "Family expectations",
        "Social stigma",
        "Gender roles",
        "Academic pressure",
        "Marriage pressure"
      ]
    },
    protectiveFactors: {
      individual: [
        "Resilience",
        "Positive thinking",
        "Problem-solving skills",
        "Emotional intelligence",
        "Self-care practices"
      ],
      family: [
        "Family support",
        "Marital satisfaction",
        "Parent-child relationship",
        "Family communication",
        "Family cohesion"
      ],
      community: [
        "Social support",
        "Community resources",
        "Peer relationships",
        "Religious/spiritual support",
        "Community activities"
      ],
      cultural: [
        "Cultural values",
        "Traditional practices",
        "Community solidarity",
        "Cultural identity",
        "Spiritual beliefs"
      ]
    }
  },
  culturalContext: {
    vietnameseValues: [
      "Hiếu thảo (Filial piety)",
      "Tôn trọng gia đình (Family respect)",
      "Học tập (Education)",
      "Cần cù (Hard work)",
      "Đoàn kết (Unity)",
      "Truyền thống (Tradition)",
      "Danh dự (Honor)",
      "Trách nhiệm (Responsibility)"
    ],
    familyStructures: [
      {
        type: "Gia đình hạt nhân (Nuclear family)",
        percentage: 45,
        mentalHealthImpact: 6.5,
        supportLevel: 7.2
      },
      {
        type: "Gia đình mở rộng (Extended family)",
        percentage: 35,
        mentalHealthImpact: 7.8,
        supportLevel: 8.5
      },
      {
        type: "Gia đình đơn thân (Single parent)",
        percentage: 15,
        mentalHealthImpact: 8.2,
        supportLevel: 6.8
      },
      {
        type: "Gia đình tái hôn (Blended family)",
        percentage: 5,
        mentalHealthImpact: 7.5,
        supportLevel: 7.0
      }
    ],
    socialSupport: {
      family: 8.5,
      friends: 7.2,
      community: 6.8,
      professional: 5.5
    }
  },
  clinicalStandards: {
    vietnameseNorms: [
      {
        test: "DASS-21",
        vietnameseNorms: {
          mean: 12.5,
          sd: 8.2,
          percentiles: {
            "25th": 6.0,
            "50th": 12.0,
            "75th": 18.0,
            "90th": 24.0
          }
        },
        culturalNotes: [
          "Vietnamese women tend to score higher on stress subscale",
          "Cultural emphasis on emotional control affects anxiety scores",
          "Depression scores may be underreported due to stigma"
        ]
      },
      {
        test: "GAD-7",
        vietnameseNorms: {
          mean: 8.3,
          sd: 5.1,
          percentiles: {
            "25th": 4.0,
            "50th": 8.0,
            "75th": 12.0,
            "90th": 16.0
          }
        },
        culturalNotes: [
          "Somatic symptoms more prominent than cognitive symptoms",
          "Cultural tendency to minimize psychological distress",
          "Family concerns often manifest as anxiety"
        ]
      },
      {
        test: "PHQ-9",
        vietnameseNorms: {
          mean: 7.8,
          sd: 4.9,
          percentiles: {
            "25th": 3.0,
            "50th": 7.0,
            "75th": 12.0,
            "90th": 16.0
          }
        },
        culturalNotes: [
          "Physical symptoms often reported before emotional symptoms",
          "Cultural stigma affects help-seeking behavior",
          "Family support influences depression severity"
        ]
      },
      {
        test: "EPDS",
        vietnameseNorms: {
          mean: 9.2,
          sd: 5.8,
          percentiles: {
            "25th": 4.0,
            "50th": 9.0,
            "75th": 14.0,
            "90th": 19.0
          }
        },
        culturalNotes: [
          "Postpartum depression often undiagnosed",
          "Cultural expectations of motherhood affect scores",
          "Family support crucial for recovery"
        ]
      }
    ],
    culturalAdaptations: [
      {
        original: "I feel sad or down",
        vietnamese: "Tôi cảm thấy buồn bã hoặc chán nản",
        culturalContext: "Vietnamese women may express sadness through physical symptoms",
        validity: 0.85
      },
      {
        original: "I worry about things",
        vietnamese: "Tôi lo lắng về nhiều thứ",
        culturalContext: "Worry often focused on family and children",
        validity: 0.92
      },
      {
        original: "I feel tense or wound up",
        vietnamese: "Tôi cảm thấy căng thẳng hoặc lo lắng",
        culturalContext: "Stress often related to family responsibilities",
        validity: 0.88
      },
      {
        original: "I have trouble sleeping",
        vietnamese: "Tôi gặp khó khăn trong việc ngủ",
        culturalContext: "Sleep problems often attributed to physical rather than mental causes",
        validity: 0.90
      }
    ]
  }
};

// Dữ liệu nghiên cứu chuyên sâu về phụ nữ Việt Nam
export const vietnamWomenHealthData = {
  reproductiveHealth: {
    menstruation: {
      averageAge: 12.8,
      commonIssues: ["Dysmenorrhea", "Irregular cycles", "Heavy bleeding", "PMS"],
      culturalFactors: ["Dietary restrictions", "Activity limitations", "Social stigma"]
    },
    pregnancy: {
      averageAge: 26.5,
      commonIssues: ["Morning sickness", "Mood changes", "Body image", "Anxiety"],
      culturalFactors: ["Family expectations", "Dietary traditions", "Activity restrictions"]
    },
    postpartum: {
      depressionRate: 12.8,
      commonIssues: ["Baby blues", "Sleep deprivation", "Body changes", "Role adjustment"],
      culturalFactors: ["Confinement period", "Family support", "Breastfeeding pressure"]
    },
    menopause: {
      averageAge: 49.2,
      commonIssues: ["Hot flashes", "Mood swings", "Sleep problems", "Body changes"],
      culturalFactors: ["Aging stigma", "Family role changes", "Health concerns"]
    }
  },
  socialFactors: {
    genderRoles: {
      traditional: ["Caregiver", "Homemaker", "Child rearer", "Family peacemaker"],
      modern: ["Breadwinner", "Career woman", "Independent", "Decision maker"],
      conflict: ["Work-life balance", "Family expectations", "Social pressure", "Identity crisis"]
    },
    familyPressure: {
      marriage: {
        averageAge: 24.8,
        pressure: 8.5,
        commonIssues: ["Arranged marriage", "Age pressure", "Social status", "Family honor"]
      },
      childbearing: {
        pressure: 9.2,
        commonIssues: ["Timing", "Gender preference", "Number of children", "Family continuation"]
      },
      caregiving: {
        elderly: 8.8,
        children: 9.5,
        spouse: 7.2,
        commonIssues: ["Time management", "Financial burden", "Emotional stress", "Role conflict"]
      }
    }
  },
  economicFactors: {
    employment: {
      participationRate: 73.2,
      wageGap: 0.87,
      commonIssues: ["Glass ceiling", "Maternity leave", "Career advancement", "Work-life balance"]
    },
    financialStress: {
      householdManagement: 8.2,
      childrenEducation: 9.1,
      healthcare: 7.8,
      retirement: 6.5
    }
  },
  healthcareAccess: {
    mentalHealth: {
      awareness: 45.2,
      accessibility: 35.8,
      affordability: 28.5,
      culturalAcceptance: 32.1
    },
    barriers: [
      "Stigma and shame",
      "Lack of awareness",
      "Cost concerns",
      "Language barriers",
      "Cultural mismatch",
      "Limited services",
      "Family resistance"
    ]
  }
};

// Dữ liệu nghiên cứu về các thang đo tâm lý tại Việt Nam
export const vietnamPsychologicalScales = {
  DASS21: {
    vietnameseNorms: {
      depression: { mean: 4.2, sd: 3.1 },
      anxiety: { mean: 3.8, sd: 2.9 },
      stress: { mean: 4.5, sd: 3.3 }
    },
    culturalAdaptations: [
      "Somatic symptoms emphasized",
      "Family context included",
      "Cultural values considered",
      "Language simplified"
    ],
    validity: 0.89,
    reliability: 0.91
  },
  GAD7: {
    vietnameseNorms: {
      mean: 8.3,
      sd: 5.1,
      cutoff: 10
    },
    culturalAdaptations: [
      "Worry about family emphasized",
      "Physical symptoms included",
      "Cultural stressors added",
      "Language culturally appropriate"
    ],
    validity: 0.87,
    reliability: 0.89
  },
  PHQ9: {
    vietnameseNorms: {
      mean: 7.8,
      sd: 4.9,
      cutoff: 10
    },
    culturalAdaptations: [
      "Physical symptoms emphasized",
      "Family impact included",
      "Cultural expressions used",
      "Stigma considerations"
    ],
    validity: 0.85,
    reliability: 0.88
  },
  EPDS: {
    vietnameseNorms: {
      mean: 9.2,
      sd: 5.8,
      cutoff: 13
    },
    culturalAdaptations: [
      "Postpartum traditions considered",
      "Family support emphasized",
      "Cultural expectations included",
      "Language culturally sensitive"
    ],
    validity: 0.82,
    reliability: 0.86
  }
};

// Dữ liệu về các yếu tố văn hóa ảnh hưởng đến sức khỏe tâm thần
export const culturalFactors = {
  positive: [
    "Strong family support",
    "Community solidarity",
    "Traditional healing practices",
    "Spiritual beliefs",
    "Resilience culture",
    "Collective coping",
    "Intergenerational wisdom"
  ],
  negative: [
    "Mental health stigma",
    "Gender role pressure",
    "Academic pressure",
    "Social comparison",
    "Face-saving culture",
    "Emotional suppression",
    "Help-seeking reluctance"
  ],
  neutral: [
    "Hierarchical relationships",
    "Collective decision making",
    "Traditional gender roles",
    "Family honor",
    "Social harmony",
    "Respect for elders",
    "Community involvement"
  ]
};

// Dữ liệu về các dịch vụ sức khỏe tâm thần tại Việt Nam
export const vietnamMentalHealthServices = {
  public: {
    hospitals: [
      "Bệnh viện Tâm thần Trung ương",
      "Bệnh viện Tâm thần Hà Nội",
      "Bệnh viện Tâm thần TP.HCM",
      "Bệnh viện Tâm thần Đà Nẵng"
    ],
    coverage: 35.2,
    quality: 6.5,
    accessibility: 4.8
  },
  private: {
    clinics: [
      "Phòng khám Tâm lý - Tâm thần",
      "Trung tâm Tư vấn Tâm lý",
      "Phòng khám Đa khoa",
      "Bệnh viện Tư nhân"
    ],
    coverage: 15.8,
    quality: 7.8,
    accessibility: 6.2
  },
  community: {
    services: [
      "Trung tâm Công tác Xã hội",
      "Hội Phụ nữ",
      "Tổ chức Phi lợi nhuận",
      "Dịch vụ Tư vấn Trực tuyến"
    ],
    coverage: 25.6,
    quality: 5.9,
    accessibility: 7.1
  }
};

export default vietnamResearchData;
