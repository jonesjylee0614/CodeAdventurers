package mysql

import "gorm.io/gorm"

// Repositories holds all repository instances
type Repositories struct {
	User              *UserRepository
	Student           *StudentRepository
	Teacher           *TeacherRepository
	Parent            *ParentRepository
	Progress          *ProgressRepository
	Course            *CourseRepository
	Chapter           *ChapterRepository
	Level             *LevelRepository
	Class             *ClassRepository
	SandboxProject    *SandboxProjectRepository
	WorkSubmission    *WorkSubmissionRepository
	CompendiumEntry   *CompendiumEntryRepository
	WeeklyReport      *WeeklyReportRepository
}

// NewRepositories creates all repository instances with GORM
func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		User:              NewUserRepository(db),
		Student:           NewStudentRepository(db),
		Teacher:           NewTeacherRepository(db),
		Parent:            NewParentRepository(db),
		Progress:          NewProgressRepository(db),
		Course:            NewCourseRepository(db),
		Chapter:           NewChapterRepository(db),
		Level:             NewLevelRepository(db),
		Class:             NewClassRepository(db),
		SandboxProject:    NewSandboxProjectRepository(db),
		WorkSubmission:    NewWorkSubmissionRepository(db),
		CompendiumEntry:   NewCompendiumEntryRepository(db),
		WeeklyReport:      NewWeeklyReportRepository(db),
	}
}