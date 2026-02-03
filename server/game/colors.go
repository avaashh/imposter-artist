package game

import "math/rand"

// palette is drawn in order — we shuffle at room start and hand each player a
// stable color for the whole game.
var palette = []string{
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
	"#7f00ff",
}

// AssignColors returns n shuffled colors from the palette. If n exceeds the
// palette size, colors wrap.
func AssignColors(n int) []string {
	if n <= 0 {
		return nil
	}
	shuffled := make([]string, len(palette))
	copy(shuffled, palette)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})
	out := make([]string, n)
	for i := 0; i < n; i++ {
		out[i] = shuffled[i%len(shuffled)]
	}
	return out
}
