import React from "react";
import devRibbonUrl from "../assets/misc/dev.png";

export default function DevRibbon() {
  return (
    <img
      src={devRibbonUrl}
      alt="Under development"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 140,
        height: "auto",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
