package mysql

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrParentNotFound = errors.New("parent not found")
)

// ParentRepository handles parent data operations using GORM
type ParentRepository struct {
	db *gorm.DB
}

// NewParentRepository creates a new parent repository
func NewParentRepository(db *gorm.DB) *ParentRepository {
	return &ParentRepository{db: db}
}

// FindByUserID retrieves a parent by user ID with user info
func (r *ParentRepository) FindByUserID(ctx context.Context, userID string) (*Parent, error) {
	var parent Parent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		First(&parent).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrParentNotFound
	}
	return &parent, err
}

// Create creates a new parent record
func (r *ParentRepository) Create(ctx context.Context, parent *Parent) error {
	return r.db.WithContext(ctx).Create(parent).Error
}

// Update updates parent information
func (r *ParentRepository) Update(ctx context.Context, parent *Parent) error {
	result := r.db.WithContext(ctx).Model(parent).Updates(parent)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrParentNotFound
	}
	return nil
}

// UpdateSettings updates parent notification settings
func (r *ParentRepository) UpdateSettings(ctx context.Context, userID, reminderTime, weeklyReportDay string, notifyChannels string) error {
	result := r.db.WithContext(ctx).Model(&Parent{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"reminder_time":      reminderTime,
			"weekly_report_day":  weeklyReportDay,
			"notify_channels":    notifyChannels,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrParentNotFound
	}
	return nil
}

// GetChildren retrieves all children for a parent
func (r *ParentRepository) GetChildren(ctx context.Context, parentID string) ([]string, error) {
	var relations []ParentChild
	err := r.db.WithContext(ctx).
		Where("parent_id = ?", parentID).
		Order("created_at").
		Find(&relations).Error
	if err != nil {
		return nil, err
	}

	childIDs := make([]string, len(relations))
	for i, rel := range relations {
		childIDs[i] = rel.ChildID
	}
	return childIDs, nil
}

// AddChild adds a child to a parent
func (r *ParentRepository) AddChild(ctx context.Context, parentID, childID, relationship string) error {
	parentChild := ParentChild{
		ParentID:     parentID,
		ChildID:      childID,
		Relationship: relationship,
	}
	// Use FirstOrCreate to avoid duplicates
	return r.db.WithContext(ctx).
		Where("parent_id = ? AND child_id = ?", parentID, childID).
		FirstOrCreate(&parentChild).Error
}

// RemoveChild removes a child from a parent
func (r *ParentRepository) RemoveChild(ctx context.Context, parentID, childID string) error {
	return r.db.WithContext(ctx).
		Where("parent_id = ? AND child_id = ?", parentID, childID).
		Delete(&ParentChild{}).Error
}

// TeacherRepository handles teacher data operations using GORM
type TeacherRepository struct {
	db *gorm.DB
}

// NewTeacherRepository creates a new teacher repository
func NewTeacherRepository(db *gorm.DB) *TeacherRepository {
	return &TeacherRepository{db: db}
}

var ErrTeacherNotFound = errors.New("teacher not found")

// FindByUserID retrieves a teacher by user ID with user info
func (r *TeacherRepository) FindByUserID(ctx context.Context, userID string) (*Teacher, error) {
	var teacher Teacher
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		First(&teacher).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrTeacherNotFound
	}
	return &teacher, err
}

// Create creates a new teacher record
func (r *TeacherRepository) Create(ctx context.Context, teacher *Teacher) error {
	return r.db.WithContext(ctx).Create(teacher).Error
}

// GetManagedClasses retrieves all classes managed by a teacher
func (r *TeacherRepository) GetManagedClasses(ctx context.Context, teacherID string) ([]Class, error) {
	var classes []Class
	err := r.db.WithContext(ctx).
		Where("teacher_id = ?", teacherID).
		Order("name").
		Find(&classes).Error
	return classes, err
}
