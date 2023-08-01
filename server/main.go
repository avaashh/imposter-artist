package main

import (
	"math/rand"
	"time"

	"imposterArtist/dist"
)


func main() {
	rand.Seed(time.Now().UnixNano())
	dist.AppServer();
}