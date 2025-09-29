package teacher

import (
	"context"
	"errors"
	"sort"
	"sync"
	"time"
)

// Service exposes analytics endpoints for teachers and provides
// in-memory demo datasets for teaching operations.
type Service struct {
	mu           sync.RWMutex
	courses      []TeacherCourse
	classes      map[string]*TeacherClassDetail
	pendingWorks map[string]TeacherWork
}

// New constructs the teacher service seeded with representative demo data.
func New() *Service {
	courses := demoCourses()
	now := time.Now()

	class1 := &TeacherClassDetail{
		Class: TeacherClassInfo{
			ID:              "class-1",
			Name:            "星际编程一班",
			InviteCode:      "CA-CLASS-1",
			HintLimit:       5,
			StudentCount:    24,
			LevelCount:      18,
			AverageProgress: 58,
			CompletionRate:  45,
		},
		Students: []TeacherStudent{
			{ID: "student-1", Name: "小明", CompletedLevels: 7, TotalLevels: 18, Stars: 18, LastActiveAt: now.Add(-48 * time.Hour).UnixMilli()},
			{ID: "student-2", Name: "小红", CompletedLevels: 5, TotalLevels: 18, Stars: 14, LastActiveAt: now.Add(-5 * 24 * time.Hour).UnixMilli()},
			{ID: "student-3", Name: "小刚", CompletedLevels: 2, TotalLevels: 18, Stars: 3, LastActiveAt: now.Add(-12 * 24 * time.Hour).UnixMilli()},
		},
		Courses: []TeacherCourse{courses[0]},
		RecentActivities: []TeacherActivity{
			{StudentID: "student-1", StudentName: "小明", LevelID: "level-1-2", Stars: 3, CompletedAt: now.Add(-36 * time.Hour).UnixMilli()},
			{StudentID: "student-2", StudentName: "小红", LevelID: "level-1-1", Stars: 2, CompletedAt: now.Add(-72 * time.Hour).UnixMilli()},
		},
		PendingWorks: []TeacherWork{
			{ID: "work-1", Title: "第 2 课编程作业", OwnerID: "student-1", Status: "pending", CreatedAt: now.Add(-30 * time.Hour).UnixMilli(), ClassID: "class-1"},
			{ID: "work-2", Title: "循环应用练习", OwnerID: "student-2", Status: "pending", CreatedAt: now.Add(-28 * time.Hour).UnixMilli(), ClassID: "class-1"},
		},
	}

	class2 := &TeacherClassDetail{
		Class: TeacherClassInfo{
			ID:              "class-2",
			Name:            "火箭编程实验班",
			InviteCode:      "CA-CLASS-2",
			HintLimit:       3,
			StudentCount:    18,
			LevelCount:      12,
			AverageProgress: 64,
			CompletionRate:  52,
		},
		Students: []TeacherStudent{
			{ID: "student-8", Name: "小宇", CompletedLevels: 9, TotalLevels: 12, Stars: 21, LastActiveAt: now.Add(-12 * time.Hour).UnixMilli()},
			{ID: "student-9", Name: "小琴", CompletedLevels: 6, TotalLevels: 12, Stars: 16, LastActiveAt: now.Add(-2 * 24 * time.Hour).UnixMilli()},
		},
		Courses:         []TeacherCourse{courses[0], courses[1]},
		RecentActivities: []TeacherActivity{{StudentID: "student-8", StudentName: "小宇", LevelID: "level-2-1", Stars: 3, CompletedAt: now.Add(-6 * time.Hour).UnixMilli()}},
		PendingWorks:    []TeacherWork{{ID: "work-3", Title: "条件判断小测试", OwnerID: "student-9", Status: "pending", CreatedAt: now.Add(-18 * time.Hour).UnixMilli(), ClassID: "class-2"}},
	}

	classes := map[string]*TeacherClassDetail{
		class1.Class.ID: class1,
		class2.Class.ID: class2,
	}

	pending := make(map[string]TeacherWork)
	for _, detail := range classes {
		for _, work := range detail.PendingWorks {
			pending[work.ID] = work
		}
	}

	return &Service{
		courses:      courses,
		classes:      classes,
		pendingWorks: pending,
	}
}

