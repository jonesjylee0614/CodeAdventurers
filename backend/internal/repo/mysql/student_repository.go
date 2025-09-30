package mysql

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrStudentNotFound = errors.New("student not found")
)

// StudentRepository handles student data operations using GORM
type StudentRepository struct {
	db *gorm.DB
}

// NewStudentRepository creates a new student repository
func NewStudentRepository(db *gorm.DB) *StudentRepository {
	return &StudentRepository{db: db}
}

// FindByUserID retrieves a student by user ID with user info
func (r *StudentRepository) FindByUserID(ctx context.Context, userID string) (*Student, error) {
	var student Student
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		First(&student).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrStudentNotFound
	}
	return &student, err
}

// FindByClassID retrieves all students in a class
func (r *StudentRepository) FindByClassID(ctx context.Context, classID string) ([]Student, error) {
	var students []Student
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("class_id = ?", classID).
		Order("user_id").
		Find(&students).Error
	return students, err
}

// Create creates a new student record
func (r *StudentRepository) Create(ctx context.Context, student *Student) error {
	return r.db.WithContext(ctx).Create(student).Error
}

// Update updates student information
func (r *StudentRepository) Update(ctx context.Context, student *Student) error {
	result := r.db.WithContext(ctx).Model(student).Updates(student)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStudentNotFound
	}
	return nil
}

// UpdateSettings updates only student settings
func (r *StudentRepository) UpdateSettings(ctx context.Context, userID string, volume int, lowMotion bool, language string) error {
	result := r.db.WithContext(ctx).Model(&Student{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"settings_volume":     volume,
			"settings_low_motion": lowMotion,
			"settings_language":   language,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStudentNotFound
	}
	return nil
}

// UpdateAvatar updates the equipped avatar
func (r *StudentRepository) UpdateAvatar(ctx context.Context, userID string, avatarEquipped string) error {
	result := r.db.WithContext(ctx).Model(&Student{}).
		Where("user_id = ?", userID).
		Update("avatar_equipped", avatarEquipped)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStudentNotFound
	}
	return nil
}

// UnlockSandbox unlocks sandbox for a student
func (r *StudentRepository) UnlockSandbox(ctx context.Context, userID string) error {
	result := r.db.WithContext(ctx).Model(&Student{}).
		Where("user_id = ?", userID).
		Update("sandbox_unlocked", true)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStudentNotFound
	}
	return nil
}

// IncrementStats increments student statistics
func (r *StudentRepository) IncrementStats(ctx context.Context, userID string, stars int, completedLevels int) error {
	result := r.db.WithContext(ctx).Model(&Student{}).
		Where("user_id = ?", userID).
		UpdateColumn("total_stars", gorm.Expr("total_stars + ?", stars)).
		UpdateColumn("total_completed_levels", gorm.Expr("total_completed_levels + ?", completedLevels))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStudentNotFound
	}
	return nil
}

// GetUnlockedAvatars retrieves all unlocked avatar items for a student
func (r *StudentRepository) GetUnlockedAvatars(ctx context.Context, studentID string) ([]string, error) {
	var avatars []StudentAvatar
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("unlocked_at").
		Find(&avatars).Error
	if err != nil {
		return nil, err
	}

	result := make([]string, len(avatars))
	for i, a := range avatars {
		result[i] = a.AvatarItem
	}
	return result, nil
}

// UnlockAvatar adds a new unlocked avatar for a student
func (r *StudentRepository) UnlockAvatar(ctx context.Context, studentID string, avatarItem string) error {
	avatar := StudentAvatar{
		StudentID:  studentID,
		AvatarItem: avatarItem,
	}
	// Use FirstOrCreate to avoid duplicates
	return r.db.WithContext(ctx).
		Where("student_id = ? AND avatar_item = ?", studentID, avatarItem).
		FirstOrCreate(&avatar).Error
}

// GetEarnedBadges retrieves all earned badges for a student
func (r *StudentRepository) GetEarnedBadges(ctx context.Context, studentID string) ([]string, error) {
	var badges []StudentBadge
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("earned_at").
		Find(&badges).Error
	if err != nil {
		return nil, err
	}

	result := make([]string, len(badges))
	for i, b := range badges {
		result[i] = b.BadgeCode
	}
	return result, nil
}

// EarnBadge adds a new earned badge for a student
func (r *StudentRepository) EarnBadge(ctx context.Context, studentID string, badgeCode string) error {
	badge := StudentBadge{
		StudentID: studentID,
		BadgeCode: badgeCode,
	}
	// Use FirstOrCreate to avoid duplicates
	return r.db.WithContext(ctx).
		Where("student_id = ? AND badge_code = ?", studentID, badgeCode).
		FirstOrCreate(&badge).Error
}

// GetCollectedCompendium retrieves all collected compendium entries for a student
func (r *StudentRepository) GetCollectedCompendium(ctx context.Context, studentID string) ([]string, error) {
	var entries []StudentCompendiumEntry
	err := r.db.WithContext(ctx).
		Where("student_id = ?", studentID).
		Order("collected_at").
		Find(&entries).Error
	if err != nil {
		return nil, err
	}

	result := make([]string, len(entries))
	for i, e := range entries {
		result[i] = e.EntryID
	}
	return result, nil
}

// CollectCompendiumEntry adds a collected compendium entry for a student
func (r *StudentRepository) CollectCompendiumEntry(ctx context.Context, studentID string, entryID string) error {
	entry := StudentCompendiumEntry{
		StudentID: studentID,
		EntryID:   entryID,
	}
	// Use FirstOrCreate to avoid duplicates
	return r.db.WithContext(ctx).
		Where("student_id = ? AND entry_id = ?", studentID, entryID).
		FirstOrCreate(&entry).Error
}