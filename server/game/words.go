package game

import (
	"math/rand"
	"strings"
)

// wordsEN is the default English word pool for Imposter Artist. The words
// are chosen to be drawable in a single messy stroke and recognizable
// enough that an artist can play along convincingly. If you add more,
// avoid near-duplicates (e.g. both "cat" and "kitten") so two artists
// don't end up drawing the same thing independently.
var wordsEN = []string{
	// Animals
	"Elephant", "Kangaroo", "Giraffe", "Zebra", "Penguin",
	"Parrot", "Octopus", "Jellyfish", "Seahorse", "Hippopotamus",
	"Cheetah", "Ostrich", "Mosquito", "Butterfly", "Dragonfly",
	"Rhino", "Panda", "Koala", "Sloth", "Walrus",
	"Narwhal", "Flamingo", "Peacock", "Toucan", "Hedgehog",
	"Raccoon", "Squirrel", "Armadillo", "Pufferfish", "Crocodile",
	"Gorilla", "Llama", "Hamster", "Platypus", "Chameleon",
	"Shark", "Dolphin", "Starfish", "Crab", "Lobster",
	"Owl", "Eagle", "Bat", "Snail", "Caterpillar",
	"Tiger", "Wolf", "Fox", "Bear", "Otter",

	// Food & drink
	"Pizza", "Donut", "Ice Cream Cone", "Popcorn", "Sushi",
	"Lollipop", "Cupcake", "Watermelon", "Pineapple", "Pretzel",
	"Gummy Bear", "Birthday Cake", "Hot Dog", "Sandwich", "Burger",
	"Taco", "Burrito", "Pancakes", "Waffle", "Bagel",
	"Spaghetti", "Ramen", "Strawberry", "Banana", "Avocado",
	"Corn", "Carrot", "Mushroom", "Cheese", "Toast",
	"Cookie", "Pie", "Milkshake", "Smoothie", "Tea",

	// Sports & activities
	"Surfing", "Ballet", "Karate", "Scuba Diving", "Bowling",
	"Mountain Climbing", "Ice Skating", "Moonwalk", "Skateboarding", "Cycling",
	"Archery", "Juggling", "Yoga", "Chess", "Fishing",
	"Hiking", "Camping", "Tennis", "Soccer", "Basketball",
	"Skiing", "Snowboarding", "Boxing", "Golf", "Volleyball",

	// Objects
	"Toothbrush", "Toothpaste", "Alarm Clock", "Guitar", "Saxophone",
	"Camera", "Pencil", "Hammock", "Lighthouse", "Umbrella",
	"Telescope", "Microscope", "Sunglasses", "Backpack", "Wallet",
	"Suitcase", "Lantern", "Compass", "Map", "Clock",
	"Candle", "Scissors", "Magnet", "Key", "Lock",
	"Mailbox", "Wrench", "Hammer", "Ladder", "Toaster",
	"Blender", "Kettle", "Broom", "Vacuum", "Fan",

	// Nature & weather
	"Sunflower", "Cactus", "Palm Tree", "Rainbow", "Rainstorm",
	"Tornado", "Waterfall", "Snowman", "Fireworks", "Meteor",
	"Iceberg", "Volcano", "Cloud", "Beach", "Forest",

	// Places & buildings
	"Castle", "Pyramid", "Windmill", "Igloo", "Tent",
	"Treehouse", "Skyscraper", "Barn", "Temple", "Bridge",

	// Fantasy & fiction
	"Unicorn", "Dragon", "Mermaid", "Vampire", "Superhero",
	"Robot", "UFO", "Pirate", "Wizard", "Ghost",
	"Astronaut", "Clown", "T-Rex", "Zombie", "Witch",

	// Transportation
	"Rollercoaster", "Space Shuttle", "Hot Air Balloon", "Subway", "Helicopter",
	"Surfboard", "Unicycle", "Submarine", "Sailboat", "Train",
	"Motorcycle", "Tractor", "Ambulance", "Firetruck", "Rocket",

	// Misc scenes
	"Tea Party", "Picnic", "Parachute", "Trampoline", "Cannonball",
	"Campfire", "Piñata", "Disco", "Kite", "Juggling Pins",
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
