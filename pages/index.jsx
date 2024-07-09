// pages/index.js
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Leva } from 'leva';
import Experience from '../components/Experience';
import UI from '../components/UI';
import { useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';

export default function Home() {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const { chat, message, onMessagePlayed, loading, cameraZoomed, setCameraZoomed } = useChat();

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial size on component mount
    handleResize();

    // Event listener for resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <Loader />
      <Leva hidden />
      <UI />
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Canvas
          style={{ display: 'block' }}
          shadows
          camera={{ position: [0, 0, 1], fov: 40 }}
          resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
          {...canvasSize}
        >
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Experience />
        </Canvas>
      </div>
    </>
  );
}