// Analytics returns aggregated metrics for the requested resource.
func (s *Service) Analytics(ctx context.Context, resource string, query map[string]string) (map[string]any, error) {
	return map[string]any{
		"resource": resource,
		"data":     []any{},
	}, nil
}

// Courses returns all available courses.
func (s *Service) Courses(ctx context.Context) ([]TeacherCourse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return cloneCourses(s.courses), nil
}

// Classes returns class summaries for the logged in teacher.
func (s *Service) Classes(ctx context.Context) ([]TeacherClassSummary, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]TeacherClassSummary, 0, len(s.classes))
	now := time.Now()
	for _, detail := range s.classes {
		active := 0
		for _, student := range detail.Students {
			if student.LastActiveAt == 0 {
				continue
			}
			if now.Sub(time.UnixMilli(student.LastActiveAt)) <= 7*24*time.Hour {
				active++
			}
		}

		courses := make([]TeacherClassSummaryCourse, 0, len(detail.Courses))
		levelCount := 0
		for _, course := range detail.Courses {
			courses = append(courses, TeacherClassSummaryCourse{
				ID:           course.ID,
				Name:         course.Name,
				ChapterCount: len(course.Chapters),
			})
			levelCount += course.LevelCount()
		}

		result = append(result, TeacherClassSummary{
			ID:              detail.Class.ID,
			Name:            detail.Class.Name,
			InviteCode:      detail.Class.InviteCode,
			StudentCount:    detail.Class.StudentCount,
			HintLimit:       detail.Class.HintLimit,
			ActiveStudents:  active,
			AverageProgress: detail.Class.AverageProgress,
			CompletionRate:  detail.Class.CompletionRate,
			CourseCount:     len(detail.Courses),
			LevelCount:      levelCount,
			Courses:         courses,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})
	return result, nil
}

// ClassDetail returns detail for the requested class.
func (s *Service) ClassDetail(ctx context.Context, classID string) (TeacherClassDetail, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	ref, ok := s.classes[classID]
	if !ok {
		return TeacherClassDetail{}, ErrClassNotFound
	}
	return cloneClassDetail(ref), nil
}

// AssignCourseToClass attaches a course to a class if not already present.
func (s *Service) AssignCourseToClass(ctx context.Context, classID, courseID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	classDetail, ok := s.classes[classID]
	if !ok {
		return ErrClassNotFound
	}

	var course *TeacherCourse
	for i := range s.courses {
		if s.courses[i].ID == courseID {
			course = &s.courses[i]
			break
		}
	}
	if course == nil {
		return ErrCourseNotFound
	}

	for _, existing := range classDetail.Courses {
		if existing.ID == courseID {
			return nil
		}
	}

	classDetail.Courses = append(classDetail.Courses, course.Clone())
	classDetail.Class.LevelCount = classDetail.totalLevels()
	return nil
}

// UpdateClassHintLimit updates hint limits for a class.
func (s *Service) UpdateClassHintLimit(ctx context.Context, classID string, hintLimit int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	classDetail, ok := s.classes[classID]
	if !ok {
		return ErrClassNotFound
	}

	if hintLimit < 1 {
		hintLimit = 1
	}
	if hintLimit > 20 {
		hintLimit = 20
	}
	classDetail.Class.HintLimit = hintLimit
	return nil
}

// PendingWorks returns all pending works for the teacher.
func (s *Service) PendingWorks(ctx context.Context) ([]TeacherWork, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	works := make([]TeacherWork, 0, len(s.pendingWorks))
	for _, work := range s.pendingWorks {
		works = append(works, work)
	}
	sort.Slice(works, func(i, j int) bool {
		return works[i].CreatedAt > works[j].CreatedAt
	})
	return works, nil
}

