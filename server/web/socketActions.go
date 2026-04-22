package web

// Room lifecycle
const ActionCreateGame = "createGame"
const ActionEndGame = "endGame"
const ActionJoinRandomGame = "joinRandomGame"
const ActionJoinGameWithCode = "joinGameWithCode"
const ActionPlayerJoinedGame = "playerJoinedGame"
const ActionLeaveGame = "leaveGame"
const ActionPlayerLeftGame = "playerLeftGame"
const ActionOwnerChanged = "ownerChanged"

// Lobby configuration
const ActionUpdateGameSettings = "updateGameSettings"
const ActionGameSettingsUpdated = "gameSettingsUpdated"

// Gameplay
const ActionStartGame = "startGame"
const ActionGameStarted = "gameStarted"
const ActionRoleAssigned = "roleAssigned"
const ActionTurnStart = "turnStart"
const ActionEndTurn = "endTurn"
const ActionSendStroke = "sendStroke"
const ActionStrokeProgress = "strokeProgress"
const ActionSendVote = "sendVote"
const ActionVotingStarted = "votingStarted"
const ActionVotingUpdate = "votingUpdate"
const ActionGameOver = "gameOver"
const ActionPlayAgain = "playAgain"
const ActionRoomReset = "roomReset"
const ActionPhaseChange = "phaseChange"
