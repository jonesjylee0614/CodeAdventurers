package student

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

type Direction string

const (
	DirectionNorth Direction = "north"
	DirectionSouth Direction = "south"
	DirectionEast  Direction = "east"
	DirectionWest  Direction = "west"
)

type Position struct {
	X      int       `json:"x"`
	Y      int       `json:"y"`
	Facing Direction `json:"facing"`
}

type Tile struct {
	X           int    `json:"x"`
	Y           int    `json:"y"`
	Walkable    bool   `json:"walkable"`
	Collectible string `json:"collectible,omitempty"`
}

type GoalPosition struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type LevelGoal struct {
	Collectibles *int          `json:"collectibles,omitempty"`
	Reach        *GoalPosition `json:"reach,omitempty"`
	StepLimit    *int          `json:"stepLimit,omitempty"`
}

type LevelRewards struct {
	Outfit string `json:"outfit,omitempty"`
	Stars  int    `json:"stars,omitempty"`
}

type LevelDefinition struct {
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	Width         int          `json:"width"`
	Height        int          `json:"height"`
	Tiles         []Tile       `json:"tiles"`
	Start         Position     `json:"start"`
	Goal          LevelGoal    `json:"goal"`
	BestSteps     int          `json:"bestSteps"`
	Hints         []string     `json:"hints"`
	AllowedBlocks []string     `json:"allowedBlocks"`
	Comic         string       `json:"comic,omitempty"`
	Rewards       LevelRewards `json:"rewards,omitempty"`
	ChapterID     string       `json:"chapterId"`
	Order         int          `json:"-"`
}

type ChapterDefinition struct {
	ID      string            `json:"id"`
	Title   string            `json:"title"`
	Summary string            `json:"summary"`
	Order   int               `json:"order"`
	Levels  []LevelDefinition `json:"levels"`
}

type LevelStatus string

const (
	LevelStatusLocked    LevelStatus = "locked"
	LevelStatusUnlocked  LevelStatus = "unlocked"
	LevelStatusCompleted LevelStatus = "completed"
)

type StudentLevelProgress struct {
	Stars          int              `json:"stars"`
	Steps          int              `json:"steps"`
	Hints          int              `json:"hints"`
	Duration       int              `json:"duration"`
	BestDifference *int             `json:"bestDifference,omitempty"`
	CompletedAt    int64            `json:"completedAt"`
	ReplayLog      []SimulationStep `json:"replayLog,omitempty"`
}

type AvatarState struct {
	Equipped string   `json:"equipped"`
	Unlocked []string `json:"unlocked"`
}

type AchievementState struct {
	Badges     []string `json:"badges"`
	Compendium []string `json:"compendium"`
}

type StudentSettings struct {
	Volume     int    `json:"volume"`
	LowMotion  bool   `json:"lowMotion"`
	Language   string `json:"language"`
	Resettable bool   `json:"resettable"`
}

type StudentProfile struct {
	ID              string                          `json:"id"`
	Name            string                          `json:"name"`
	Role            string                          `json:"role"`
	ClassID         string                          `json:"classId"`
	Avatar          AvatarState                     `json:"avatar"`
	Achievements    AchievementState                `json:"achievements"`
	Settings        StudentSettings                 `json:"settings"`
	SandboxUnlocked bool                            `json:"sandboxUnlocked"`
	Progress        map[string]StudentLevelProgress `json:"progress"`
}

type MapLevel struct {
	ID             string        `json:"id"`
	Name           string        `json:"name"`
	Status         LevelStatus   `json:"status"`
	Stars          int           `json:"stars"`
	BestDifference *int          `json:"bestDifference"`
	Rewards        *LevelRewards `json:"rewards,omitempty"`
}

type MapChapter struct {
	ID      string     `json:"id"`
	Title   string     `json:"title"`
	Summary string     `json:"summary"`
	Order   int        `json:"order"`
	Levels  []MapLevel `json:"levels"`
}

type Map struct {
	Chapters []MapChapter `json:"chapters"`
}

type Prep struct {
	LevelID          string       `json:"levelId"`
	VictoryCondition LevelGoal    `json:"victoryCondition"`
	AllowedBlocks    []string     `json:"allowedBlocks"`
	Comic            string       `json:"comic,omitempty"`
	Rewards          LevelRewards `json:"rewards,omitempty"`
}

