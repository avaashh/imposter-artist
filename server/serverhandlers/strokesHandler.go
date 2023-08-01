package serverhandlers

import (
	"encoding/json"

	"imposterArtist/database"
	"imposterArtist/types"

	"github.com/gorilla/websocket"
)

func HandleIncomingStrokes(
	roomId string,
	strokeData []interface{},
	conn *websocket.Conn,
	messageType int,

	response map[string]interface{},
	res types.Response,
) types.Response {

	// Now, 'strokeData' contains the array of points (maps).
	// Convert the data to a Stroke struct.
	stroke := make(types.Stroke, 0)
	for _, pointData := range strokeData {
		pointMap, ok := pointData.(map[string]interface{})
		if !ok {
			response["err"] = "Cound not understand stroke"
			return res
		}

		x, xOk := pointMap["x"].(float64)
		y, yOk := pointMap["y"].(float64)
		color, colorOk := pointMap["color"].(string)

		if !xOk || !yOk || !colorOk {
			response["err"] = "Invalid stroke data format"
			return res
		}

		// Create a Point struct and append it to the Stroke slice
		point := types.Point{
			X:     x,
			Y:     y,
			Color: color,
		}
		stroke = append(stroke, point)
	}

	room, err := database.Fetch("gamerooms", roomId)
	if err != nil {
		response["err"] = "Could not find game room"
		return res
	}

	response["success"] = true
	response["roomId"] = roomId
	response["sentStroke"] = stroke

	byteReturn, _ := json.Marshal(res)

	gameRoom := room.(types.GameRoom)
	for _, c := range gameRoom.PlayersConn {
		if c != conn {
			c.WriteMessage(messageType, byteReturn)
		}
	}

	response["sentStroke"] = nil
	return res
}