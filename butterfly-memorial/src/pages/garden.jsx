import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import GardenControls from "../components/GardenControls";
import FlyingButterfly from "../components/FlyingButterfly";
import { useButterflyPhysics } from "../hooks/useButterflyPhysics";
import FlowersBackground from "../assets/backgrounds/background__homepage.png";
import MountainBackgroundGif from "../assets/backgrounds/background_mountain__HD.gif";
import TropicalBackgroundGif from "../assets/backgrounds/background_tropical__HD.gif";
import LakeBackgroundGif from "../assets/backgrounds/background_lake__HD.gif";
import "./spirit-butterfly.css";

const BACKGROUNDS = {
  flowers: FlowersBackground,
  mountain: MountainBackgroundGif,
  tropical: TropicalBackgroundGif,
  lake: LakeBackgroundGif,
};

export default function Garden() {
  const { gardenId } = useParams();
  const stageRef = useRef(null);

  const [garden, setGarden] = useState(null);
  const [honoree, setHonoree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [butterflies, setButterflies] = useState([]);

  const butterflyStates = useButterflyPhysics(butterflies, stageRef);

  useEffect(() => {
    if (!gardenId) return;

    const fetchData = async () => {
      try {
        const gardenDoc = doc(db, "gardens", gardenId);
        const gardenSnap = await getDoc(gardenDoc);

        if (gardenSnap.exists()) {
          const gardenDataLocal = gardenSnap.data();
          setGarden({ id: gardenSnap.id, ...gardenSnap.data() });

          const honoreeSnap = await getDoc(gardenDataLocal.honoree);
          if (honoreeSnap.exists()) {
            setHonoree({ id: honoreeSnap.id, ...honoreeSnap.data() });
          } else {
            setError("Honoree not found");
          }
        } else {
          setError("Garden not found");
        }

        setLoading(false);
      } catch (err) {
        setError("Error loading garden: " + err.message);
        setLoading(false);
      }
    };

    const q = query(collection(db, "butterflies"), where("gardenId", "==", gardenId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const butterflyList = [];
      querySnapshot.forEach((doc) => {
        butterflyList.push({ id: doc.id, ...doc.data() });
      });
      setButterflies(butterflyList);
    });

    fetchData();

    return unsubscribe;
  }, [gardenId]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading garden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!garden) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Garden not found</p>
      </div>
    );
  }

  const backgroundImage = BACKGROUNDS[garden.style] || BACKGROUNDS.flowers;

  return (
    <div
      className="page full-page"
      style={{
        position: "relative",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="wrap full-wrap" style={{ padding: 0 }}>
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            className="brand"
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              background: "#ffffffb8",
              boxShadow: "0 8px 24px var(--ring)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="logo" aria-hidden="true">
              🦋
            </div>
            <h1 className="h1">Spirit Butterfly</h1>
          </Link>
          <div className="cta-row" style={{ margin: 0 }}>
            <Link to="/create" className="btn ghost">
              Create a Garden
            </Link>
          </div>
        </div>

        <main className="garden-stage">
          <div ref={stageRef} className="garden">
            {butterflyStates.map((s) => (
              <FlyingButterfly
                key={s.id}
                x={s.x}
                y={s.y}
                size={s.size}
                direction={s.direction}
                imageIndex={s.imageIndex}
                label={s.label}
                isLanded={s.isLanded}
              />
            ))}

            <div className="identity-card" style={{ zIndex: 22 }}>
              {honoree.photo ? (
                <img src={honoree.photo} alt="" className="identity-photo" />
              ) : (
                <div className="identity-photo placeholder" />
              )}
              <div>
                <div className="identity-name">{`${honoree.first_name} ${honoree.last_name}`}</div>
                <div className="sub">{honoree.dates || "—"}</div>
              </div>
            </div>

            {/* <div className="message-ribbon">
              <div className="sub" style={{ textAlign: "center" }}>
                {honoree.message || "This garden is a serene space for memories and butterflies."}
              </div>
            </div> */}

            <GardenControls butterflies={butterflies} gardenId={gardenId} />
          </div>
        </main>
      </div>
    </div>
  );
}