// ReviewWork marks a pending work as reviewed.
func (s *Service) ReviewWork(ctx context.Context, workID, status string) error {
	if status != "approved" && status != "rejected" {
		return ErrUnsupportedStatus
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	work, ok := s.pendingWorks[workID]
	if !ok {
		return ErrWorkNotFound
	}

	delete(s.pendingWorks, workID)
	if classDetail, ok := s.classes[work.ClassID]; ok {
		filtered := classDetail.PendingWorks[:0]
		for _, item := range classDetail.PendingWorks {
			if item.ID != workID {
				filtered = append(filtered, item)
			}
		}
		classDetail.PendingWorks = filtered
	}

	return nil
}

// Errors returned by the service.
var (
	ErrClassNotFound      = errors.New("class not found")
	ErrCourseNotFound     = errors.New("course not found")
	ErrWorkNotFound       = errors.New("work not found")
	ErrUnsupportedStatus  = errors.New("unsupported review status")
)

// TeacherCourse describes a course available to a teacher.
type TeacherCourse struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Chapters    []TeacherCourseChapter `json:"chapters"`
}

// Clone returns a copy of the course.
func (c TeacherCourse) Clone() TeacherCourse {
	clone := TeacherCourse{
		ID:          c.ID,
		Name:        c.Name,
		Description: c.Description,
		Chapters:    make([]TeacherCourseChapter, len(c.Chapters)),
	}
	for i, chapter := range c.Chapters {
		clone.Chapters[i] = chapter.Clone()
	}
	return clone
}

// LevelCount returns total levels inside the course.
func (c TeacherCourse) LevelCount() int {
	count := 0
	for _, chapter := range c.Chapters {
		count += len(chapter.Levels)
	}
	return count
}

// TeacherCourseChapter describes a course chapter.
type TeacherCourseChapter struct {
	ID      string                `json:"id"`
	Title   string                `json:"title"`
	Order   int                   `json:"order"`
	Levels  []TeacherCourseLevel  `json:"levels"`
}

// Clone returns a copy of the chapter.
func (c TeacherCourseChapter) Clone() TeacherCourseChapter {
	clone := TeacherCourseChapter{ID: c.ID, Title: c.Title, Order: c.Order, Levels: make([]TeacherCourseLevel, len(c.Levels))}
	copy(clone.Levels, c.Levels)
	return clone
}

// TeacherCourseLevel describes a level inside a chapter.
type TeacherCourseLevel struct {
	ID     string                       `json:"id"`
	Name   string                       `json:"name"`
	BestSteps int                       `json:"bestSteps"`
	Rewards TeacherCourseLevelReward    `json:"rewards"`
}

// TeacherCourseLevelReward represents reward metadata.
type TeacherCourseLevelReward struct {
	Stars  int     `json:"stars"`
	Outfit *string `json:"outfit"`
}

// TeacherClassInfo summarises a class.
type TeacherClassInfo struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	InviteCode      string `json:"inviteCode"`
	HintLimit       int    `json:"hintLimit"`
	StudentCount    int    `json:"studentCount"`
	LevelCount      int    `json:"levelCount"`
	AverageProgress int    `json:"averageProgress"`
	CompletionRate  int    `json:"completionRate"`
}

// TeacherStudent stores student stats for a class.
type TeacherStudent struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	CompletedLevels int    `json:"completedLevels"`
	TotalLevels     int    `json:"totalLevels"`
	Stars           int    `json:"stars"`
	LastActiveAt    int64  `json:"lastActiveAt"`
}

// TeacherActivity captures recent student activity.
type TeacherActivity struct {
	StudentID   string `json:"studentId"`
	StudentName string `json:"studentName"`
	LevelID     string `json:"levelId"`
	Stars       int    `json:"stars"`
	CompletedAt int64  `json:"completedAt"`
}

// TeacherWork is a pending work item awaiting review.
type TeacherWork struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	OwnerID   string `json:"ownerId"`
	Status    string `json:"status"`
	CreatedAt int64  `json:"createdAt"`
	ClassID   string `json:"classId"`
}

// TeacherClassDetail contains class level data for a teacher.
type TeacherClassDetail struct {
	Class            TeacherClassInfo `json:"class"`
	Students         []TeacherStudent `json:"students"`
	Courses          []TeacherCourse  `json:"courses"`
	RecentActivities []TeacherActivity `json:"recentActivities"`
	PendingWorks     []TeacherWork    `json:"pendingWorks"`
}

