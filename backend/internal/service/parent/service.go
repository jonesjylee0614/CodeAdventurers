package parent

import (
	"context"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"
)

// Service exposes parent dashboard capabilities backed by in-memory demo data.
type Service struct {
	mu              sync.RWMutex
	states          map[string]*parentState
	defaultParentID string
}

type parentState struct {
	Settings Settings
	Children map[string]*childState
}

type childState struct {
	Overview      ChildOverview
	WeeklyReport  WeeklyReport
	ProgressItems []ProgressRecord
}

// Settings represents parent notification preferences.
type Settings struct {
	ReminderTime    string   `json:"reminderTime"`
	WeeklyReportDay string   `json:"weeklyReportDay"`
	NotifyChannels  []string `json:"notifyChannels"`
}

// SettingsUpdate updates parent preferences.
type SettingsUpdate struct {
	ReminderTime    *string
	WeeklyReportDay *string
	NotifyChannels  []string
}

// Overview aggregates child summaries and parent settings.
type Overview struct {
	Children []ChildOverview `json:"children"`
	Settings Settings        `json:"settings"`
}

// ChildOverview summarises a child for overview screens.
type ChildOverview struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	ClassID         string        `json:"classId"`
	CompletedLevels int           `json:"completedLevels"`
	TotalDuration   int           `json:"totalDuration"`
	LastActiveAt    int64         `json:"lastActiveAt"`
	WeeklyReport    *WeeklyReport `json:"weeklyReport,omitempty"`
}

// ChildSummary is a lightweight representation used in pickers.
type ChildSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// WeeklyReport summarises learning progress for a child.
type WeeklyReport struct {
	ChildID         string   `json:"childId"`
	GeneratedAt     int64    `json:"generatedAt"`
	Summary         string   `json:"summary"`
	ConceptsLearned []string `json:"conceptsLearned"`
	CommonMistakes  []string `json:"commonMistakes"`
	Recommendations []string `json:"recommendations"`
}

// ProgressRecord stores historical completion data for a child.
type ProgressRecord struct {
	LevelID        string        `json:"levelId"`
	Stars          int           `json:"stars"`
	Steps          int           `json:"steps"`
	Hints          int           `json:"hints"`
	Duration       int           `json:"duration"`
	BestDifference int           `json:"bestDifference"`
	CompletedAt    int64         `json:"completedAt"`
	ReplayLog      []interface{} `json:"replayLog,omitempty"`
}

var (
	// ErrParentNotFound indicates the requested parent data does not exist.
	ErrParentNotFound = errors.New("parent profile not found")
	// ErrChildNotFound indicates the requested child data cannot be located.
	ErrChildNotFound = errors.New("child profile not found")
)

// New constructs the parent service with demo data aligned to the frontend expectations.
func New() *Service {
	now := time.Now()
	firstWeekReport := WeeklyReport{
		ChildID:         "student-1",
		GeneratedAt:     now.Add(-24 * time.Hour).UnixMilli(),
		Summary:         "小明本周保持了稳步的练习节奏，开始接触循环与条件判断。",
		ConceptsLearned: []string{"顺序执行", "基础循环"},
		CommonMistakes:  []string{"忘记在终点前转向", "循环次数设置过多"},
		Recommendations: []string{"多尝试使用条件积木优化路径", "挑战循环岛屿章节的第二关"},
	}

	state := &parentState{
		Settings: Settings{
			ReminderTime:    "19:30",
			WeeklyReportDay: "friday",
			NotifyChannels:  []string{"app", "email"},
		},
		Children: map[string]*childState{
			"student-1": {
				Overview: ChildOverview{
					ID:              "student-1",
					Name:            "小明",
					ClassID:         "class-1",
					CompletedLevels: 7,
					TotalDuration:   5400,
					LastActiveAt:    now.Add(-4 * time.Hour).UnixMilli(),
				},
				WeeklyReport: firstWeekReport,
				ProgressItems: []ProgressRecord{
					{LevelID: "level-1-3", Stars: 3, Steps: 14, Hints: 0, Duration: 420, BestDifference: 2, CompletedAt: now.Add(-20 * time.Hour).UnixMilli()},
					{LevelID: "level-2-1", Stars: 2, Steps: 18, Hints: 1, Duration: 510, BestDifference: 5, CompletedAt: now.Add(-48 * time.Hour).UnixMilli()},
				},
			},
			"student-2": {
				Overview: ChildOverview{
					ID:              "student-2",
					Name:            "小红",
					ClassID:         "class-1",
					CompletedLevels: 5,
					TotalDuration:   3600,
					LastActiveAt:    now.Add(-3 * 24 * time.Hour).UnixMilli(),
				},
				WeeklyReport: WeeklyReport{
					ChildID:         "student-2",
					GeneratedAt:     now.Add(-3 * 24 * time.Hour).UnixMilli(),
					Summary:         "小红完成了首章所有课程，需要更多练习提高星级。",
					ConceptsLearned: []string{"转向判断"},
					CommonMistakes:  []string{"部分关卡未使用提示导致重复错误"},
					Recommendations: []string{"使用提示功能了解最佳路径", "尝试重温直角挑战关卡"},
				},
				ProgressItems: []ProgressRecord{
					{LevelID: "level-1-2", Stars: 2, Steps: 15, Hints: 0, Duration: 380, BestDifference: 4, CompletedAt: now.Add(-6 * 24 * time.Hour).UnixMilli()},
				},
			},
		},
	}

	// attach weekly report references to overview
	for _, child := range state.Children {
		report := child.WeeklyReport
		child.Overview.WeeklyReport = &report
	}

	return &Service{
		states: map[string]*parentState{
			"parent-1":    state,
			"parent-demo": state,
		},
		defaultParentID: "parent-demo",
	}
}

