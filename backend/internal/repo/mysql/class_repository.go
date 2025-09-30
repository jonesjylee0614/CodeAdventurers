package mysql

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrClassNotFound = errors.New("class not found")
)

// ClassRepository handles class data operations using GORM
type ClassRepository struct {
	db *gorm.DB
}

// NewClassRepository creates a new class repository
func NewClassRepository(db *gorm.DB) *ClassRepository {
	return &ClassRepository{db: db}
}

// FindByID retrieves a class by ID
func (r *ClassRepository) FindByID(ctx context.Context, id string) (*Class, error) {
	var class Class
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&class).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrClassNotFound
	}
	return &class, err
}

// FindByInviteCode retrieves a class by invite code
func (r *ClassRepository) FindByInviteCode(ctx context.Context, inviteCode string) (*Class, error) {
	var class Class
	err := r.db.WithContext(ctx).Where("invite_code = ?", inviteCode).First(&class).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrClassNotFound
	}
	return &class, err
}

// FindByTeacherID retrieves all classes for a teacher
func (r *ClassRepository) FindByTeacherID(ctx context.Context, teacherID string) ([]Class, error) {
	var classes []Class
	err := r.db.WithContext(ctx).
		Where("teacher_id = ?", teacherID).
		Order("name").
		Find(&classes).Error
	return classes, err
}

// Create creates a new class
func (r *ClassRepository) Create(ctx context.Context, class *Class) error {
	return r.db.WithContext(ctx).Create(class).Error
}

// Update updates an existing class
func (r *ClassRepository) Update(ctx context.Context, class *Class) error {
	result := r.db.WithContext(ctx).Model(class).Updates(class)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrClassNotFound
	}
	return nil
}

// UpdateHintLimit updates only the hint limit for a class
func (r *ClassRepository) UpdateHintLimit(ctx context.Context, classID string, hintLimit int) error {
	result := r.db.WithContext(ctx).Model(&Class{}).
		Where("id = ?", classID).
		Update("hint_limit", hintLimit)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrClassNotFound
	}
	return nil
}

// Delete deletes a class
func (r *ClassRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&Class{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrClassNotFound
	}
	return nil
}

// GetAssignedCourses retrieves all courses assigned to a class
func (r *ClassRepository) GetAssignedCourses(ctx context.Context, classID string) ([]string, error) {
	var classCourses []ClassCourse
	err := r.db.WithContext(ctx).
		Where("class_id = ?", classID).
		Order("assigned_at").
		Find(&classCourses).Error
	if err != nil {
		return nil, err
	}

	courseIDs := make([]string, len(classCourses))
	for i, cc := range classCourses {
		courseIDs[i] = cc.CourseID
	}
	return courseIDs, nil
}

// AssignCourse assigns a course to a class
func (r *ClassRepository) AssignCourse(ctx context.Context, classID, courseID string) error {
	classCourse := ClassCourse{
		ClassID:  classID,
		CourseID: courseID,
	}
	// Use FirstOrCreate to avoid duplicates
	return r.db.WithContext(ctx).
		Where("class_id = ? AND course_id = ?", classID, courseID).
		FirstOrCreate(&classCourse).Error
}

// UnassignCourse removes a course assignment from a class
func (r *ClassRepository) UnassignCourse(ctx context.Context, classID, courseID string) error {
	return r.db.WithContext(ctx).
		Where("class_id = ? AND course_id = ?", classID, courseID).
		Delete(&ClassCourse{}).Error
}

// GetStudentCount returns the number of students in a class
func (r *ClassRepository) GetStudentCount(ctx context.Context, classID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&Student{}).
		Where("class_id = ?", classID).
		Count(&count).Error
	return count, err
}

// GetClassStatistics retrieves aggregated statistics for a class
func (r *ClassRepository) GetClassStatistics(ctx context.Context, classID string) (map[string]interface{}, error) {
	var result struct {
		StudentCount       int64
		AvgCompletedLevels float64
		AvgStars           float64
	}

	err := r.db.WithContext(ctx).Model(&Student{}).
		Select(`
			COUNT(DISTINCT user_id) as student_count,
			COALESCE(AVG(total_completed_levels), 0) as avg_completed_levels,
			COALESCE(AVG(total_stars), 0) as avg_stars
		`).
		Where("class_id = ?", classID).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"studentCount":       result.StudentCount,
		"avgCompletedLevels": result.AvgCompletedLevels,
		"avgStars":           result.AvgStars,
	}

	return stats, nil
}