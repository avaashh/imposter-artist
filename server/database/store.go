package database

import "errors"

var database (map[string]map[string]interface{})

func Colors(from int, to int) ([]string, error) {
	colors := [12] string{
		"#800000", // Maroon
		"#9A6324", // Brown
		"#469990", // Teal
		"#000075", // Navy
		"#e6194B", // Red
		"#f58231", // Orange
		"#ffe119", // Yellow
		"#3cb44b", // Green
		"#42d4f4", // Cyan
		"#4363d8", // Blue
		"#f032e6", // Magenta
		"#fabed4", // Pink
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