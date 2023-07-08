import * as React from "react";

import loader from "../assets/img/loader.gif";

const Loader = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <img src={loader} alt="Loading" width={300} />
        <h1 style={{ fontFamily: "Poppins", fontSize: 14 }}>
          Loading Imposter Artist...
        </h1>
      </div>
    </div>
  );
};

export default Loader;
