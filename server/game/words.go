package game

import (
	"math/rand"
	"strings"
)

// wordsEN is the default English word pool. P4 expands and dedupes this list
// into a file-backed catalogue; for now the in-memory list keeps things
// dependency-free.
var wordsEN = []string{
	"Elephant", "Pizza", "Sunflower", "UFO", "Rollercoaster",
	"Rainstorm", "Toothbrush", "Surfing", "Pirate", "Donut",
	"Space Shuttle", "Kangaroo", "Lighthouse", "Ice Cream Cone", "Parrot",
	"Tornado", "Hammock", "Alarm Clock", "Ballet", "Guitar",
	"Rainbow", "Hippopotamus", "Snowman", "Fireworks", "Astronaut",
	"Zebra", "Mermaid", "Pencil", "Soccer", "Robot",
	"Watermelon", "Cactus", "Scuba Diving", "Bowling", "Penguin",
	"Hot Air Balloon", "Vampire", "Subway", "Popcorn", "Karate",
	"Octopus", "Trampoline", "Camera", "Jellyfish", "Clown",
	"Sushi", "Helicopter", "Surfboard", "Giraffe", "Mountain Climbing",
	"Mosquito", "T-Rex", "Saxophone", "Waterfall", "Palm Tree",
	"Superhero", "Lollipop", "Cupcake", "Parachute", "Ice Skating",
	"Gummy Bear", "Tea Party", "Ostrich", "Pretzel", "Moonwalk",
	"Seahorse", "Picnic", "Pineapple", "Toothpaste", "Cannonball",
	"Kiwi", "Unicycle", "Birthday Cake", "Cheetah", "Balloon",
	"Firefighter", "Butterfly",
}

// RandomWord returns a random word for a given language. Unknown languages
// fall back to the English pool.
func RandomWord(language string) string {
	pool := wordsEN
	switch strings.ToLower(language) {
	case "en", "":
		pool = wordsEN
	}
	if len(pool) == 0 {
		return ""
	}
	return pool[rand.Intn(len(pool))]
}
