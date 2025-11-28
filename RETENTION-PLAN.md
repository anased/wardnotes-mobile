# User Retention & Habit Formation: Quick Wins Plan

## Context

**User Goal:** Improve overall app engagement (notes + flashcards) and feel "urged" to use the app daily

**Constraints:**
- Focus on quick wins (1-2 weeks implementation)
- Prefer goal-setting & milestones over pure gamification
- Target both note-taking and flashcard studying

**Current Strengths:**
- ✅ Note creation streak system
- ✅ Activity tracking (daily_activity table)
- ✅ Spaced repetition (SM-2 algorithm)
- ✅ Push notifications (mobile)
- ✅ Activity visualization (charts, heatmaps)

**Key Gap:** Flashcard studying doesn't contribute to streaks or feel rewarding

---

## Recommended Quick Wins (Priority Order)

### 1. **Unified Activity Streak** ⭐ HIGHEST PRIORITY
**Effort:** 6-8 hours | **Impact:** High

**Current Problem:**
- Streak only counts note creation
- Users can ignore flashcard studying without breaking streak
- No incentive to study daily

**Solution:**
Expand existing streak to count BOTH activities:
- Creating a note = maintains streak ✅
- Studying flashcards (any amount) = maintains streak ✅
- Either activity keeps the streak alive

**Implementation:**
```typescript
// Database: Modify daily_activity tracking
// Current: Only tracks notes_count
// New: Track both notes_count AND cards_studied

daily_activity: {
  notes_count: number;      // existing
  cards_studied: number;    // NEW
  streak_days: number;
  has_activity: boolean;    // NEW: true if notes OR cards
}

// Update streak logic to check has_activity instead of just notes_count
```

**UI Changes:**
- Dashboard: "7-day activity streak 🔥" (not "note streak")
- Tooltip: "Create a note or study flashcards to maintain your streak"
- Learning tracker: Show combined activity in calendar heatmap

**Why This Works:**
- Research: Duolingo's streaks increase commitment by 60%
- Leverages existing infrastructure
- Applies to all user types (note-takers, studiers, or both)

**Files to Modify:**
- `src/lib/hooks/useDailyActivity.ts` - Update streak calculation
- `src/services/flashcard.ts` - Track cards studied in daily_activity
- `src/components/activity-tracker/StreakDisplay.tsx` - Update messaging
- Mobile: `src/screens/learning-tracker/LearningTrackerScreen.tsx`

---

### 2. **Weekly Activity Goals** ⭐ HIGH PRIORITY
**Effort:** 6-8 hours | **Impact:** High

**What It Does:**
- Let users set weekly targets: "Study 50 cards + Create 5 notes this week"
- Progress ring/bar showing completion
- Notification: "You're 80% to your weekly goal!"
- Completion celebration: "🎉 Goal achieved! You studied 63 cards and created 7 notes"

**Implementation:**
```typescript
// New table: user_goals
user_goals: {
  user_id: string;
  goal_type: 'weekly' | 'monthly';
  target_cards: number;      // e.g., 50
  target_notes: number;      // e.g., 5
  current_cards: number;
  current_notes: number;
  week_start: string;
  status: 'active' | 'completed' | 'missed';
}

// Weekly reset logic (runs on Mondays)
// Completion check and celebration
```

**UI Components:**
- Dashboard widget: Circular progress ring with percentages
- Goal setting modal: Sliders for cards/notes targets
- Weekly summary notification

**Why This Works:**
- Research: Combining daily streaks + weekly goals = dual motivation
- Self-set goals increase autonomy (intrinsic motivation)
- Clear, achievable targets

**Files to Create/Modify:**
- `src/components/goals/WeeklyGoalWidget.tsx` - NEW
- `src/components/goals/GoalSettingModal.tsx` - NEW
- `src/lib/hooks/useWeeklyGoals.ts` - NEW
- Dashboard: Add goal widget

---

### 3. **Quick Study Button & Session Summary**
**Effort:** 4-6 hours | **Impact:** Medium-High

**What It Does:**
- Prominent "Start Studying" button on dashboard/home
- Shows: "12 cards due (5 min)"
- One tap → auto-loads due cards across all decks
- Post-session summary:
  ```
  Session Complete! ✨

  📊 12 cards reviewed
  ✅ 83% accuracy
  ⏱️ 6 minutes
  🔥 Streak: 8 days

  [Done] [Study More]
  ```

