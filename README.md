## Imposter Artist

Imposter Artist is a web application that brings the popular party game, Imposter Artist, to the digital realm. Enjoy hours of creative deception and deduction with your friends from anywhere, anytime.

### Features

- **Real-time Collaboration:** Collaborate with other players on a shared drawing canvas in real-time.
- **Role Assignments:** Players are assigned roles as artists or imposters.
- **Customizable Rooms:** Create or join rooms with customizable settings such as maximum players and imposters, language, drawing time, and rounds.
- **Lobby Functionality:** Invite friends and manage room settings from the lobby.
- **Random Word/Phrase Generation:** Non-imposter players receive random words or phrases for drawing.
- **Frontend State Management:** Use Redux for frontend state management, including persistence of player names and characters.
- **Backend Server in Go:** The backend server is implemented in Go, utilizing Gorilla WebSockets for real-time communication.
- **Database Integration:** Connect to a database for word or phrase retrieval.

### Getting Started

To get started with Imposter Artist, follow these steps:

1. Clone the repository:

`git clone https://github.com/avaashh/imposter-artist.git`

2. Navigate to the project directory:

`cd imposter-artist`

3. Install dependencies for the frontend:

`yarn install`

4. Run the frontend application:

`yarn start`

5. Navigate to the `server` directory:

`cd server`

6. Install dependencies for the backend:

`go get ./...`

7. Start the backend server:

`go run main.go`

8. Access the application in your web browser at `http://localhost:3000`.

### Objectives:

1. (✅) Create Rooms
2. (✅) Join Rooms with code
3. (➖) Join random open rooms
4. (✅) Players join game room
5. (➖) Room owner priviledges to change room settings
6. (➖) Kick/ban users from room
7. (✅) Randomize colors each game for players
8. (✅) Send strokes to all players except the creator of stroke
9. (➖) Fetch a random word from database for each round
10. (➖) Create a turn system for drawing
11. (➖) Add a voting system

### Contributing

Contributions are welcome! If you find a bug, have suggestions for improvements, or would like to add new features, please open an issue or submit a pull request.

When contributing, please follow the existing coding style and adhere to the project's license.

### License

This project is licensed under the [GPL-3.0 license](https://github.com/avaashh/imposter-artist/blob/main/LICENSE).

### Bootstrapping

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and [Golang Init](https://go.dev/doc/modules/managing-dependencies#naming_module)
