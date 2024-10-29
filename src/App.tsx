import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ModelLoader, { FBXModel } from './graphics/ModelLoader'
import CanvasRenderer from './graphics/CanvasRenderer'
import Scrubber, { DefaultScrubberStyle, ScrubberProps } from './components/Scrubber'

function App() {

  const modelLoaderRef = useRef<ModelLoader>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRendererRef = useRef<CanvasRenderer | null>(null)
  const [timelineModel, setTimelineModel] = useState<FBXModel | null>(null)
  const [scrubIndex, setScrubIndex] = useState(0)

  // When the model changes, reset the scrub index to 0 and reset the canvas
  useEffect(() => {
    if (!canvasRef.current) return
    if (!modelLoaderRef.current) {
      modelLoaderRef.current = new ModelLoader()
    }

    setScrubIndex(0)

    const canvasRenderer = new CanvasRenderer(canvasRef.current!)
    canvasRendererRef.current = canvasRenderer
    canvasRenderer.init()

    if (timelineModel) {
      canvasRenderer.addModelToScene(timelineModel)
      canvasRenderer.getCamera().position.set(100, 140, 340)
    }

    canvasRenderer.startRenderLoop()

    return () => {
      // Cleanup
      canvasRenderer.stopRenderLoop()
      canvasRenderer.cleanup()
    }
  }, [timelineModel, setScrubIndex])

  // When the scrub changes, update the animation
  useEffect(() => {
    if (!timelineModel || !canvasRendererRef.current) return

    const mixer = canvasRendererRef.current!.animatedModels.get(timelineModel)
    if (!mixer) return

    mixer.setTime(timelineModel.animations[0].tracks[0].times[scrubIndex])
  }, [scrubIndex, timelineModel])

  // On mount, load the model
  useEffect(() => {
    const loadTimelineModel = async () => {
      const timelineModel = await modelLoaderRef.current!.loadModel('Dance')
      setTimelineModel(timelineModel)
    }

    loadTimelineModel()
  }, [])

  const handleScrub = useCallback((e: any) => {
    setScrubIndex(parseInt(e.target.value))
  }, [])

  const scrubProps = useMemo<ScrubberProps | null>(() => {
    return timelineModel ? {
      className: DefaultScrubberStyle,
      timestamps: timelineModel.animations[0].tracks[0].times,
      index: scrubIndex,
      min: 0,
      max: timelineModel.animations[0].tracks[0].times.length - 1,
      step: 1,
      handleScrub: handleScrub,
    } : null
  }, [timelineModel, scrubIndex, handleScrub])

  return (
    <>
      <div className="h-screen w-screen">
        <canvas id="three_canvas" ref={canvasRef} className="h-full w-full" />
      </div>
      <Scrubber props={scrubProps} />
    </>
  )
}

export default App