type Condition struct {
	Type string `json:"type"`
}

type Instruction struct {
	Type      string        `json:"type"`
	Direction string        `json:"direction,omitempty"`
	Times     int           `json:"times,omitempty"`
	Body      []Instruction `json:"body,omitempty"`
	Condition *Condition    `json:"condition,omitempty"`
	Truthy    []Instruction `json:"truthy,omitempty"`
	Falsy     []Instruction `json:"falsy,omitempty"`
}

type SimulationStep struct {
	Index        int         `json:"index"`
	Instruction  Instruction `json:"instruction"`
	Position     Position    `json:"position"`
	Collectibles int         `json:"collectibles"`
}

type SimulationMetadata struct {
	BestSteps int       `json:"bestSteps"`
	Goal      LevelGoal `json:"goal"`
}

type SimulationResult struct {
	Success               bool               `json:"success"`
	Steps                 int                `json:"steps"`
	Stars                 int                `json:"stars"`
	ErrorCode             string             `json:"errorCode,omitempty"`
	RemainingCollectibles int                `json:"remainingCollectibles,omitempty"`
	Log                   []SimulationStep   `json:"log"`
	Metadata              SimulationMetadata `json:"metadata"`
}

type HintRequest struct {
	Attempts  int     `json:"attempts"`
	LastError *string `json:"lastError,omitempty"`
}

type HintResponse struct {
	Hint string `json:"hint"`
}

type CompleteRequest struct {
	Stars          int              `json:"stars"`
	Steps          int              `json:"steps"`
	Hints          *int             `json:"hints,omitempty"`
	Duration       *int             `json:"duration,omitempty"`
	BestDifference *int             `json:"bestDifference,omitempty"`
	ReplayLog      []SimulationStep `json:"replayLog,omitempty"`
}

type SettingsUpdate struct {
	Volume    *int    `json:"volume,omitempty"`
	LowMotion *bool   `json:"lowMotion,omitempty"`
	Language  *string `json:"language,omitempty"`
}

type AvatarUpdate struct {
	Equipped string `json:"equipped"`
}

type Level struct {
	LevelDefinition
	Status   LevelStatus           `json:"status"`
	Progress *StudentLevelProgress `json:"progress,omitempty"`
}

type Service struct {
	mu       sync.RWMutex
	chapters []ChapterDefinition
	levels   map[string]LevelDefinition
	profiles map[string]*StudentProfile
}

func New() *Service {
	chapters := defaultChapters()
	levelIndex := make(map[string]LevelDefinition)
	for _, chapter := range chapters {
		for _, level := range chapter.Levels {
			levelIndex[level.ID] = level
		}
	}
	return &Service{
		chapters: chapters,
		levels:   levelIndex,
		profiles: make(map[string]*StudentProfile),
	}
}

func (s *Service) Map(ctx context.Context, userID string) (Map, error) {
	profile := s.ensureProfile(userID)

	s.mu.RLock()
	defer s.mu.RUnlock()

	chapters := make([]MapChapter, 0, len(s.chapters))
	for _, chapter := range s.chapters {
		levels := make([]MapLevel, 0, len(chapter.Levels))
		for idx, levelDef := range chapter.Levels {
			progress, ok := profile.Progress[levelDef.ID]
			status := LevelStatusLocked
			if ok && progress.Stars > 0 {
				status = LevelStatusCompleted
			} else if s.isLevelUnlocked(profile, chapter.ID, idx) {
				status = LevelStatusUnlocked
			}

			var bestDiff *int
			if ok {
				bestDiff = progress.BestDifference
			}

			rewards := levelDef.Rewards
			levels = append(levels, MapLevel{
				ID:             levelDef.ID,
				Name:           levelDef.Name,
				Status:         status,
				Stars:          progress.Stars,
				BestDifference: bestDiff,
				Rewards:        nullableRewards(rewards),
			})
		}
		chapters = append(chapters, MapChapter{
			ID:      chapter.ID,
			Title:   chapter.Title,
			Summary: chapter.Summary,
			Order:   chapter.Order,
			Levels:  levels,
		})
	}

	sort.Slice(chapters, func(i, j int) bool { return chapters[i].Order < chapters[j].Order })
	for i := range chapters {
		sort.Slice(chapters[i].Levels, func(a, b int) bool {
			return s.levelOrder(chapters[i].Levels[a].ID) < s.levelOrder(chapters[i].Levels[b].ID)
		})
	}

	return Map{Chapters: chapters}, nil
}

