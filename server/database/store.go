package database

import (
	"errors"
	"math/rand"
)

var database (map[string]map[string]interface{})

func Colors(from int, to int) ([]string, error) {
	colors := [12] string{
		"#8b4513",
		"#228b22",
		"#4b0082",
		"#ff0000",
		"#ffff00",
		"#00ff00",
		"#00ffff",
		"#ff00ff",
		"#6495ed",
		"#ffe4b5",
		"#ff69b4",
	}

	// Shuffle colors
	for i := range colors {
		j := rand.Intn(i + 1)
		colors[i], colors[j] = colors[j], colors[i]
	}

	if from < 0 || from >= len(colors) || to < 0 || to >= len(colors) {
		return nil, errors.New("Colors out of bounds")
	}

	return  colors[from : to], nil
}

func Store(location string, key string, value interface{}, force bool) bool {
	if database == nil {
		database = make(map[string]map[string]interface{})
	}

	if _, ok := database[location]; !ok {
		database[location] = make(map[string]interface{})
	}

	if _, ok := database[location][key]; ok && !force {
		return false
	}

	database[location][key] = value
	return true
}

func Fetch(location string, key string) (interface{}, error) {
	if database == nil {
		return nil, errors.New("database not yet initialized")
	}
	if _, ok := database[location]; !ok {
		return nil, errors.New("location " + location + " doesnt exist")
	}
	if result, ok := database[location][key]; !ok {
		return nil, errors.New("key " + key + " doesnt exist")
	} else {
		return result, nil
	}
}