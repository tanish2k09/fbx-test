import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXModel } from './ModelLoader';

export default class CanvasRenderer {

    canvas: HTMLCanvasElement
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    orbitControls: OrbitControls
    #animatedModels: Map<FBXModel, THREE.AnimationMixer> = new Map()
    clock = new THREE.Clock()

    constructor(canvas: HTMLCanvasElement) {
        // Strictly one-time setup
        this.canvas = canvas
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer({ canvas })
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.orbitControls = new OrbitControls(this.camera, this.canvas)
    }

    init() {
        // Three.js setup
        this.camera.position.z = 5
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        // TODO: Remove after testing
        // Add a global light source
        const ambientLight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)

        const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0x00ff00 }))
        cube.scale.set(20, 20, 20)
        this.scene.add(cube)

        this.orbitControls.enableZoom = true
    }

    addModelToScene = (model: FBXModel) => {
        this.scene.add(model)

        if (model.animations && model.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)

            // Cache it in the map so we can update animation states later
            this.#animatedModels.set(model, mixer)

            const action = mixer.clipAction(model.animations[0])
            action.play()
        }
    }

    renderFrame = () => {
        /* Update state of scene */
        // Update controls
        this.orbitControls.update()

        // Draw call
        this.renderer.render(this.scene, this.camera)
    }

    startRenderLoop = () => {
        this.renderer.setAnimationLoop(this.renderFrame);
    }

    stopRenderLoop = () => {
        this.renderer.setAnimationLoop(null);
    }

    getMixerForModel = (model: FBXModel) => {
        return this.#animatedModels.get(model)
    }

    cleanup = () => {
        console.log('Cleaning up...')
        this.scene.clear()
        this.renderer.dispose()
        this.orbitControls.dispose()
    }
}