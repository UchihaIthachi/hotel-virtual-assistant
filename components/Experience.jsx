"use client";

import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
  useGLTF,
} from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useChat } from "../hooks/useChat";
import  Avatar  from "./Avatar";


const Desk = (props) => {
  const { nodes, materials } = useGLTF(
    "/models/desk2.glb"
  );
  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, 0]} rotation={[-Math.PI / 2,0, Math.PI]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object029_Object029_mtl_0.geometry}
          material={materials.Object029_mtl}
          position={[0, 0, 0]}
          scale={0.00125}
        />
      </group>
    </group>
  );
};

useGLTF.preload(
  "/models/desk2.glb"
);

const Back = (props) => {
  const { nodes, materials } = useGLTF(
    "/models/background.glb"
  );
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.dojo_mockup_mini_material_0.geometry}
          material={materials.mini_material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.dojo_mockup_OH_Outline_Material_0.geometry}
          material={materials.OH_Outline_Material}
        />
      </group>
    </group>
  );
};

useGLTF.preload(
  "/models/background.glb"
);

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] =
    useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(
        () => {
          setLoadingText(
            (loadingText) => {
              if (
                loadingText.length > 2
              ) {
                return ".";
              }
              return loadingText + ".";
            }
          );
        },
        800
      );
      return () =>
        clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text
        fontSize={0.14}
        anchorX={"left"}
        anchorY={"bottom"}
        position={[0.0, 0.1, 0.0]}
      >
        {loadingText}
        <meshBasicMaterial
          attach="material"
          color="white"
        />
      </Text>
    </group>
  );
};

const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    cameraControls.current.setLookAt(
      0,
      2,
      5,
      0,
      1.5,
      0
    );
  }, []);

  useEffect(() => {
    if (cameraZoomed) {
      cameraControls.current.setLookAt(
        0,
        1.5,
        1.5,
        0,
        1.5,
        0,
        true
      );
    } else {
      cameraControls.current.setLookAt(
        0,
        2.2,
        5,
        0,
        1.0,
        0,
        true
      );
    }
  }, [cameraZoomed]);
  return (
    <>
      <CameraControls
        ref={cameraControls}
      />
      <Environment preset="park" />
      {/* Wrapping Dots into Suspense to prevent Blink when Troika/Font is loaded */}
      <Suspense>
        <Dots
          position-y={1.75}
          position-x={-0.02}
        />
      </Suspense>
      <Avatar />
      <Suspense>
        <Desk/>
        <Back/>
      </Suspense>
      <ContactShadows opacity={0.7} />
    </>
  );
};

export default Experience;