**Implementation:**
- Service method: `getQuickStudySession()` - Returns all due cards
- New screen: `QuickStudySession.tsx` - Minimal study interface
- Summary modal: `StudySessionSummary.tsx` - Stats + celebration

**Why This Works:**
- Research: "Make it easy" = more likely to do (Fogg Behavior Model)
- Removes decision fatigue (no deck selection)
- Instant gratification with stats

**Files to Create/Modify:**
- `src/components/flashcards/QuickStudyButton.tsx` - NEW
- `src/screens/flashcards/QuickStudySession.tsx` - NEW (mobile)
- `src/components/flashcards/SessionSummary.tsx` - NEW
- Dashboard: Add prominent button

---

### 4. **Milestone Badges (Simple)**
**Effort:** 4-5 hours | **Impact:** Medium

**What It Does:**
- Celebrate streak milestones with badge notifications
- Badges:
  - 🔥 "First Week" - 7-day streak
  - 💪 "Committed" - 14-day streak
  - 🏆 "Study Champion" - 30-day streak
  - 👑 "Unstoppable" - 60-day streak
- Show on profile page
- Toast notification when earned: "Achievement Unlocked! 🏆 30-day streak"

**Implementation:**
```typescript
// Table: user_badges
user_badges: {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge_type: 'streak_7' | 'streak_14' | 'streak_30' | 'streak_60';
}

// Check for new badges after each activity update
// Show celebration modal/toast
```

**Why This Works:**
- Research: Badges boost completion rates by 30%
- Low overhead, high psychological impact
- Medical students respond well to achievements

**Files to Create/Modify:**
- `src/components/badges/BadgeDisplay.tsx` - NEW
- `src/lib/hooks/useBadges.ts` - NEW
- Profile page: Display earned badges
- Achievement notification logic

---

### 5. **Improved Notifications (Mobile)**
**Effort:** 3-4 hours | **Impact:** Medium

**What It Does:**
- Make notifications more actionable and personalized
- Current: "Don't forget to study!" (generic)
- New: "12 flashcards due today. Keep your 5-day streak! 🔥"
- Tapping notification → Opens quick study session directly

**Enhanced Content:**
- **Evening (7-8pm):** "You have 12 cards due. 5 min study keeps your streak alive!"
- **Streak at risk (9pm):** "Don't break your 15-day streak! Quick review now?"
- **Goal progress (Friday):** "Almost there! 8 more cards to hit your weekly goal"
- **Celebration (after completion):** "🎉 Weekly goal achieved! Amazing work"

**Implementation:**
- Update notification service with dynamic content templates
- Pass streak count and due cards to notification
- Deep link to quick study session

**Why This Works:**
- Research: 65% of users return within 30 days after notification
- Behavioral triggers more effective than scheduled
- Personalization increases engagement

**Files to Modify:**
- Mobile: `src/services/notifications/notificationService.ts`
- Add deep linking to study session
- Dynamic content based on user state

---

## Implementation Roadmap (1-2 Weeks)

### Week 1: Foundation
**Days 1-2:** Unified Activity Streak
- Modify daily_activity tracking
- Update streak calculation logic
- Update UI messaging

**Days 3-4:** Weekly Goals System
- Create database table
- Build goal setting modal
- Add dashboard widget

**Day 5:** Quick Study Button
- Create quick study service method
- Add dashboard button
- Build minimal study interface

### Week 2: Polish & Engagement
**Days 6-7:** Session Summary & Milestones
- Build post-session summary modal
- Implement milestone badge system
- Add celebration animations

**Days 8-9:** Notification Improvements
- Update notification templates
- Add deep linking
- Test notification timing

**Day 10:** Testing & Refinement
- Cross-platform testing
- User feedback
- Bug fixes

---

## Database Schema Changes

### Modify Existing Table
```sql
-- daily_activity table
ALTER TABLE daily_activity
ADD COLUMN cards_studied INTEGER DEFAULT 0,
ADD COLUMN has_activity BOOLEAN GENERATED ALWAYS AS (notes_count > 0 OR cards_studied > 0) STORED;
```

