package database

import (
	"errors"
	"math/rand"
)

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

func GetWordForRound() string {
	listOfWords := []string{
		"Elephant", "Pizza", "Sunflower", "UFO", "Rollercoaster",
		"Rainstorm", "Toothbrush", "Surfing", "Pirate", "Donut",
		"Space Shuttle", "Kangaroo", "Lighthouse", "Ice Cream Cone", "Parrot",
		"Tornado", "Hammock", "Alarm Clock", "Ballet", "Guitar",
		"Rainbow", "Hippopotamus", "Snowman", "Fireworks", "Astronaut",
		"Zebra", "Mermaid", "Pencil", "Soccer", "Robot",
		"Watermelon", "Cactus", "Scuba Diving", "Bowling", "Penguin",
		"Hot Air Balloon", "Vampire", "Subway", "Popcorn", "Karate",
		"Octopus", "Trampoline", "Kangaroo", "Camera", "Jellyfish", 
		"Clown", "Sushi", "Kangaroo", "Helicopter", "Surfboard", 
		"Giraffe", "Mountain Climbing", "Mosquito", "T-Rex", "Saxophone", 
		"Waterfall", "Ballet", "Palm Tree", "Superhero", "Lollipop", 
		"Cupcake", "Parachute", "Kangaroo", "Ice Skating", "Gummy Bear", 
		"Giraffe", "Tea Party", "Kangaroo", "Bowling", "Ostrich", 
		"Pretzel", "Moonwalk", "Seahorse", "Kangaroo", "Picnic", 
		"Pineapple", "Toothpaste", "Cannonball", "Kiwi", "Unicycle", 
		"Giraffe", "Popcorn", "Astronaut", "Robot", "Ice Cream Sundae", 
		"Tornado", "Kangaroo", "Balloon", "Firefighter", "Helicopter", 
		"Butterfly", "Birthday Cake", "Vampire", "Superhero", "Cheetah", 
		"Soccer", "Zebra", "Jellyfish", "Rainbow", "Pirate", 
	}
	return listOfWords[rand.Intn(len(listOfWords))]
}
