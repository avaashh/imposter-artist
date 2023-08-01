package database

import "errors"


var database (map[string]map[string]interface{})

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