package game

import "testing"

func TestAssignColors_ReturnsNilForZeroOrNegative(t *testing.T) {
	if got := AssignColors(0); got != nil {
		t.Errorf("AssignColors(0) = %v, want nil", got)
	}
	if got := AssignColors(-3); got != nil {
		t.Errorf("AssignColors(-3) = %v, want nil", got)
	}
}

func TestAssignColors_UniqueWithinPalette(t *testing.T) {
	n := 6
	got := AssignColors(n)
	if len(got) != n {
		t.Fatalf("len = %d, want %d", len(got), n)
	}
	seen := map[string]bool{}
	for _, c := range got {
		if seen[c] {
			t.Errorf("duplicate color %q returned when n <= palette size", c)
		}
		seen[c] = true
	}
}

func TestAssignColors_WrapsWhenOverflowingPalette(t *testing.T) {
	n := len(palette) + 3
	got := AssignColors(n)
	if len(got) != n {
		t.Fatalf("len = %d, want %d", len(got), n)
	}
	// Every returned color must come from the palette.
	inPalette := map[string]bool{}
	for _, c := range palette {
		inPalette[c] = true
	}
	for _, c := range got {
		if !inPalette[c] {
			t.Errorf("color %q is not from the palette", c)
		}
	}
}
