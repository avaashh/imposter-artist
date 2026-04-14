import reducer, { ReduxState } from "./reducer";
import * as actions from "./redux-actions";
import { Player } from "../../types/User";

const player: Player = {
  id: "p1",
  playerName: "Alice",
  character: { characterIdentity: "0", characterColor: "#ffffff" },
};

describe("reducer", () => {
  it("returns an empty state when given an unknown action", () => {
    const out = reducer(undefined, { type: "noop" });
    expect(out).toEqual({});
  });

  it("updatePlayer sets the current player", () => {
    const out = reducer({}, { type: actions.updatePlayer, payload: player });
    expect(out.player).toEqual(player);
  });

  it("playerUsernameChanged mutates the name when a player is present", () => {
    const state: ReduxState = { player };
    const out = reducer(state, {
      type: actions.playerUsernameChanged,
      payload: { playerName: "Bob" },
    });
    expect(out.player?.playerName).toBe("Bob");
    expect(out.player?.id).toBe("p1"); // other fields intact
  });

  it("playerUsernameChanged is a no-op when there is no player", () => {
    const out = reducer(
      {},
      { type: actions.playerUsernameChanged, payload: { playerName: "Bob" } }
    );
    expect(out).toEqual({});
  });

  it("setPhase, setRole, setTurn, setVotingProgress, setGameResult each store their payload", () => {
    const s1 = reducer({}, { type: actions.setPhase, payload: "voting" });
    expect(s1.phase).toBe("voting");

    const role = { isImposter: false, word: "elephant", roomId: "ROOM" };
    const s2 = reducer({}, { type: actions.setRole, payload: role });
    expect(s2.role).toEqual(role);

    const turn = {
      currentPlayerId: "p1",
      round: 1,
      totalRounds: 2,
      turnDurationSecs: 30,
      startedAt: 0,
    };
    const s3 = reducer({}, { type: actions.setTurn, payload: turn });
    expect(s3.turn).toEqual(turn);

    const voting = {
      votedPlayerIds: ["p1"],
      totalVotes: 1,
      totalPlayers: 3,
    };
    const s4 = reducer({}, { type: actions.setVotingProgress, payload: voting });
    expect(s4.voting).toEqual(voting);

    const result = {
      imposterWon: true,
      imposterPlayerId: "p2",
      secretWord: "elephant",
      voteTally: { p2: 2, p1: 1 },
    };
    const s5 = reducer({}, { type: actions.setGameResult, payload: result });
    expect(s5.result).toEqual(result);
  });

  it("resetGameMeta clears per-game state but keeps the player", () => {
    const state: ReduxState = {
      player,
      role: { isImposter: true, roomId: "ROOM" },
      turn: {
        currentPlayerId: "p1",
        round: 2,
        totalRounds: 2,
        turnDurationSecs: 30,
        startedAt: 0,
      },
      phase: "ended",
      result: {
        imposterWon: true,
        imposterPlayerId: "p1",
        secretWord: "elephant",
        voteTally: {},
      },
      voting: { votedPlayerIds: [], totalVotes: 0, totalPlayers: 3 },
    };
    const out = reducer(state, { type: actions.resetGameMeta });

    expect(out.player).toEqual(player);
    expect(out.role).toBeNull();
    expect(out.turn).toBeNull();
    expect(out.phase).toBeNull();
    expect(out.result).toBeNull();
    expect(out.voting).toBeNull();
  });
});
