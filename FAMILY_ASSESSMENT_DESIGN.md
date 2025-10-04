/**
 * SOULFRIEND V2.0 - Family Assessment System
 * International Scientific Conference on Mental Health Care for Women and Families
 * 
 * Family Assessment Framework Design Document
 * Date: September 2025
 * Version: 2.0
 */

export interface FamilyAssessmentFramework {
  // 1. FAMILY APGAR - Family Functioning Assessment
  familyAPGAR: {
    name: "Family APGAR Scale";
    description: "Đánh giá 5 chức năng cơ bản của gia đình";
    domains: [
      "Adaptation (Thích ứng)",      // How family adapts to stress
      "Partnership (Hợp tác)",       // How family makes decisions  
      "Growth (Phát triển)",         // How family supports individual growth
      "Affection (Tình cảm)",       // How family expresses emotions
      "Resolve (Giải quyết)"         // How family commits to each other
    ];
    questions: 5;
    scoring: "0-2 scale per question, total 0-10";
    interpretation: {
      highly_functional: "8-10 points";
      moderately_dysfunctional: "4-7 points"; 
      severely_dysfunctional: "0-3 points";
    };
  };

  // 2. FAMILY RELATIONSHIP INDEX - Relationship Quality
  familyRelationshipIndex: {
    name: "Family Relationship Index (FRI)";
    description: "Đánh giá chất lượng mối quan hệ trong gia đình";
    domains: [
      "Communication (Giao tiếp)",         // Open communication patterns
      "Conflict Resolution (Giải quyết xung đột)", // How conflicts are handled
      "Emotional Support (Hỗ trợ cảm xúc)", // Emotional availability
      "Shared Activities (Hoạt động chung)", // Family bonding time
      "Respect & Trust (Tôn trọng & Tin tưởng)" // Mutual respect
    ];
    questions: 20; // 4 questions per domain
    scoring: "1-5 Likert scale, total 20-100";
    interpretation: {
      excellent: "80-100 points";
      good: "60-79 points";
      fair: "40-59 points";
      poor: "20-39 points";
    };
  };

  // 3. PARENTAL STRESS SCALE - For parents in family
  parentalStressScale: {
    name: "Parental Stress Scale (PSS)";
    description: "Đánh giá mức độ stress trong vai trò làm cha mẹ";
    domains: [
      "Parental Rewards (Phần thưởng)",     // Positive aspects of parenting
      "Parental Stressors (Căng thẳng)",    // Negative aspects of parenting
      "Lack of Control (Mất kiểm soát)",    // Feeling overwhelmed
      "Parental Satisfaction (Hài lòng)"    // Overall satisfaction
    ];
    questions: 18; // Mixed positive and negative items
    scoring: "1-5 Likert scale, reverse scoring for positive items";
    interpretation: {
      low_stress: "18-54 points";
      moderate_stress: "55-72 points";
      high_stress: "73-90 points";
    };
  };

  // 4. VIETNAMESE CULTURAL ADAPTATIONS
  culturalAdaptations: {
    collectivistic_values: "Emphasis on family harmony over individual needs";
    extended_family: "Include grandparents, aunts/uncles in family dynamics";
    filial_piety: "Respect for elders and hierarchical relationships";
    saving_face: "Importance of family reputation and social standing";
    gender_roles: "Traditional vs modern gender expectations";
    economic_stress: "Financial pressures on Vietnamese families";
  };

  // 5. MULTI-MEMBER SCREENING SYSTEM
  multiMemberSystem: {
    family_roster: "Add family members with roles (parent, child, grandparent)";
    individual_assessments: "Each member takes relevant assessments";
    family_comparison: "Compare results across family members";
    family_dashboard: "Holistic view of family mental health";
    recommendations: "Family-level interventions and resources";
  };
}

/**
 * FAMILY ASSESSMENT CATEGORIES FOR SOULFRIEND V2.0
 */
export const FamilyAssessmentCategories = {
  FAMILY_FUNCTIONING: {
    icon: "👨‍👩‍👧‍👦",
    title: "Chức năng Gia đình",
    description: "Đánh giá hoạt động và sức khỏe tổng thể của gia đình",
    color: "#2e7d32", // Family green
    tests: ["FAMILY_APGAR"]
  },
  
  FAMILY_RELATIONSHIPS: {
    icon: "💞",
    title: "Mối quan hệ Gia đình", 
    description: "Đánh giá chất lượng mối quan hệ giữa các thành viên",
    color: "#7b1fa2", // Relationship purple
    tests: ["FAMILY_RELATIONSHIP_INDEX"]
  },
  
  PARENTAL_WELLBEING: {
    icon: "👨‍👩‍👧",
    title: "Sức khỏe Tâm lý Cha mẹ",
    description: "Đánh giá stress và sức khỏe tâm lý của cha mẹ",
    color: "#d32f2f", // Parent stress red
    tests: ["PARENTAL_STRESS_SCALE"]
  }
};

/**
 * TARGET DEMOGRAPHICS - Conference Focus
 */
export const ConferenceDemographics = {
  primary_target: "Vietnamese women aged 18-65 with families";
  secondary_target: "Family members (spouses, children 12+, elderly parents)";
  clinical_focus: "Women's mental health in family context";
  cultural_context: "Vietnamese family values and collectivistic culture";
  interdisciplinary_approach: "Psychology, social work, family therapy, public health";
};