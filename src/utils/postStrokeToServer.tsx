import * as React from "react";

import { Player } from "../types/User";
import { DrawnStroke, Stroke } from "../types/Drawing";

const postStrokeToServer = (user: Player, stroke: Stroke) => {
  const playersStroke: DrawnStroke = {
    owner: user,
    stroke: stroke,
  };

  console.log(playersStroke);
};

export default postStrokeToServer;
