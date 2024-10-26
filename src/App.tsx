import { useCallback, useEffect, useRef } from 'react'
import ModelLoader from './graphics/ModelLoader'
import CanvasRenderer from './graphics/CanvasRenderer'

function App() {

  const modelLoaderRef = useRef<ModelLoader>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (!modelLoaderRef.current) {
      modelLoaderRef.current = new ModelLoader()
    }

    const canvasRenderer = new CanvasRenderer(canvasRef.current!)

    const addModels = async () => {
      const backfistModel = await modelLoaderRef.current!.loadModel('Backfist')
      canvasRenderer.addModelToScene(backfistModel, true)
      canvasRenderer.getCamera().position.set(100, 140, 340)
    }

    addModels()
    canvasRenderer.startRenderLoop()

    return () => {
      // Cleanup
      canvasRenderer.stopRenderLoop()
      canvasRenderer.cleanup()
    }
  }, [])

  return (
    <>
      <div className="h-screen w-screen">
        <canvas id="three_canvas" ref={canvasRef} className="h-full w-full" />
      </div>
    </>
  )
}

export default App
