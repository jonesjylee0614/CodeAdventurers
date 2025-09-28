package config

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// LoadDotEnv walks up from the current working directory to locate a .env file
// and loads it into the process environment. It returns the loaded file path or
// fs.ErrNotExist if no file is found.
func LoadDotEnv() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("get working directory: %w", err)
	}

	seen := make(map[string]struct{})
	for {
		if _, ok := seen[cwd]; ok {
			break
		}
		seen[cwd] = struct{}{}

		candidate := filepath.Join(cwd, ".env")
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			if err := godotenv.Overload(candidate); err != nil {
				return candidate, fmt.Errorf("load %s: %w", candidate, err)
			}
			return candidate, nil
		}

		parent := filepath.Dir(cwd)
		if parent == cwd {
			break
		}
		cwd = parent
	}

	return "", fs.ErrNotExist
}