func (s *Service) Profile(ctx context.Context, userID string) (StudentProfile, error) {
	profile := s.ensureProfile(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	s.recomputeDerivedState(profile)
	return copyProfile(profile), nil
}

func (s *Service) Level(ctx context.Context, userID, levelID string) (Level, error) {
	profile := s.ensureProfile(userID)

	s.mu.RLock()
	defer s.mu.RUnlock()

	levelDef, ok := s.levels[levelID]
	if !ok {
		return Level{}, fmt.Errorf("关卡 %s 不存在", levelID)
	}

	chapter, _ := s.findChapter(levelDef.ChapterID)
	if chapter == nil {
		return Level{}, fmt.Errorf("关卡 %s 未绑定章节", levelID)
	}

	levelIdx := s.findLevelIndex(*chapter, levelID)
	if levelIdx < 0 {
		return Level{}, fmt.Errorf("关卡 %s 未绑定章节", levelID)
	}

	progress, completed := profile.Progress[levelID]
	if !completed && !s.isLevelUnlocked(profile, chapter.ID, levelIdx) {
		return Level{}, fmt.Errorf("关卡未解锁，完成上一关后再试试吧")
	}

	status := LevelStatusUnlocked
	if completed && progress.Stars > 0 {
		status = LevelStatusCompleted
	}

	result := Level{
		LevelDefinition: levelDef,
		Status:          status,
	}
	if completed {
		progressCopy := progress
		result.Progress = &progressCopy
	}
	return result, nil
}

func (s *Service) Prep(ctx context.Context, userID, levelID string) (Prep, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	levelDef, ok := s.levels[levelID]
	if !ok {
		return Prep{}, fmt.Errorf("关卡 %s 不存在", levelID)
	}

	return Prep{
		LevelID:          levelDef.ID,
		VictoryCondition: levelDef.Goal,
		AllowedBlocks:    append([]string{}, levelDef.AllowedBlocks...),
		Comic:            levelDef.Comic,
		Rewards:          levelDef.Rewards,
	}, nil
}

func (s *Service) Run(ctx context.Context, userID, levelID string, program []Instruction) (SimulationResult, error) {
	level, ok := s.levels[levelID]
	if !ok {
		return SimulationResult{}, fmt.Errorf("关卡 %s 不存在", levelID)
	}

	if err := validateProgram(level, program); err != nil {
		return SimulationResult{}, err
	}

	simulator := newSimulator(level)
	return simulator.run(program), nil
}

func (s *Service) Sandbox(ctx context.Context, userID, levelID string, program []Instruction) (SimulationResult, error) {
	level, ok := s.levels[levelID]
	if !ok {
		return SimulationResult{}, fmt.Errorf("关卡 %s 不存在", levelID)
	}
	simulator := newSimulator(level)
	return simulator.run(program), nil
}

func (s *Service) Complete(ctx context.Context, userID, levelID string, req CompleteRequest) error {
	profile := s.ensureProfile(userID)

	s.mu.Lock()
	defer s.mu.Unlock()

	levelDef, ok := s.levels[levelID]
	if !ok {
		return fmt.Errorf("关卡 %s 不存在", levelID)
	}

	progress := profile.Progress[levelID]
	if req.Stars > progress.Stars {
		progress.Stars = req.Stars
	}
	progress.Steps = req.Steps
	if req.Hints != nil {
		progress.Hints = *req.Hints
	}
	if req.Duration != nil {
		progress.Duration = *req.Duration
	}
	if req.BestDifference != nil {
		diff := *req.BestDifference
		progress.BestDifference = &diff
	}
	progress.CompletedAt = time.Now().UnixMilli()
	if len(req.ReplayLog) > 0 {
		progress.ReplayLog = make([]SimulationStep, len(req.ReplayLog))
		copy(progress.ReplayLog, req.ReplayLog)
	}

	profile.Progress[levelID] = progress

	if levelDef.Rewards.Outfit != "" && req.Stars >= levelDef.Rewards.Stars {
		unlockAvatar(profile, levelDef.Rewards.Outfit)
	}

	s.recomputeDerivedState(profile)
	return nil
}

func (s *Service) Hint(ctx context.Context, userID, levelID string, payload HintRequest) (HintResponse, error) {
	level, ok := s.levels[levelID]
	if !ok {
		return HintResponse{}, fmt.Errorf("关卡 %s 不存在", levelID)
	}

	hint := computeHint(level, payload)
	return HintResponse{Hint: hint}, nil
}

func (s *Service) Settings(ctx context.Context, userID string) (StudentSettings, error) {
	profile := s.ensureProfile(userID)
	s.mu.RLock()
	defer s.mu.RUnlock()
	return profile.Settings, nil
}

func (s *Service) UpdateSettings(ctx context.Context, userID string, update SettingsUpdate) (StudentSettings, error) {
	profile := s.ensureProfile(userID)
	s.mu.Lock()
	defer s.mu.Unlock()

	if update.Volume != nil {
		vol := *update.Volume
		if vol < 0 {
			vol = 0
		}
		if vol > 100 {
			vol = 100
		}
		profile.Settings.Volume = vol
	}
	if update.LowMotion != nil {
		profile.Settings.LowMotion = *update.LowMotion
	}
	if update.Language != nil && strings.TrimSpace(*update.Language) != "" {
		profile.Settings.Language = *update.Language
	}

	return profile.Settings, nil
}

func (s *Service) ResetProgress(ctx context.Context, userID string) error {
	profile := s.ensureProfile(userID)
	s.mu.Lock()
	defer s.mu.Unlock()

	profile.Progress = make(map[string]StudentLevelProgress)
	profile.SandboxUnlocked = false
	profile.Achievements = AchievementState{}
	profile.Avatar = defaultAvatarState()
	return nil
}

func (s *Service) Avatar(ctx context.Context, userID string) (AvatarState, error) {
	profile := s.ensureProfile(userID)
	s.mu.RLock()
	defer s.mu.RUnlock()
	return profile.Avatar, nil
}

func (s *Service) UpdateAvatar(ctx context.Context, userID string, update AvatarUpdate) (AvatarState, error) {
	profile := s.ensureProfile(userID)
	s.mu.Lock()
	defer s.mu.Unlock()

	if update.Equipped == "" {
		return profile.Avatar, errors.New("请选择要装备的装扮")
	}

	if !contains(profile.Avatar.Unlocked, update.Equipped) {
		return profile.Avatar, fmt.Errorf("装扮 %s 尚未解锁", update.Equipped)
	}

	profile.Avatar.Equipped = update.Equipped
	return profile.Avatar, nil
}

func (s *Service) ensureProfile(userID string) *StudentProfile {
	s.mu.Lock()
	defer s.mu.Unlock()

	if userID == "" {
		userID = "student-demo"
	}

	profile, ok := s.profiles[userID]
	if !ok {
		profile = &StudentProfile{
			ID:           userID,
			Name:         "小冒险家",
			Role:         "student",
			ClassID:      "class-demo",
			Avatar:       defaultAvatarState(),
			Achievements: AchievementState{},
			Settings: StudentSettings{
				Volume:     80,
				LowMotion:  false,
				Language:   "zh-CN",
				Resettable: true,
			},
			SandboxUnlocked: false,
			Progress:        make(map[string]StudentLevelProgress),
		}
		s.profiles[userID] = profile
	}

	return profile
}

func (s *Service) recomputeDerivedState(profile *StudentProfile) {
	totalLevels := 0
	completedLevels := 0
	totalStars := 0
	for _, chapter := range s.chapters {
		totalLevels += len(chapter.Levels)
		for _, level := range chapter.Levels {
			if progress, ok := profile.Progress[level.ID]; ok && progress.Stars > 0 {
				completedLevels++
				totalStars += progress.Stars
			}
		}
	}

	if completedLevels > 0 {
		profile.SandboxUnlocked = true
	} else {
		profile.SandboxUnlocked = false
	}

	profile.Achievements = computeAchievements(profile.Progress, totalLevels, totalStars)
}

func (s *Service) isLevelUnlocked(profile *StudentProfile, chapterID string, levelIndex int) bool {
	if levelIndex == 0 {
		return true
	}
	chapter, _ := s.findChapter(chapterID)
	if chapter == nil {
		return false
	}
	previousLevel := chapter.Levels[levelIndex-1]
	progress, ok := profile.Progress[previousLevel.ID]
	return ok && progress.Stars > 0
}

func (s *Service) findChapter(chapterID string) (*ChapterDefinition, int) {
	for idx, chapter := range s.chapters {
		if chapter.ID == chapterID {
			return &s.chapters[idx], idx
		}
	}
	return nil, -1
}

func (s *Service) findLevelIndex(chapter ChapterDefinition, levelID string) int {
	for idx, level := range chapter.Levels {
		if level.ID == levelID {
			return idx
		}
	}
	return -1
}

func (s *Service) levelOrder(levelID string) int {
	level, ok := s.levels[levelID]
	if !ok {
		return 0
	}
	return level.Order
}

func nullableRewards(rewards LevelRewards) *LevelRewards {
	if rewards == (LevelRewards{}) {
		return nil
	}
	copy := rewards
	return &copy
}

func copyProfile(profile *StudentProfile) StudentProfile {
	clone := *profile
	clone.Progress = make(map[string]StudentLevelProgress, len(profile.Progress))
	for key, value := range profile.Progress {
		clone.Progress[key] = value
	}
	clone.Avatar = AvatarState{
		Equipped: profile.Avatar.Equipped,
		Unlocked: append([]string{}, profile.Avatar.Unlocked...),
	}
	clone.Achievements = AchievementState{
		Badges:     append([]string{}, profile.Achievements.Badges...),
		Compendium: append([]string{}, profile.Achievements.Compendium...),
	}
	return clone
}

func defaultAvatarState() AvatarState {
	return AvatarState{
		Equipped: "冒险家头盔",
		Unlocked: []string{"冒险家头盔"},
	}
}

func unlockAvatar(profile *StudentProfile, outfit string) {
	if outfit == "" {
		return
	}
	if !contains(profile.Avatar.Unlocked, outfit) {
		profile.Avatar.Unlocked = append(profile.Avatar.Unlocked, outfit)
	}
}

func contains(list []string, target string) bool {
	for _, item := range list {
		if item == target {
			return true
		}
	}
	return false
}

func computeAchievements(progress map[string]StudentLevelProgress, totalLevels int, totalStars int) AchievementState {
	badges := []string{}
	compendium := []string{}

	completedCount := 0
	perfectRuns := 0
	for levelID, entry := range progress {
		if entry.Stars > 0 {
			completedCount++
		}
		if entry.Stars == 3 {
			perfectRuns++
			compendium = append(compendium, fmt.Sprintf("%s-3star", levelID))
		}
	}

	if completedCount >= 1 {
		badges = append(badges, "初次通关")
	}
	if completedCount >= 5 {
		badges = append(badges, "冒险旅人")
	}
	if perfectRuns >= 3 {
		badges = append(badges, "完美主义者")
	}
	if totalLevels > 0 && completedCount == totalLevels {
		badges = append(badges, "章节掌控者")
	}
	if totalStars >= 30 {
		badges = append(badges, "星星收藏家")
	}

	sort.Strings(badges)
	sort.Strings(compendium)

	return AchievementState{Badges: badges, Compendium: compendium}
}

func validateProgram(level LevelDefinition, program []Instruction) error {
	if len(program) == 0 {
		return errors.New("请先添加积木再运行程序")
	}
	if len(level.AllowedBlocks) == 0 {
		return nil
	}

	allowed := make(map[string]struct{}, len(level.AllowedBlocks))
	for _, block := range level.AllowedBlocks {
		allowed[block] = struct{}{}
	}

	var validate func(instr Instruction) error
	validate = func(instr Instruction) error {
		blockCode := blockCodeForInstruction(instr)
		if _, ok := allowed[blockCode]; !ok {
			return fmt.Errorf("积木 %s 尚未解锁", blockCode)
		}
		switch instr.Type {
		case "repeat":
			for _, child := range instr.Body {
				if err := validate(child); err != nil {
					return err
				}
			}
		case "conditional":
			for _, child := range instr.Truthy {
				if err := validate(child); err != nil {
					return err
				}
			}
			for _, child := range instr.Falsy {
				if err := validate(child); err != nil {
					return err
				}
			}
		}
		return nil
	}

	for _, instruction := range program {
		if err := validate(instruction); err != nil {
			return err
		}
	}

	return nil
}

func blockCodeForInstruction(instr Instruction) string {
	switch instr.Type {
	case "move":
		return "MOVE"
	case "turn":
		if instr.Direction == "left" {
			return "TURN_LEFT"
		}
		return "TURN_RIGHT"
	case "collect":
		return "COLLECT"
	case "repeat":
		return "REPEAT"
	case "conditional":
		return "CONDITIONAL"
	default:
		return strings.ToUpper(instr.Type)
	}
}

type simulator struct {
	level LevelDefinition
}

func newSimulator(level LevelDefinition) *simulator {
	return &simulator{level: level}
}

func (s *simulator) run(program []Instruction) SimulationResult {
	stepLimit := 200
	if s.level.Goal.StepLimit != nil {
		stepLimit = *s.level.Goal.StepLimit
	}

	log := make([]SimulationStep, 0)
	visited := make(map[string]struct{})

	steps := 0
	position := s.level.Start
	collectibles := 0
	for _, tile := range s.level.Tiles {
		if tile.Collectible != "" {
			collectibles++
		}
	}

	var execute func([]Instruction, int) string
	execute = func(instructions []Instruction, depth int) string {
		if depth > 10 {
			return "E_LOOP_DEPTH"
		}
		for _, instruction := range instructions {
			if steps >= stepLimit {
				return "E_STEP_LIMIT"
			}
			steps++
			log = append(log, SimulationStep{
				Index:        steps,
				Instruction:  instruction,
				Position:     position,
				Collectibles: collectibles,
			})
			switch instruction.Type {
			case "move":
				next := moveForward(position)
				if !s.isWalkable(next.X, next.Y) {
					return "E_COLLIDE"
				}
				position.X = next.X
				position.Y = next.Y
			case "turn":
				position.Facing = rotate(position.Facing, instruction.Direction)
			case "collect":
				if collectible := s.collectibleAt(position.X, position.Y); collectible != "" {
					key := fmt.Sprintf("%d:%d:%s", position.X, position.Y, collectible)
					if _, ok := visited[key]; !ok {
						visited[key] = struct{}{}
						collectibles--
					}
				}
			case "repeat":
				for i := 0; i < instruction.Times; i++ {
					if errCode := execute(instruction.Body, depth+1); errCode != "" {
						return errCode
					}
				}
			case "conditional":
				if instruction.Condition == nil {
					continue
				}
				conditionMet := s.evaluateCondition(*instruction.Condition, position, collectibles)
				branch := instruction.Truthy
				if !conditionMet {
					branch = instruction.Falsy
				}
				if errCode := execute(branch, depth+1); errCode != "" {
					return errCode
				}
			default:
				return fmt.Sprintf("E_UNSUPPORTED_%s", strings.ToUpper(instruction.Type))
			}
		}
		return ""
	}

	errorCode := execute(program, 0)
	success := errorCode == "" && s.meetsGoals(position, collectibles, steps)
	stars := s.calculateStars(success, steps, collectibles)
	if !success && errorCode == "" {
		errorCode = "E_GOAL_NOT_MET"
	}

	result := SimulationResult{
		Success: success,
		Steps:   steps,
		Stars:   stars,
		Log:     log,
		Metadata: SimulationMetadata{
			BestSteps: s.level.BestSteps,
			Goal:      s.level.Goal,
		},
		RemainingCollectibles: collectibles,
	}
	if !success {
		result.ErrorCode = errorCode
	}
	return result
}

func moveForward(position Position) Position {
	switch position.Facing {
	case DirectionNorth:
		position.Y--
	case DirectionSouth:
		position.Y++
	case DirectionWest:
		position.X--
	default:
		position.X++
	}
	return position
}

func rotate(current Direction, turn string) Direction {
	directions := []Direction{DirectionNorth, DirectionEast, DirectionSouth, DirectionWest}
	index := 0
	for i, dir := range directions {
		if dir == current {
			index = i
			break
		}
	}
	if turn == "left" {
		index = (index + len(directions) - 1) % len(directions)
	} else {
		index = (index + 1) % len(directions)
	}
	return directions[index]
}

func (s *simulator) isWalkable(x, y int) bool {
	if x < 0 || y < 0 || x >= s.level.Width || y >= s.level.Height {
		return false
	}
	for _, tile := range s.level.Tiles {
		if tile.X == x && tile.Y == y {
			return tile.Walkable
		}
	}
	return false
}

func (s *simulator) collectibleAt(x, y int) string {
	for _, tile := range s.level.Tiles {
		if tile.X == x && tile.Y == y {
			return tile.Collectible
		}
	}
	return ""
}

func (s *simulator) evaluateCondition(condition Condition, position Position, remaining int) bool {
	switch condition.Type {
	case "tile-ahead-walkable":
		next := moveForward(position)
		return s.isWalkable(next.X, next.Y)
	case "collectibles-remaining":
		return remaining > 0
	default:
		return false
	}
}

func (s *simulator) meetsGoals(position Position, collectibles int, steps int) bool {
	if s.level.Goal.Collectibles != nil && collectibles > 0 {
		return false
	}
	if s.level.Goal.Reach != nil {
		if position.X != s.level.Goal.Reach.X || position.Y != s.level.Goal.Reach.Y {
			return false
		}
	}
	if s.level.Goal.StepLimit != nil && steps > *s.level.Goal.StepLimit {
		return false
	}
	return true
}

func (s *simulator) calculateStars(success bool, steps int, collectibles int) int {
	if !success {
		return 0
	}
	if collectibles > 0 {
		return 1
	}
	if steps <= s.level.BestSteps {
		return 3
	}
	if steps <= s.level.BestSteps+2 {
		return 2
	}
	return 1
}

func computeHint(level LevelDefinition, payload HintRequest) string {
	if payload.Attempts <= 0 {
		if len(level.Hints) > 0 {
			return level.Hints[0]
		}
		return "尝试运行你的方案，看看会发生什么！"
	}
	if payload.LastError != nil {
		switch *payload.LastError {
		case "E_COLLIDE":
			return "前方可能有障碍，试着调整转向积木。"
		case "E_STEP_LIMIT":
			return "步数有点多，考虑使用重复积木。"
		case "E_GOAL_NOT_MET":
			return "别忘了达成所有目标，再检查一下程序。"
		case "E_LOOP_DEPTH":
			return "循环层级太深了，简化一下结构吧。"
		}
	}
	index := payload.Attempts
	if index >= len(level.Hints) {
		index = len(level.Hints) - 1
	}
	if index >= 0 && index < len(level.Hints) {
		return level.Hints[index]
	}
	return "检查一下积木的顺序，也许要换个思路。"
}

func defaultChapters() []ChapterDefinition {
	return []ChapterDefinition{
		{
			ID:      "chapter-1",
			Title:   "顺序启航",
			Summary: "学习基础移动与转向指令",
			Order:   1,
			Levels: []LevelDefinition{
				newLevel("level-1-1", "第一步", 5, 5, []Tile{
					tile(0, 2), tile(1, 2), tile(2, 2), tile(3, 2), tile(4, 2),
				}, Position{X: 0, Y: 2, Facing: DirectionEast}, LevelGoal{
					Reach:     &GoalPosition{X: 4, Y: 2},
					StepLimit: intPtr(8),
				}, 4, []string{
					"点击“运行”看看现在会发生什么。",
					"向前移动几步就能到达终点。",
					"保持朝向不要改变即可完成目标。",
				}, []string{"MOVE"}, "勇敢迈出第一步，沿着大道前进到终点旗帜。", LevelRewards{Outfit: "新手披风", Stars: 3}, "chapter-1", 1),
				newLevel("level-1-2", "直角挑战", 5, 5, []Tile{
					tile(0, 2), tile(1, 2), tile(2, 2), tile(2, 1), tile(2, 0),
				}, Position{X: 0, Y: 2, Facing: DirectionEast}, LevelGoal{
					Reach:     &GoalPosition{X: 2, Y: 0},
					StepLimit: intPtr(10),
				}, 6, []string{
					"抵达终点需要转弯。",
					"先向前移动，再试试向上走。",
					"记得在拐角处使用转向积木。",
				}, []string{"MOVE", "TURN_LEFT", "TURN_RIGHT"}, "穿过拐角，抵达北侧的终点。", LevelRewards{Outfit: "罗盘背包", Stars: 3}, "chapter-1", 2),
				newLevel("level-1-3", "宝石之路", 5, 5, []Tile{
					collectibleTile(0, 2, "gem"), tile(1, 2), collectibleTile(2, 2, "gem"), tile(3, 2), tile(3, 1), tile(3, 0),
				}, Position{X: 0, Y: 2, Facing: DirectionEast}, LevelGoal{
					Reach:        &GoalPosition{X: 3, Y: 0},
					Collectibles: intPtr(0),
					StepLimit:    intPtr(12),
				}, 8, []string{
					"沿途的宝石可以被收集。",
					"走到宝石上使用“收集”积木。",
					"收集所有宝石后再前往终点。",
				}, []string{"MOVE", "TURN_LEFT", "TURN_RIGHT", "COLLECT"}, "沿途收集宝石后到达终点宝箱。", LevelRewards{Outfit: "宝石护目镜", Stars: 3}, "chapter-1", 3),
			},
		},
		{
			ID:      "chapter-2",
			Title:   "循环岛屿",
			Summary: "掌握重复与条件判断",
			Order:   2,
			Levels: []LevelDefinition{
				newLevel("level-2-1", "重复练习", 6, 4, []Tile{
					tile(0, 1), tile(1, 1), tile(2, 1), tile(3, 1), tile(4, 1), tile(5, 1),
				}, Position{X: 0, Y: 1, Facing: DirectionEast}, LevelGoal{
					Reach:     &GoalPosition{X: 5, Y: 1},
					StepLimit: intPtr(8),
				}, 6, []string{
					"多次重复相同操作时可以用“重复”积木。",
					"使用重复积木减少拖拽次数。",
					"尝试设置重复次数为 5。",
				}, []string{"MOVE", "REPEAT"}, "使用重复积木快速到达终点。", LevelRewards{Outfit: "循环披风", Stars: 3}, "chapter-2", 1),
				newLevel("level-2-2", "分岔路口", 6, 4, []Tile{
					tile(0, 1), tile(1, 1), tile(2, 1), tile(2, 2), tile(3, 2), tile(4, 2), tile(5, 2),
				}, Position{X: 0, Y: 1, Facing: DirectionEast}, LevelGoal{
					Reach:        &GoalPosition{X: 5, Y: 2},
					Collectibles: intPtr(0),
					StepLimit:    intPtr(12),
				}, 9, []string{
					"观察岔路前方是否可走。",
					"使用“如果前方可行走”判断路线。",
					"条件成立时再继续向前移动。",
				}, []string{"MOVE", "TURN_RIGHT", "REPEAT", "CONDITIONAL", "COLLECT"}, "用条件判断选择正确的道路。", LevelRewards{Outfit: "探索者斗篷", Stars: 3}, "chapter-2", 2),
			},
		},
	}
}

func newLevel(id, name string, width, height int, tiles []Tile, start Position, goal LevelGoal, bestSteps int, hints []string, blocks []string, comic string, rewards LevelRewards, chapterID string, order int) LevelDefinition {
	return LevelDefinition{
		ID:            id,
		Name:          name,
		Width:         width,
		Height:        height,
		Tiles:         tiles,
		Start:         start,
		Goal:          goal,
		BestSteps:     bestSteps,
		Hints:         hints,
		AllowedBlocks: blocks,
		Comic:         comic,
		Rewards:       rewards,
		ChapterID:     chapterID,
		Order:         order,
	}
}

func tile(x, y int) Tile {
	return Tile{X: x, Y: y, Walkable: true}
}

func collectibleTile(x, y int, collectible string) Tile {
	return Tile{X: x, Y: y, Walkable: true, Collectible: collectible}
}

func intPtr(value int) *int {
	v := value
	return &v
}
