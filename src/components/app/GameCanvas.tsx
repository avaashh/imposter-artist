import * as React from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

const styles = {
  border: "0.0625rem solid #9c9c9c",
  borderRadius: "0.25rem",
};

interface GameCanvasProps {
  // GameCanvasProps (component props) defined here
}

interface GameCanvasState {
  // GameCanvasState (component states) defined here
  canvasEnabled: boolean;
}

const GameCanvas = class extends React.Component<
  GameCanvasProps,
  GameCanvasState
> {
  private canvas: React.RefObject<ReactSketchCanvasRef>;

  constructor(props: GameCanvasProps) {
    super(props);
    this.canvas = React.createRef<ReactSketchCanvasRef>();
    this.state = {
      canvasEnabled: true, // Enable the canvas initially
    };
  }

  render() {
    const { canvasEnabled } = this.state;
    const allowOnlyPointerType = canvasEnabled ? "all" : "none";

    return (
      <div>
        <ReactSketchCanvas
          ref={this.canvas}
          strokeWidth={5}
          style={styles}
          strokeColor="black"
          onStroke={console.log}
          allowOnlyPointerType={allowOnlyPointerType}
        />
        <button
          onClick={() => {
            if (this.canvas.current !== null)
              this.canvas.current
                .exportSvg()
                .then((data) => {
                  console.log(data);
                })
                .catch((e) => {
                  console.log(e);
                });
          }}
        >
          Get Image
        </button>
        <button
          onClick={() => {
            this.setState({ canvasEnabled: !canvasEnabled });
          }}
        >
          Toggle Drawing Ability
        </button>
      </div>
    );
  }
};

export default GameCanvas;