func (c *TeacherClassDetail) totalLevels() int {
	levels := 0
	for _, course := range c.Courses {
		levels += course.LevelCount()
	}
	return levels
}

// TeacherClassSummary summarises a class for list view.
type TeacherClassSummary struct {
	ID              string                      `json:"id"`
	Name            string                      `json:"name"`
	InviteCode      string                      `json:"inviteCode"`
	StudentCount    int                         `json:"studentCount"`
	HintLimit       int                         `json:"hintLimit"`
	ActiveStudents  int                         `json:"activeStudents"`
	AverageProgress int                         `json:"averageProgress"`
	CompletionRate  int                         `json:"completionRate"`
	CourseCount     int                         `json:"courseCount"`
	LevelCount      int                         `json:"levelCount"`
	Courses         []TeacherClassSummaryCourse `json:"courses"`
}

// TeacherClassSummaryCourse summarises a course assigned to a class.
type TeacherClassSummaryCourse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	ChapterCount int    `json:"chapterCount"`
}

func cloneCourses(source []TeacherCourse) []TeacherCourse {
	cloned := make([]TeacherCourse, len(source))
	for i, course := range source {
		cloned[i] = course.Clone()
	}
	return cloned
}

func cloneClassDetail(ref *TeacherClassDetail) TeacherClassDetail {
	clone := TeacherClassDetail{
		Class:            ref.Class,
		Students:         make([]TeacherStudent, len(ref.Students)),
		Courses:          make([]TeacherCourse, len(ref.Courses)),
		RecentActivities: make([]TeacherActivity, len(ref.RecentActivities)),
		PendingWorks:     make([]TeacherWork, len(ref.PendingWorks)),
	}
	copy(clone.Students, ref.Students)
	copy(clone.RecentActivities, ref.RecentActivities)
	copy(clone.PendingWorks, ref.PendingWorks)
	for i, course := range ref.Courses {
		clone.Courses[i] = course.Clone()
	}
	return clone
}

func demoCourses() []TeacherCourse {
	loopOutfit := "循环披风"
	return []TeacherCourse{
		{
			ID:          "course-intro",
			Name:        "入门冒险课程",
			Description: "从基础顺序指令到简单循环的启蒙课程",
			Chapters: []TeacherCourseChapter{
				{
					ID:    "course-intro-chapter-1",
					Title: "顺序指令",
					Order: 1,
					Levels: []TeacherCourseLevel{
						{ID: "level-1-1", Name: "第一步", BestSteps: 4, Rewards: TeacherCourseLevelReward{Stars: 3}},
						{ID: "level-1-2", Name: "直角挑战", BestSteps: 6, Rewards: TeacherCourseLevelReward{Stars: 3}},
					},
				},
				{
					ID:    "course-intro-chapter-2",
					Title: "收集与目标",
					Order: 2,
					Levels: []TeacherCourseLevel{
						{ID: "level-1-3", Name: "宝石之路", BestSteps: 8, Rewards: TeacherCourseLevelReward{Stars: 3}},
					},
				},
			},
		},
		{
			ID:          "course-advanced",
			Name:        "进阶循环课程",
			Description: "聚焦循环与条件判断的强化训练",
			Chapters: []TeacherCourseChapter{
				{
					ID:    "course-advanced-chapter-1",
					Title: "循环基础",
					Order: 1,
					Levels: []TeacherCourseLevel{
						{ID: "level-2-1", Name: "重复练习", BestSteps: 6, Rewards: TeacherCourseLevelReward{Stars: 3, Outfit: &loopOutfit}},
					},
				},
				{
					ID:    "course-advanced-chapter-2",
					Title: "条件判断",
					Order: 2,
					Levels: []TeacherCourseLevel{
						{ID: "level-2-2", Name: "分岔路口", BestSteps: 9, Rewards: TeacherCourseLevelReward{Stars: 3}},
					},
				},
			},
		},
	}
}