### New Tables
```sql
-- user_goals table
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR(20) NOT NULL, -- 'weekly' or 'monthly'
  target_cards INTEGER NOT NULL,
  target_notes INTEGER NOT NULL,
  current_cards INTEGER DEFAULT 0,
  current_notes INTEGER DEFAULT 0,
  week_start DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'missed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_badges table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL, -- 'streak_7', 'streak_30', etc.
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

### RLS Policies (Supabase)
```sql
-- user_goals RLS
CREATE POLICY "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- user_badges RLS
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Success Metrics to Track

### Engagement Metrics
- **Daily Active Users (DAU)** - Target: +20% in 30 days
- **Session Frequency** - Target: 5-7 days/week average
- **Cards Studied per Week** - Target: +30% increase

### Retention Metrics
- **Day 7 Retention** - Track before/after implementation
- **Day 30 Retention** - Primary success metric
- **Streak Distribution** - % of users with 7+, 14+, 30+ day streaks

### Feature Adoption
- **% Users with Active Streaks** - Target: 60%+
- **% Users Setting Weekly Goals** - Target: 40%+
- **Quick Study Button Usage** - Track click-through rate
- **Notification Engagement** - Open rate, time to action

---

## Why This Plan Works

### Addresses Root Cause
- Current problem: Only note creation rewarded
- Solution: Reward both notes AND studying

### Leverages Existing Infrastructure
- Builds on daily_activity table
- Uses existing notification system
- Extends current streak mechanism

### Research-Backed
- Streaks: +60% commitment (Duolingo)
- Goals: Dual motivation (daily + weekly)
- Quick actions: Reduces friction (Fogg Model)
- Badges: +30% completion rates

### Fits Constraints
- All features achievable in 1-2 weeks
- Focus on goal-setting over gamification
- Improves overall engagement (not just one area)

---

## Critical Files Reference

### Web App
- `src/lib/hooks/useDailyActivity.ts` - Activity tracking
- `src/services/flashcard.ts` - Flashcard service
- `src/components/activity-tracker/StreakDisplay.tsx` - Streak UI
- `src/app/dashboard/page.tsx` - Dashboard
- `src/app/learning-tracker/page.tsx` - Learning tracker

### Mobile App
- `src/screens/learning-tracker/LearningTrackerScreen.tsx` - Activity screen
- `src/services/notifications/notificationService.ts` - Notifications
- `src/screens/flashcards/FlashcardDashboard.tsx` - Flashcard home
- `src/hooks/useFlashcards.ts` - Flashcard hooks

### Shared
- Database: `daily_activity`, `user_goals` (NEW), `user_badges` (NEW) tables
- Supabase RLS policies for new tables

---

## Research Sources

### Key Findings
1. **Duolingo's streak system increases commitment by 60%** - Users who maintain 7+ day streaks are 3.6x more likely to stay engaged long-term
2. **Streak Freeze reduced Duolingo's churn by 21%** - Loss aversion protection for at-risk users
3. **Badges boost completion rates by 30%** - Visual achievements tap into completion bias
4. **65% of users return within 30 days after notification** - Well-timed push notifications drive engagement
5. **Medical students prefer instant feedback and engaging tools** - Convenience and accessibility are key

### Behavioral Psychology Principles Applied
- **BJ Fogg's Behavior Model:** Motivation × Ability × Prompt = Behavior
- **Atomic Habits:** Cue → Craving → Response → Reward
- **Loss Aversion:** Streaks create psychological investment
- **Intrinsic Motivation:** Autonomy, Competence, Relatedness

---

## Next Steps

1. **Capture baseline metrics** - Track current DAU, retention, and study frequency
2. **Set up analytics** - Ensure tracking for all new features
3. **Start with Feature #1** - Unified activity streak (highest impact)
4. **Test incrementally** - Deploy and validate each feature before moving to next
5. **Gather user feedback** - Survey users on motivation and engagement
6. **Iterate based on data** - Adjust features based on actual usage patterns

---

## Future Enhancements (Beyond Quick Wins)

If these features succeed, consider:
- **Exam countdown & goal setting** - Link goals to specific exam dates
- **XP & levels system** - Gamified progression (Intern → Resident → Attending)
- **Social features** - Study groups, leaderboards, shared decks
- **Adaptive study coach** - AI recommendations based on performance
- **Streak recovery** - Allow "streak repair" with points/currency

---

This plan provides a focused, research-backed approach to dramatically improving user retention and habit formation within a 1-2 week timeline.