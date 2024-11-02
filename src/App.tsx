import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ModelLoader, { FBXModel } from './graphics/ModelLoader'
import CanvasRenderer from './graphics/CanvasRenderer'
import Scrubber, { DefaultScrubberStyle, ScrubberProps } from './components/Scrubber'
import { Bone, Object3D, SkinnedMesh } from 'three'
import { CCDIKSolver, TransformControls } from 'three/examples/jsm/Addons.js'

// FIX: Component assumes model always has animations
function App() {

  const modelLoaderRef = useRef<ModelLoader>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRendererRef = useRef<CanvasRenderer | null>(null)
  const [timelineModel, setTimelineModel] = useState<FBXModel | null>(null)
  const [scrubIndex, setScrubIndex] = useState(0)

  // console.warn(timelineModel)

  // Make sure we have our model loader ready (only once)
  if (!modelLoaderRef.current) {
    modelLoaderRef.current = new ModelLoader()
  }

  const loadModel = useCallback(async (modelName: string) => {
    const model = await modelLoaderRef.current!.loadModel(modelName)
    setTimelineModel(model)
  }, [])

  // When the model changes, reset the scrub index to 0 and reset the canvas
  useEffect(() => {
    if (!canvasRef.current || !timelineModel) return

    // When a new model is loaded, reset the scrub index
    setScrubIndex(0)

    const canvasRenderer = new CanvasRenderer(canvasRef.current!)
    canvasRendererRef.current = canvasRenderer
    canvasRenderer.init()

    // Generate IK components
    canvasRenderer.addModelToScene(timelineModel)
    canvasRenderer.camera.position.set(100, 140, 340)

    const [transformControls] = generateIKComponents(timelineModel, canvasRenderer)
    if (transformControls) {
      canvasRenderer.scene.add(transformControls.getHelper())
    }
    // canvasRenderer.scene.add(solver.createHelper())

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

    const mixer = canvasRendererRef.current!.getMixerForModel(timelineModel)
    if (!mixer) return

    mixer.setTime(timelineModel.animations[0].tracks[0].times[scrubIndex])
  }, [scrubIndex, timelineModel])

  // On mount, load the model
  useEffect(() => {
    loadModel('Backfist')
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

const generateIKComponents = (model: FBXModel, canvasRenderer: CanvasRenderer) => {
  const bodyParams: { body?: SkinnedMesh, target?: Bone, reference?: Bone } = {}

  model.traverse((child) => {
    if (child.name === 'H_DDS_MidRes' && child instanceof SkinnedMesh) {
      // Do something with the mesh
      bodyParams.body = child
    }
  })

  // Nothing to do if we don't have a body
  if (!bodyParams.body) return [undefined]

  const skeleton = bodyParams.body.skeleton

  // If the target bone doesn't exist, make one
  if (skeleton.bones[skeleton.bones.length - 1].name !== 'target') {
    const leftHandBone = skeleton.bones[31]
    const targetBone = new Bone()
    targetBone.copy(leftHandBone)
    targetBone.name = 'target'
    targetBone.userData = {}
    targetBone.children = []
    targetBone.parent = leftHandBone.parent

    // Update other info
    const boneMatrix = skeleton.boneMatrices.slice(31 * 16, 32 * 16)
    const newMatrices = new Float32Array(skeleton.boneMatrices.length + 16)
    newMatrices.set(skeleton.boneMatrices)
    newMatrices.set(boneMatrix, skeleton.boneMatrices.length)

    const targetInverse = skeleton.boneInverses[31].clone()

    skeleton.boneInverses.push(targetInverse)
    skeleton.boneMatrices = newMatrices
    skeleton.bones.push(targetBone)

    console.debug(leftHandBone)
    console.debug(targetBone)
  }

  // Set the target bone, which is the last bone
  bodyParams.target = skeleton.bones[skeleton.bones.length - 1]

  // Add transform controller to the scene
  const transformControls = new TransformControls(canvasRenderer.camera, canvasRenderer.canvas);
  transformControls.size = 0.75;
  transformControls.space = 'world';
  transformControls.attach(bodyParams.target);

  console.debug(transformControls.getHelper().position)
  console.debug(bodyParams.target.position)


  // disable orbitControls while using transformControls
  transformControls.addEventListener('mouseDown', () => canvasRenderer.orbitControls.enabled = false);
  transformControls.addEventListener('mouseUp', () => canvasRenderer.orbitControls.enabled = true);

  // const iks = [
  //   {
  //     target: bodyParams.body.skeleton.bones.length - 1,
  //     effector: 31,
  //     links: [
  //       {
  //         index: 30
  //       },
  //       {
  //         index: 29
  //       }
  //     ]
  //   }
  // ]

  // Create the IK solver
  // const solver = new CCDIKSolver(bodyParams.body, iks)

  // Add components to the scene
  return [transformControls,]
}

export default App
