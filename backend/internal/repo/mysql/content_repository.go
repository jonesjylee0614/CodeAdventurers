package mysql

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrSandboxProjectNotFound   = errors.New("sandbox project not found")
	ErrWorkSubmissionNotFound   = errors.New("work submission not found")
	ErrCompendiumEntryNotFound  = errors.New("compendium entry not found")
	ErrWeeklyReportNotFound     = errors.New("weekly report not found")
)

// SandboxProjectRepository handles sandbox project operations using GORM
type SandboxProjectRepository struct {
	db *gorm.DB
}

// NewSandboxProjectRepository creates a new sandbox project repository
func NewSandboxProjectRepository(db *gorm.DB) *SandboxProjectRepository {
	return &SandboxProjectRepository{db: db}
}

// FindByID retrieves a sandbox project by ID
func (r *SandboxProjectRepository) FindByID(ctx context.Context, id string) (*SandboxProject, error) {
	var project SandboxProject
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&project).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSandboxProjectNotFound
	}
	return &project, err
}

// FindByStudentID retrieves all sandbox projects for a student
func (r *SandboxProjectRepository) FindByStudentID(ctx context.Context, studentID string) ([]SandboxProject, error) {
	var projects []SandboxProject
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("updated_at DESC").
		Find(&projects).Error
	return projects, err
}

// FindPublicProjects retrieves all public sandbox projects
func (r *SandboxProjectRepository) FindPublicProjects(ctx context.Context, limit int) ([]SandboxProject, error) {
	var projects []SandboxProject
	query := r.db.WithContext(ctx).
		Where("is_public = ?", true).
		Order("created_at DESC")
	
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	err := query.Find(&projects).Error
	return projects, err
}

// Create creates a new sandbox project
func (r *SandboxProjectRepository) Create(ctx context.Context, project *SandboxProject) error {
	return r.db.WithContext(ctx).Create(project).Error
}

// Update updates an existing sandbox project
func (r *SandboxProjectRepository) Update(ctx context.Context, project *SandboxProject) error {
	result := r.db.WithContext(ctx).Model(project).Updates(project)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrSandboxProjectNotFound
	}
	return nil
}

// Delete deletes a sandbox project
func (r *SandboxProjectRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&SandboxProject{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrSandboxProjectNotFound
	}
	return nil
}

// WorkSubmissionRepository handles work submission operations using GORM
type WorkSubmissionRepository struct {
	db *gorm.DB
}

// NewWorkSubmissionRepository creates a new work submission repository
func NewWorkSubmissionRepository(db *gorm.DB) *WorkSubmissionRepository {
	return &WorkSubmissionRepository{db: db}
}

// FindByID retrieves a work submission by ID
func (r *WorkSubmissionRepository) FindByID(ctx context.Context, id string) (*WorkSubmission, error) {
	var submission WorkSubmission
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&submission).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrWorkSubmissionNotFound
	}
	return &submission, err
}

// FindByStudentID retrieves all submissions for a student
func (r *WorkSubmissionRepository) FindByStudentID(ctx context.Context, studentID string) ([]WorkSubmission, error) {
	var submissions []WorkSubmission
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("submitted_at DESC").
		Find(&submissions).Error
	return submissions, err
}

// FindByClassID retrieves all submissions for a class
func (r *WorkSubmissionRepository) FindByClassID(ctx context.Context, classID string) ([]WorkSubmission, error) {
	var submissions []WorkSubmission
	err := r.db.WithContext(ctx).
		Where("class_id = ?", classID).
		Order("submitted_at DESC").
		Find(&submissions).Error
	return submissions, err
}

// FindPendingByClassID retrieves all pending submissions for a class
func (r *WorkSubmissionRepository) FindPendingByClassID(ctx context.Context, classID string) ([]WorkSubmission, error) {
	var submissions []WorkSubmission
	err := r.db.WithContext(ctx).
		Where("class_id = ? AND status = ?", classID, "pending").
		Order("submitted_at DESC").
		Find(&submissions).Error
	return submissions, err
}

// Create creates a new work submission
func (r *WorkSubmissionRepository) Create(ctx context.Context, submission *WorkSubmission) error {
	return r.db.WithContext(ctx).Create(submission).Error
}

