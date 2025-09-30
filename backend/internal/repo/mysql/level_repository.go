package mysql

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrLevelNotFound   = errors.New("level not found")
	ErrChapterNotFound = errors.New("chapter not found")
	ErrCourseNotFound  = errors.New("course not found")
)

// LevelRepository handles level data operations using GORM
type LevelRepository struct {
	db *gorm.DB
}

// NewLevelRepository creates a new level repository
func NewLevelRepository(db *gorm.DB) *LevelRepository {
	return &LevelRepository{db: db}
}

// FindByID retrieves a level by ID
func (r *LevelRepository) FindByID(ctx context.Context, id string) (*Level, error) {
	var level Level
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&level).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrLevelNotFound
	}
	return &level, err
}

// FindByChapterID retrieves all levels for a chapter
func (r *LevelRepository) FindByChapterID(ctx context.Context, chapterID string) ([]Level, error) {
	var levels []Level
	err := r.db.WithContext(ctx).
		Where("chapter_id = ?", chapterID).
		Order("display_order, id").
		Find(&levels).Error
	return levels, err
}

// FindByChapterIDWithDetails retrieves all levels for a chapter with full details
func (r *LevelRepository) FindByChapterIDWithDetails(ctx context.Context, chapterID string) ([]Level, error) {
	var levels []Level
	err := r.db.WithContext(ctx).
		Preload("Chapter").
		Where("chapter_id = ?", chapterID).
		Order("display_order, id").
		Find(&levels).Error
	return levels, err
}

// Create creates a new level
func (r *LevelRepository) Create(ctx context.Context, level *Level) error {
	return r.db.WithContext(ctx).Create(level).Error
}

// Update updates an existing level
func (r *LevelRepository) Update(ctx context.Context, level *Level) error {
	result := r.db.WithContext(ctx).Model(level).Updates(level)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrLevelNotFound
	}
	return nil
}

// Delete deletes a level
func (r *LevelRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&Level{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrLevelNotFound
	}
	return nil
}

// ChapterRepository handles chapter data operations using GORM
type ChapterRepository struct {
	db *gorm.DB
}

// NewChapterRepository creates a new chapter repository
func NewChapterRepository(db *gorm.DB) *ChapterRepository {
	return &ChapterRepository{db: db}
}

// FindByID retrieves a chapter by ID
func (r *ChapterRepository) FindByID(ctx context.Context, id string) (*Chapter, error) {
	var chapter Chapter
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&chapter).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrChapterNotFound
	}
	return &chapter, err
}

// FindByCourseID retrieves all chapters for a course
func (r *ChapterRepository) FindByCourseID(ctx context.Context, courseID string) ([]Chapter, error) {
	var chapters []Chapter
	err := r.db.WithContext(ctx).
		Where("course_id = ?", courseID).
		Order("display_order, id").
		Find(&chapters).Error
	return chapters, err
}

// FindByCourseIDWithLevels retrieves all chapters for a course with levels
func (r *ChapterRepository) FindByCourseIDWithLevels(ctx context.Context, courseID string) ([]Chapter, error) {
	var chapters []Chapter
	err := r.db.WithContext(ctx).
		Preload("Levels", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order, id")
		}).
		Where("course_id = ?", courseID).
		Order("display_order, id").
		Find(&chapters).Error
	return chapters, err
}

// Create creates a new chapter
func (r *ChapterRepository) Create(ctx context.Context, chapter *Chapter) error {
	return r.db.WithContext(ctx).Create(chapter).Error
}

// Update updates an existing chapter
func (r *ChapterRepository) Update(ctx context.Context, chapter *Chapter) error {
	result := r.db.WithContext(ctx).Model(chapter).Updates(chapter)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrChapterNotFound
	}
	return nil
}

// Delete deletes a chapter
func (r *ChapterRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&Chapter{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrChapterNotFound
	}
	return nil
}

// CourseRepository handles course data operations using GORM
type CourseRepository struct {
	db *gorm.DB
}

// NewCourseRepository creates a new course repository
func NewCourseRepository(db *gorm.DB) *CourseRepository {
	return &CourseRepository{db: db}
}

// FindByID retrieves a course by ID
func (r *CourseRepository) FindByID(ctx context.Context, id string) (*Course, error) {
	var course Course
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&course).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCourseNotFound
	}
	return &course, err
}

// FindAll retrieves all courses
func (r *CourseRepository) FindAll(ctx context.Context) ([]Course, error) {
	var courses []Course
	err := r.db.WithContext(ctx).
		Order("display_order, id").
		Find(&courses).Error
	return courses, err
}

// FindAllWithChapters retrieves all courses with chapters
func (r *CourseRepository) FindAllWithChapters(ctx context.Context) ([]Course, error) {
	var courses []Course
	err := r.db.WithContext(ctx).
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order, id")
		}).
		Order("display_order, id").
		Find(&courses).Error
	return courses, err
}

// FindAllWithFullTree retrieves all courses with chapters and levels
func (r *CourseRepository) FindAllWithFullTree(ctx context.Context) ([]Course, error) {
	var courses []Course
	err := r.db.WithContext(ctx).
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order, id")
		}).
		Preload("Chapters.Levels", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order, id")
		}).
		Order("display_order, id").
		Find(&courses).Error
	return courses, err
}

// Create creates a new course
func (r *CourseRepository) Create(ctx context.Context, course *Course) error {
	return r.db.WithContext(ctx).Create(course).Error
}

// Update updates an existing course
func (r *CourseRepository) Update(ctx context.Context, course *Course) error {
	result := r.db.WithContext(ctx).Model(course).Updates(course)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCourseNotFound
	}
	return nil
}

// Delete deletes a course
func (r *CourseRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&Course{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCourseNotFound
	}
	return nil
}