// Overview returns the parent dashboard overview.
func (s *Service) Overview(ctx context.Context, parentID string) (Overview, error) {
	state, err := s.parentState(parentID)
	if err != nil {
		return Overview{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	children := make([]ChildOverview, 0, len(state.Children))
	for _, child := range state.Children {
		clone := child.Overview
		if child.WeeklyReport.ChildID != "" {
			report := child.WeeklyReport
			clone.WeeklyReport = &report
		}
		children = append(children, clone)
	}

	sort.Slice(children, func(i, j int) bool { return strings.Compare(children[i].Name, children[j].Name) < 0 })

	return Overview{Children: children, Settings: state.Settings}, nil
}

// Children returns the list of children managed by the parent.
func (s *Service) Children(ctx context.Context, parentID string) ([]ChildSummary, error) {
	state, err := s.parentState(parentID)
	if err != nil {
		return nil, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	children := make([]ChildSummary, 0, len(state.Children))
	for _, child := range state.Children {
		children = append(children, ChildSummary{ID: child.Overview.ID, Name: child.Overview.Name})
	}
	sort.Slice(children, func(i, j int) bool { return strings.Compare(children[i].Name, children[j].Name) < 0 })
	return children, nil
}

// WeeklyReport returns the latest weekly report for the child.
func (s *Service) WeeklyReport(ctx context.Context, parentID, childID string) (WeeklyReport, error) {
	child, err := s.childState(parentID, childID)
	if err != nil {
		return WeeklyReport{}, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return child.WeeklyReport, nil
}

// Progress returns the historical progress for a child.
func (s *Service) Progress(ctx context.Context, parentID, childID string) ([]ProgressRecord, error) {
	child, err := s.childState(parentID, childID)
	if err != nil {
		return nil, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()

	progress := make([]ProgressRecord, len(child.ProgressItems))
	copy(progress, child.ProgressItems)
	sort.Slice(progress, func(i, j int) bool { return progress[i].CompletedAt > progress[j].CompletedAt })
	return progress, nil
}

// Settings returns the notification preferences for the parent.
func (s *Service) Settings(ctx context.Context, parentID string) (Settings, error) {
	state, err := s.parentState(parentID)
	if err != nil {
		return Settings{}, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return state.Settings, nil
}

// UpdateSettings updates parent notification preferences.
func (s *Service) UpdateSettings(ctx context.Context, parentID string, update SettingsUpdate) (Settings, error) {
	state, err := s.parentState(parentID)
	if err != nil {
		return Settings{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if update.ReminderTime != nil {
		trimmed := strings.TrimSpace(*update.ReminderTime)
		if trimmed != "" {
			state.Settings.ReminderTime = trimmed
		}
	}
	if update.WeeklyReportDay != nil {
		trimmed := strings.ToLower(strings.TrimSpace(*update.WeeklyReportDay))
		if trimmed != "" {
			state.Settings.WeeklyReportDay = trimmed
		}
	}
	if update.NotifyChannels != nil {
		unique := dedupeStrings(update.NotifyChannels)
		if len(unique) > 0 {
			state.Settings.NotifyChannels = unique
		}
	}

	return state.Settings, nil
}

func (s *Service) parentState(parentID string) (*parentState, error) {
	id := parentID
	if strings.TrimSpace(id) == "" {
		id = s.defaultParentID
	}

	s.mu.RLock()
	state, ok := s.states[id]
	s.mu.RUnlock()
	if ok {
		return state, nil
	}

	if id != s.defaultParentID {
		return nil, ErrParentNotFound
	}

	return nil, ErrParentNotFound
}

func (s *Service) childState(parentID, childID string) (*childState, error) {
	state, err := s.parentState(parentID)
	if err != nil {
		return nil, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	child, ok := state.Children[childID]
	if !ok {
		return nil, ErrChildNotFound
	}
	return child, nil
}

func dedupeStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(strings.ToLower(value))
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}
