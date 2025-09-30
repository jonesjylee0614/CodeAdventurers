package mysql

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"gorm.io/gorm"
)

var (
	ErrProgressNotFound = errors.New("progress not found")
)

// ProgressRepository handles student level progress operations using GORM
type ProgressRepository struct {
	db *gorm.DB
}

// NewProgressRepository creates a new progress repository
func NewProgressRepository(db *gorm.DB) *ProgressRepository {
	return &ProgressRepository{db: db}
}

// FindByStudentAndLevel retrieves progress for a specific student and level
func (r *ProgressRepository) FindByStudentAndLevel(ctx context.Context, studentID, levelID string) (*StudentLevelProgress, error) {
	var progress StudentLevelProgress
	err := r.db.WithContext(ctx).
		Where("student_id = ? AND level_id = ?", studentID, levelID).
		First(&progress).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrProgressNotFound
	}
	return &progress, err
}

// FindAllByStudent retrieves all progress records for a student
func (r *ProgressRepository) FindAllByStudent(ctx context.Context, studentID string) ([]StudentLevelProgress, error) {
	var progressList []StudentLevelProgress
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("last_updated_at DESC").
		Find(&progressList).Error
	return progressList, err
}

// FindCompletedByStudent retrieves all completed levels for a student
func (r *ProgressRepository) FindCompletedByStudent(ctx context.Context, studentID string) ([]StudentLevelProgress, error) {
	var progressList []StudentLevelProgress
	err := r.db.WithContext(ctx).
		Where("student_id = ? AND status = ?", studentID, "completed").
		Order("first_completed_at DESC").
		Find(&progressList).Error
	return progressList, err
}

// Create creates a new progress record
func (r *ProgressRepository) Create(ctx context.Context, progress *StudentLevelProgress) error {
	return r.db.WithContext(ctx).Create(progress).Error
}

// Update updates an existing progress record
func (r *ProgressRepository) Update(ctx context.Context, progress *StudentLevelProgress) error {
	result := r.db.WithContext(ctx).Model(progress).Updates(progress)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrProgressNotFound
	}
	return nil
}

// UpsertProgress creates or updates progress record
func (r *ProgressRepository) UpsertProgress(ctx context.Context, progress *StudentLevelProgress) error {
	// Check if record exists
	var existing StudentLevelProgress
	err := r.db.WithContext(ctx).
		Where("student_id = ? AND level_id = ?", progress.StudentID, progress.LevelID).
		First(&existing).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new record
		return r.db.WithContext(ctx).Create(progress).Error
	}
	if err != nil {
		return err
	}

	// Update existing record with smart merging
	updates := map[string]interface{}{
		"status":          progress.Status,
		"hints_used":      gorm.Expr("hints_used + ?", progress.HintsUsed),
		"total_duration":  gorm.Expr("total_duration + ?", progress.TotalDuration),
		"attempts":        gorm.Expr("attempts + 1"),
		"last_replay_log": progress.LastReplayLog,
	}

	// Update stars to maximum
	if progress.Stars > existing.Stars {
		updates["stars"] = progress.Stars
	}

	// Update best_steps to minimum (if provided and better)
	if progress.BestSteps.Valid {
		if !existing.BestSteps.Valid || progress.BestSteps.Int32 < existing.BestSteps.Int32 {
			updates["best_steps"] = progress.BestSteps
			updates["best_difference"] = progress.BestDifference
		}
	}

	// Set first_completed_at if not set
	if !existing.FirstCompletedAt.Valid && progress.FirstCompletedAt.Valid {
		updates["first_completed_at"] = progress.FirstCompletedAt
	}

	return r.db.WithContext(ctx).Model(&existing).Updates(updates).Error
}

// UpdateStatus updates only the status of a progress record
func (r *ProgressRepository) UpdateStatus(ctx context.Context, studentID, levelID, status string) error {
	result := r.db.WithContext(ctx).Model(&StudentLevelProgress{}).
		Where("student_id = ? AND level_id = ?", studentID, levelID).
		Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		// Create new record with this status
		progress := StudentLevelProgress{
			StudentID: studentID,
			LevelID:   levelID,
			Status:    status,
		}
		return r.db.WithContext(ctx).Create(&progress).Error
	}
	return nil
}

// RecordCompletion records a level completion
func (r *ProgressRepository) RecordCompletion(ctx context.Context, studentID, levelID string, stars, steps, hints, duration int, replayLog string) error {
	// Get level's best_steps for difference calculation
	var level Level
	if err := r.db.WithContext(ctx).Select("best_steps").Where("id = ?", levelID).First(&level).Error; err != nil {
		return err
	}

	bestDifference := steps - level.BestSteps

	progress := StudentLevelProgress{
		StudentID:      studentID,
		LevelID:        levelID,
		Status:         "completed",
		Stars:          stars,
		BestSteps:      sql.NullInt32{Int32: int32(steps), Valid: true},
		BestDifference: sql.NullInt32{Int32: int32(bestDifference), Valid: true},
		HintsUsed:      hints,
		TotalDuration:  duration,
		Attempts:       1,
		LastReplayLog:  sql.NullString{String: replayLog, Valid: replayLog != ""},
		FirstCompletedAt: sql.NullTime{Time: time.Now(), Valid: true},
	}

	return r.UpsertProgress(ctx, &progress)
}

// GetStudentStats retrieves aggregated statistics for a student
func (r *ProgressRepository) GetStudentStats(ctx context.Context, studentID string) (map[string]interface{}, error) {
	var result struct {
		TotalLevels     int64
		CompletedLevels int64
		TotalStars      int64
		TotalDuration   int64
		TotalAttempts   int64
	}

	err := r.db.WithContext(ctx).Model(&StudentLevelProgress{}).
		Select(`
			COUNT(*) as total_levels,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_levels,
			COALESCE(SUM(stars), 0) as total_stars,
			COALESCE(SUM(total_duration), 0) as total_duration,
			COALESCE(SUM(attempts), 0) as total_attempts
		`).
		Where("student_id = ?", studentID).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"totalLevels":     result.TotalLevels,
		"completedLevels": result.CompletedLevels,
		"totalStars":      result.TotalStars,
		"totalDuration":   result.TotalDuration,
		"totalAttempts":   result.TotalAttempts,
	}

	return stats, nil
}