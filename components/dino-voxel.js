import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadGLTF } from "../lib/model"
import { VoxelSpinner, VoxelContainer } from "./dino-voxel-loader";

function easeOut(x) {
    return Math.sqrt(1 - Math.pow(x - 1, 3))
}
const DinoVoxel = () => {
    const refContainer = useRef()
    const [loading, setLoading] = useState(true)
    const refRenderer = useRef()
    const handleWindowResize = useCallback(() => {
        const { current: renderer } = refRenderer
        const { current: container } = refContainer
        if (container && renderer) {
            const scW = container.clientWidth
            const scH = container.clientHeight
            renderer.setSize(scW, scH)
        }
    }, [])


    useEffect(() => {
        const { current: container } = refContainer
        if (container) {
            const scW = container.clientWidth
            const scH = container.clientHeight

            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            })
            renderer.setPixelRatio(window.devicePixelRatio)
            renderer.setSize(scW, scH)
            renderer.outputEncoding = THREE.sRGBEncoding
            renderer.domElement.style.objectFit = 'contain'
            container.appendChild(renderer.domElement)
            refRenderer.current = renderer
            const scene = new THREE.Scene()

            const target = new THREE.Vector3(-0.5, 1.2, 0)
            const initialCameraPosition = new THREE.Vector3(
                -30 * Math.sin(0.2 * Math.PI),
                -105,
                -30 * Math.cos(0.2 * Math.PI)
            )

            // 640 -> 240
            // 8   -> 6

            const aspectRatio = container.clientWidth / container.clientHeight;

            const scale = scH * 0.004
            const camera = new THREE.OrthographicCamera(
                -scale * aspectRatio,
                scale * aspectRatio,
                scale,
                -scale,
                0.03,
                50000
            );
            camera.position.copy(initialCameraPosition)
            camera.lookAt(target)

            const ambientLight = new THREE.AmbientLight(0xcccccc, 1)
            scene.add(ambientLight)

            const controls = new OrbitControls(camera, renderer.domElement)
            controls.autoRotate = true
            controls.autoRotateSpeed = -2;
            controls.target = target

            loadGLTF(scene, '/dino-voxel2.glb', {
                receiveShadow: false,
                castShadow: false
            }).then(() => {
                animate()
                setLoading(false)
            })

            let req = null
            let frame = 0
            const animate = () => {
                req = requestAnimationFrame(animate)

                frame = frame <= 100 ? frame + 1 : frame

                if (frame <= 100) {
                    const p = initialCameraPosition
                    const rotSpeed = -easeOut(frame / 120) * Math.PI * 20

                    camera.position.y = 5
                    camera.position.x =
                        p.x * Math.cos(rotSpeed) + p.z * Math.sin(rotSpeed)
                    camera.position.z =
                        p.z * Math.cos(rotSpeed) - p.x * Math.sin(rotSpeed)
                    camera.lookAt(target)
                } else {
                    controls.update()
                }

                renderer.render(scene, camera)
            }

            return () => {
                cancelAnimationFrame(req)
                renderer.domElement.remove()
                renderer.dispose()
            }
        }
    }, [])

    useEffect(() => {
        window.addEventListener('resize', handleWindowResize, false)
        return () => {
            window.removeEventListener('resize', handleWindowResize, false)
        }
    }, [handleWindowResize])

    return (
        <VoxelContainer ref={refContainer}>{loading && <VoxelSpinner />}</VoxelContainer>
    )
}

export default DinoVoxel