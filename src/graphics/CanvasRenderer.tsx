import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ModelLoader, { FBXModel } from './ModelLoader';

export default class CanvasRenderer {

    canvas: HTMLCanvasElement
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    animatedModels: Map<FBXModel, THREE.AnimationMixer> = new Map()
    clock = new THREE.Clock()

    constructor(canvas: HTMLCanvasElement) {
        // Canvas setup
        this.canvas = canvas

        // Three.js setup
        this.camera.position.z = 5
        this.renderer = new THREE.WebGLRenderer({ canvas })
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        // TODO: Remove after testing
        // Add a global light source
        const ambientLight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)

        const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0x00ff00 }))
        cube.scale.set(20, 20, 20)
        this.scene.add(cube)

        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableZoom = true
    }

    addModelToScene = (model: FBXModel, autoplay = false) => {
        this.scene.add(model)

        if (model.animations && model.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)

            // Cache it in the map so we can update animation states later
            this.animatedModels.set(model, mixer)

            if (autoplay) {
                const action = mixer.clipAction(model.animations[0])
                console.debug(model.animations[0])
                action.loop = THREE.LoopPingPong
                action.play()
            }
        }
    }

    getCamera = () => {
        return this.camera
    }

    renderFrame = () => {
        /* Update state of scene */
        // Update controls
        this.controls.update()

        // Update animated models in the scene
        const animDeltaTime = this.clock.getDelta()
        for (const [, mixer] of this.animatedModels.entries()) {
            mixer.update(animDeltaTime)
        }

        // Draw call
        this.renderer.render(this.scene, this.camera)
    }

    startRenderLoop = () => {
        this.renderer.setAnimationLoop(this.renderFrame);
    }

    stopRenderLoop = () => {
        this.renderer.setAnimationLoop(null);
    }

    cleanup = () => {
        this.renderer.dispose()
        this.controls.dispose()
    }
}