// UpdateStatus updates the status of a submission
func (r *WorkSubmissionRepository) UpdateStatus(ctx context.Context, id, status, feedback string) error {
	updates := map[string]interface{}{
		"status":           status,
		"teacher_feedback": feedback,
	}
	
	if status == "approved" || status == "rejected" {
		updates["reviewed_at"] = gorm.Expr("NOW()")
	}
	
	result := r.db.WithContext(ctx).Model(&WorkSubmission{}).
		Where("id = ?", id).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkSubmissionNotFound
	}
	return nil
}

// Delete deletes a work submission
func (r *WorkSubmissionRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&WorkSubmission{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkSubmissionNotFound
	}
	return nil
}

// CompendiumEntryRepository handles compendium entry operations using GORM
type CompendiumEntryRepository struct {
	db *gorm.DB
}

// NewCompendiumEntryRepository creates a new compendium entry repository
func NewCompendiumEntryRepository(db *gorm.DB) *CompendiumEntryRepository {
	return &CompendiumEntryRepository{db: db}
}

// FindByID retrieves a compendium entry by ID
func (r *CompendiumEntryRepository) FindByID(ctx context.Context, id string) (*CompendiumEntry, error) {
	var entry CompendiumEntry
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&entry).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCompendiumEntryNotFound
	}
	return &entry, err
}

// FindAll retrieves all compendium entries
func (r *CompendiumEntryRepository) FindAll(ctx context.Context) ([]CompendiumEntry, error) {
	var entries []CompendiumEntry
	err := r.db.WithContext(ctx).
		Order("created_at").
		Find(&entries).Error
	return entries, err
}

// FindByChapterID retrieves all compendium entries for a chapter
func (r *CompendiumEntryRepository) FindByChapterID(ctx context.Context, chapterID string) ([]CompendiumEntry, error) {
	var entries []CompendiumEntry
	err := r.db.WithContext(ctx).
		Where("chapter_id = ?", chapterID).
		Order("created_at").
		Find(&entries).Error
	return entries, err
}

// Create creates a new compendium entry
func (r *CompendiumEntryRepository) Create(ctx context.Context, entry *CompendiumEntry) error {
	return r.db.WithContext(ctx).Create(entry).Error
}

// Update updates an existing compendium entry
func (r *CompendiumEntryRepository) Update(ctx context.Context, entry *CompendiumEntry) error {
	result := r.db.WithContext(ctx).Model(entry).Updates(entry)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCompendiumEntryNotFound
	}
	return nil
}

// Delete deletes a compendium entry
func (r *CompendiumEntryRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&CompendiumEntry{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCompendiumEntryNotFound
	}
	return nil
}

// WeeklyReportRepository handles weekly report operations using GORM
type WeeklyReportRepository struct {
	db *gorm.DB
}

// NewWeeklyReportRepository creates a new weekly report repository
func NewWeeklyReportRepository(db *gorm.DB) *WeeklyReportRepository {
	return &WeeklyReportRepository{db: db}
}

// FindByID retrieves a weekly report by ID
func (r *WeeklyReportRepository) FindByID(ctx context.Context, id string) (*WeeklyReport, error) {
	var report WeeklyReport
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&report).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrWeeklyReportNotFound
	}
	return &report, err
}

// FindByStudentID retrieves all weekly reports for a student
func (r *WeeklyReportRepository) FindByStudentID(ctx context.Context, studentID string) ([]WeeklyReport, error) {
	var reports []WeeklyReport
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("generated_at DESC").
		Find(&reports).Error
	return reports, err
}

// FindLatestByStudentID retrieves the latest weekly report for a student
func (r *WeeklyReportRepository) FindLatestByStudentID(ctx context.Context, studentID string) (*WeeklyReport, error) {
	var report WeeklyReport
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("generated_at DESC").
		First(&report).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrWeeklyReportNotFound
	}
	return &report, err
}

// Create creates a new weekly report
func (r *WeeklyReportRepository) Create(ctx context.Context, report *WeeklyReport) error {
	return r.db.WithContext(ctx).Create(report).Error
}

// Update updates an existing weekly report
func (r *WeeklyReportRepository) Update(ctx context.Context, report *WeeklyReport) error {
	result := r.db.WithContext(ctx).Model(report).Updates(report)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWeeklyReportNotFound
	}
	return nil
}

// Delete deletes a weekly report
func (r *WeeklyReportRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&WeeklyReport{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWeeklyReportNotFound
	}
	return nil
}
