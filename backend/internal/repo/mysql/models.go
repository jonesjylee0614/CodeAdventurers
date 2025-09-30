package mysql

import (
	"database/sql"
	"time"

	"gorm.io/gorm"
)

// User represents the core user entity
type User struct {
	ID           string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	Name         string         `gorm:"column:name;size:128;not null" json:"name"`
	Email        sql.NullString `gorm:"column:email;size:255" json:"email,omitempty"`
	Phone        sql.NullString `gorm:"column:phone;size:20" json:"phone,omitempty"`
	PasswordHash sql.NullString `gorm:"column:password_hash;size:255" json:"-"`
	Role         string         `gorm:"column:role;type:enum('student','teacher','parent','admin');not null" json:"role"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

// Student represents student-specific data
type Student struct {
	UserID               string `gorm:"column:user_id;primaryKey;size:64" json:"user_id"`
	ClassID              sql.NullString `gorm:"column:class_id;size:64" json:"class_id,omitempty"`
	InviteCode           sql.NullString `gorm:"column:invite_code;size:32" json:"invite_code,omitempty"`
	SandboxUnlocked      bool           `gorm:"column:sandbox_unlocked;default:false" json:"sandbox_unlocked"`
	AvatarEquipped       string         `gorm:"column:avatar_equipped;size:64;default:starter-cape" json:"avatar_equipped"`
	TotalStars           int            `gorm:"column:total_stars;default:0" json:"total_stars"`
	TotalCompletedLevels int            `gorm:"column:total_completed_levels;default:0" json:"total_completed_levels"`
	SettingsVolume       int            `gorm:"column:settings_volume;default:80" json:"settings_volume"`
	SettingsLowMotion    bool           `gorm:"column:settings_low_motion;default:false" json:"settings_low_motion"`
	SettingsLanguage     string         `gorm:"column:settings_language;size:10;default:zh-CN" json:"settings_language"`
	SettingsResettable   bool           `gorm:"column:settings_resettable;default:true" json:"settings_resettable"`

	// Associations
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

func (Student) TableName() string {
	return "students"
}

// StudentAvatar represents an unlocked avatar item
type StudentAvatar struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	StudentID  string    `gorm:"column:student_id;size:64;not null;index:idx_student_avatar,unique" json:"student_id"`
	AvatarItem string    `gorm:"column:avatar_item;size:64;not null;index:idx_student_avatar,unique" json:"avatar_item"`
	UnlockedAt time.Time `gorm:"column:unlocked_at;autoCreateTime" json:"unlocked_at"`
}

func (StudentAvatar) TableName() string {
	return "student_avatars"
}

// StudentBadge represents an earned badge
type StudentBadge struct {
	ID        int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	StudentID string    `gorm:"column:student_id;size:64;not null;index:idx_student_badge,unique" json:"student_id"`
	BadgeCode string    `gorm:"column:badge_code;size:64;not null;index:idx_student_badge,unique" json:"badge_code"`
	EarnedAt  time.Time `gorm:"column:earned_at;autoCreateTime" json:"earned_at"`
}

func (StudentBadge) TableName() string {
	return "student_badges"
}

// StudentCompendiumEntry represents a collected compendium entry
type StudentCompendiumEntry struct {
	ID          int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	StudentID   string    `gorm:"column:student_id;size:64;not null;index:idx_student_compendium,unique" json:"student_id"`
	EntryID     string    `gorm:"column:entry_id;size:64;not null;index:idx_student_compendium,unique" json:"entry_id"`
	CollectedAt time.Time `gorm:"column:collected_at;autoCreateTime" json:"collected_at"`
}

func (StudentCompendiumEntry) TableName() string {
	return "student_compendium"
}

// Teacher represents teacher-specific data
type Teacher struct {
	UserID string `gorm:"column:user_id;primaryKey;size:64" json:"user_id"`

	// Associations
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

func (Teacher) TableName() string {
	return "teachers"
}

// Parent represents parent-specific data
type Parent struct {
	UserID          string         `gorm:"column:user_id;primaryKey;size:64" json:"user_id"`
	ReminderTime    string         `gorm:"column:reminder_time;size:10;default:20:00" json:"reminder_time"`
	WeeklyReportDay string         `gorm:"column:weekly_report_day;size:10;default:Sunday" json:"weekly_report_day"`
	NotifyChannels  sql.NullString `gorm:"column:notify_channels;type:json" json:"notify_channels,omitempty"` // JSON array

	// Associations
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

func (Parent) TableName() string {
	return "parents"
}

// ParentChild represents parent-child relationship
type ParentChild struct {
	ID           int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	ParentID     string    `gorm:"column:parent_id;size:64;not null;index:idx_parent_child,unique" json:"parent_id"`
	ChildID      string    `gorm:"column:child_id;size:64;not null;index:idx_parent_child,unique" json:"child_id"`
	Relationship string    `gorm:"column:relationship;size:20;default:parent" json:"relationship"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (ParentChild) TableName() string {
	return "parent_children"
}

// Class represents a teaching class
type Class struct {
	ID         string    `gorm:"column:id;primaryKey;size:64" json:"id"`
	Name       string    `gorm:"column:name;size:128;not null" json:"name"`
	InviteCode string    `gorm:"column:invite_code;size:32;not null;uniqueIndex" json:"invite_code"`
	TeacherID  string    `gorm:"column:teacher_id;size:64;not null;index" json:"teacher_id"`
	HintLimit  int       `gorm:"column:hint_limit;default:3" json:"hint_limit"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (Class) TableName() string {
	return "classes"
}

// ClassCourse represents course assignment to a class
type ClassCourse struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	ClassID    string    `gorm:"column:class_id;size:64;not null;index:idx_class_course,unique" json:"class_id"`
	CourseID   string    `gorm:"column:course_id;size:64;not null;index:idx_class_course,unique" json:"course_id"`
	AssignedAt time.Time `gorm:"column:assigned_at;autoCreateTime" json:"assigned_at"`
}

func (ClassCourse) TableName() string {
	return "class_courses"
}

// Course represents a course
type Course struct {
	ID           string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	Name         string         `gorm:"column:name;size:128;not null" json:"name"`
	Description  sql.NullString `gorm:"column:description;type:text" json:"description,omitempty"`
	DisplayOrder int            `gorm:"column:display_order;default:0;index" json:"display_order"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Associations
	Chapters []Chapter `gorm:"foreignKey:CourseID" json:"chapters,omitempty"`
}

func (Course) TableName() string {
	return "courses"
}

// Chapter represents a course chapter
type Chapter struct {
	ID           string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	CourseID     string         `gorm:"column:course_id;size:64;not null;index" json:"course_id"`
	Title        string         `gorm:"column:title;size:128;not null" json:"title"`
	Summary      sql.NullString `gorm:"column:summary;type:text" json:"summary,omitempty"`
	DisplayOrder int            `gorm:"column:display_order;default:0;index" json:"display_order"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Associations
	Course Course  `gorm:"foreignKey:CourseID;references:ID" json:"course,omitempty"`
	Levels []Level `gorm:"foreignKey:ChapterID" json:"levels,omitempty"`
}

func (Chapter) TableName() string {
	return "chapters"
}

// Level represents a game level with configuration stored as JSON
type Level struct {
	ID            string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	ChapterID     string         `gorm:"column:chapter_id;size:64;not null;index" json:"chapter_id"`
	Name          string         `gorm:"column:name;size:128;not null" json:"name"`
	Width         int            `gorm:"column:width;not null" json:"width"`
	Height        int            `gorm:"column:height;not null" json:"height"`
	BestSteps     int            `gorm:"column:best_steps;default:0" json:"best_steps"`
	Comic         sql.NullString `gorm:"column:comic;type:text" json:"comic,omitempty"`
	DisplayOrder  int            `gorm:"column:display_order;default:0;index" json:"display_order"`
	StartPosition string         `gorm:"column:start_position;type:json;not null" json:"start_position"` // JSON object
	GoalConfig    string         `gorm:"column:goal_config;type:json;not null" json:"goal_config"`      // JSON object
	Tiles         string         `gorm:"column:tiles;type:json;not null" json:"tiles"`                  // JSON array
	Hints         sql.NullString `gorm:"column:hints;type:json" json:"hints,omitempty"`                 // JSON array
	AllowedBlocks sql.NullString `gorm:"column:allowed_blocks;type:json" json:"allowed_blocks,omitempty"` // JSON array
	Rewards       sql.NullString `gorm:"column:rewards;type:json" json:"rewards,omitempty"`             // JSON object
	CreatedAt     time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Associations
	Chapter Chapter `gorm:"foreignKey:ChapterID;references:ID" json:"chapter,omitempty"`
}

func (Level) TableName() string {
	return "levels"
}

// StudentLevelProgress represents student progress on a specific level
type StudentLevelProgress struct {
	ID               int            `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	StudentID        string         `gorm:"column:student_id;size:64;not null;uniqueIndex:idx_student_level" json:"student_id"`
	LevelID          string         `gorm:"column:level_id;size:64;not null;uniqueIndex:idx_student_level" json:"level_id"`
	Status           string         `gorm:"column:status;type:enum('locked','unlocked','in-progress','completed','in-review');default:locked;index" json:"status"`
	Stars            int            `gorm:"column:stars;default:0" json:"stars"`
	BestSteps        sql.NullInt32  `gorm:"column:best_steps" json:"best_steps,omitempty"`
	BestDifference   sql.NullInt32  `gorm:"column:best_difference" json:"best_difference,omitempty"`
	HintsUsed        int            `gorm:"column:hints_used;default:0" json:"hints_used"`
	TotalDuration    int            `gorm:"column:total_duration;default:0" json:"total_duration"`
	Attempts         int            `gorm:"column:attempts;default:0" json:"attempts"`
	LastReplayLog    sql.NullString `gorm:"column:last_replay_log;type:json" json:"last_replay_log,omitempty"` // JSON array
	FirstCompletedAt sql.NullTime   `gorm:"column:first_completed_at" json:"first_completed_at,omitempty"`
	LastUpdatedAt    time.Time      `gorm:"column:last_updated_at;autoUpdateTime" json:"last_updated_at"`

	// Associations
	Student Student `gorm:"foreignKey:StudentID;references:UserID" json:"student,omitempty"`
	Level   Level   `gorm:"foreignKey:LevelID;references:ID" json:"level,omitempty"`
}

func (StudentLevelProgress) TableName() string {
	return "student_level_progress"
}

// SandboxProject represents a student's sandbox project
type SandboxProject struct {
	ID           string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	StudentID    string         `gorm:"column:student_id;size:64;not null;index" json:"student_id"`
	Title        string         `gorm:"column:title;size:128;default:Untitled Project" json:"title"`
	Code         sql.NullString `gorm:"column:code;type:text" json:"code,omitempty"`
	ThumbnailURL sql.NullString `gorm:"column:thumbnail_url;size:255" json:"thumbnail_url,omitempty"`
	IsPublic     bool           `gorm:"column:is_public;default:false;index" json:"is_public"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (SandboxProject) TableName() string {
	return "sandbox_projects"
}

// WorkSubmission represents a student work submission
type WorkSubmission struct {
	ID              string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	StudentID       string         `gorm:"column:student_id;size:64;not null;index" json:"student_id"`
	ClassID         sql.NullString `gorm:"column:class_id;size:64;index" json:"class_id,omitempty"`
	LevelID         sql.NullString `gorm:"column:level_id;size:64" json:"level_id,omitempty"`
	Title           sql.NullString `gorm:"column:title;size:128" json:"title,omitempty"`
	Content         sql.NullString `gorm:"column:content;type:json" json:"content,omitempty"` // JSON object
	Status          string         `gorm:"column:status;type:enum('pending','approved','rejected');default:pending;index" json:"status"`
	TeacherFeedback sql.NullString `gorm:"column:teacher_feedback;type:text" json:"teacher_feedback,omitempty"`
	SubmittedAt     time.Time      `gorm:"column:submitted_at;autoCreateTime" json:"submitted_at"`
	ReviewedAt      sql.NullTime   `gorm:"column:reviewed_at" json:"reviewed_at,omitempty"`
}

func (WorkSubmission) TableName() string {
	return "work_submissions"
}

// CompendiumEntry represents a collectible entry
type CompendiumEntry struct {
	ID          string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	ChapterID   sql.NullString `gorm:"column:chapter_id;size:64;index" json:"chapter_id,omitempty"`
	Name        string         `gorm:"column:name;size:128;not null" json:"name"`
	Description sql.NullString `gorm:"column:description;type:text" json:"description,omitempty"`
	ImageURL    sql.NullString `gorm:"column:image_url;size:255" json:"image_url,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (CompendiumEntry) TableName() string {
	return "compendium_entries"
}

// WeeklyReport represents a generated weekly report for a student
type WeeklyReport struct {
	ID              string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	StudentID       string         `gorm:"column:student_id;size:64;not null;index" json:"student_id"`
	GeneratedAt     time.Time      `gorm:"column:generated_at;autoCreateTime;index" json:"generated_at"`
	Summary         sql.NullString `gorm:"column:summary;type:text" json:"summary,omitempty"`
	ConceptsLearned sql.NullString `gorm:"column:concepts_learned;type:json" json:"concepts_learned,omitempty"` // JSON array
	CommonMistakes  sql.NullString `gorm:"column:common_mistakes;type:json" json:"common_mistakes,omitempty"`   // JSON array
	Recommendations sql.NullString `gorm:"column:recommendations;type:json" json:"recommendations,omitempty"`   // JSON array
}

func (WeeklyReport) TableName() string {
	return "weekly_reports"
}

// AssetRecord represents an uploaded asset
type AssetRecord struct {
	ID         string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	AssetType  string         `gorm:"column:asset_type;size:32;not null;index" json:"asset_type"`
	FilePath   string         `gorm:"column:file_path;size:512;not null" json:"file_path"`
	FileSize   int64          `gorm:"column:file_size;default:0" json:"file_size"`
	MimeType   sql.NullString `gorm:"column:mime_type;size:64" json:"mime_type,omitempty"`
	UploaderID sql.NullString `gorm:"column:uploader_id;size:64;index" json:"uploader_id,omitempty"`
	Metadata   sql.NullString `gorm:"column:metadata;type:json" json:"metadata,omitempty"` // JSON object
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (AssetRecord) TableName() string {
	return "asset_records"
}

// ExportRecord represents an export job
type ExportRecord struct {
	ID           string         `gorm:"column:id;primaryKey;size:64" json:"id"`
	UserID       string         `gorm:"column:user_id;size:64;not null;index" json:"user_id"`
	ExportType   string         `gorm:"column:export_type;size:32;not null" json:"export_type"`
	FilePath     sql.NullString `gorm:"column:file_path;size:512" json:"file_path,omitempty"`
	Status       string         `gorm:"column:status;type:enum('pending','processing','completed','failed');default:pending;index" json:"status"`
	ErrorMessage sql.NullString `gorm:"column:error_message;type:text" json:"error_message,omitempty"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CompletedAt  sql.NullTime   `gorm:"column:completed_at" json:"completed_at,omitempty"`
}

func (ExportRecord) TableName() string {
	return "export_records"
}

// BeforeCreate hooks for ID generation if needed
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		// Generate UUID if not provided
		// u.ID = uuid.New().String()
	}
	return nil
}