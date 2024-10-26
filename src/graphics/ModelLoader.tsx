import { Group, Object3DEventMap } from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"

export type FBXModel = Group<Object3DEventMap>

export default class ModelLoader {

    loadModel = (name: String): Promise<FBXModel> => {
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader()
            loader.load('/models/' + name + '.fbx', (model) => {
                resolve(model)
            }, undefined, reject)
        })
    }
}