"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, DRACOLoader, RGBELoader } from "three-stdlib";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/professional.glb";
const LEGACY_SCENE_PATH = "/models/character.glb";
const ANIMATION_FILES = [
    "characters3d.com - Code Type .glb",
    "characters3d.com - Type Passcode.glb",
    "characters3d.com - Idle Look Around .glb",
    "characters3d.com - Idle.glb",
    "characters3d.com - Professional Patrick.glb",
];

const LEGACY_CHARACTER_NODE_PATTERN =
    /(mixamorig|spine|neck|head|arm|leg|hand|foot|hips|thigh|calf|toe|eye|brow|character|body)/i;

const LEGACY_PROP_NODE_NAMES = [
    "screenlight",
    "Keyboard",
    "Plane.002",
    "Plane.003",
    "Plane.004",
];

const LEGACY_COMPUTER_NODE_NAMES = ["Keyboard", "Plane.002", "Plane.003", "Plane.004", "screenlight"];
const LEGACY_COMPUTER_FORWARD_OFFSET = 0.7;
const LEGACY_COMPUTER_TO_CHARACTER_X_OFFSET = -1.35;
const HIDE_CHARACTER_MESH_NAMES = ["Object_6"];

const findObjectByNames = (root: THREE.Object3D, names: string[]) => {
    for (const name of names) {
        const node = root.getObjectByName(name);
        if (node) return node;
    }
    return null;
};

const collectUniqueClips = (clips: THREE.AnimationClip[]) => {
    const clipMap = new Map<string, THREE.AnimationClip>();
    clips.forEach((clip) => {
        if (!clipMap.has(clip.name)) {
            clipMap.set(clip.name, clip);
        }
    });
    return Array.from(clipMap.values());
};

const normalizeClipName = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const findBestClipByKeywords = (clips: THREE.AnimationClip[], keywords: string[]) => {
    const normalizedKeywords = keywords.map(normalizeClipName);
    let bestClip: THREE.AnimationClip | null = null;
    let bestScore = 0;

    clips.forEach((clip) => {
        const clipName = normalizeClipName(clip.name || "");
        const score = normalizedKeywords.reduce((acc, keyword) => {
            if (!keyword) return acc;
            return clipName.includes(keyword) ? acc + keyword.length : acc;
        }, 0);

        if (score > bestScore) {
            bestScore = score;
            bestClip = clip;
        }
    });

    return bestClip;
};

const LANDING_RIG_Y_OFFSET = -1.2;

const fitModelToView = (model: THREE.Object3D, targetHeight = 15) => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    if (size.y > 0) {
        const scale = targetHeight / size.y;
        model.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);
    const min = scaledBox.min.clone();

    model.position.x -= scaledCenter.x;
    model.position.z -= scaledCenter.z;
    model.position.y -= min.y;
};

const fitRigToCharacter = (rig: THREE.Object3D, character: THREE.Object3D, targetHeight = 16) => {
    const characterBox = new THREE.Box3().setFromObject(character);
    const characterSize = new THREE.Vector3();
    characterBox.getSize(characterSize);

    if (characterSize.y > 0) {
        const scale = targetHeight / characterSize.y;
        rig.scale.setScalar(scale);
    }

    rig.updateMatrixWorld(true);

    const scaledCharacterBox = new THREE.Box3().setFromObject(character);
    const center = new THREE.Vector3();
    scaledCharacterBox.getCenter(center);
    const min = scaledCharacterBox.min.clone();

    rig.position.x -= center.x;
    rig.position.z -= center.z;
    rig.position.y -= min.y;
};

const sanitizeAnimationClip = (clip: THREE.AnimationClip) => {
    const filteredTracks = clip.tracks.filter((track) => {
        const name = track.name.toLowerCase();

        if (name.endsWith(".scale")) {
            return false;
        }

        if (!name.endsWith(".position")) {
            return true;
        }

        const isRootLikePosition =
            name.includes("hips.position") ||
            name.includes("pelvis.position") ||
            name.includes("root.position") ||
            name.includes("armature.position");

        return !isRootLikePosition;
    });

    return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
};

const addLegacyPropsToRig = (legacyScene: THREE.Object3D, rig: THREE.Object3D) => {
    let added = 0;
    const propsGroup = new THREE.Group();
    propsGroup.name = "legacy-props-group";

    legacyScene.updateWorldMatrix(true, true);

    LEGACY_PROP_NODE_NAMES.forEach((name) => {
        const sourceNode = legacyScene.getObjectByName(name);
        if (!sourceNode) return;

        sourceNode.updateWorldMatrix(true, false);

        const propNode = sourceNode.clone(true);
        propNode.matrixAutoUpdate = true;
        propNode.matrix.copy(sourceNode.matrixWorld);
        propNode.matrix.decompose(propNode.position, propNode.quaternion, propNode.scale);

        propNode.traverse((object: any) => {
            const objectName = (object.name || "").toLowerCase();
            const isBone = object.isBone === true;
            const isSkinnedMesh = object.isSkinnedMesh === true;

            if (isBone || isSkinnedMesh || LEGACY_CHARACTER_NODE_PATTERN.test(objectName)) {
                object.visible = false;
                return;
            }

            if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material: any) => {
                    material.transparent = true;
                    if (material.opacity === undefined || material.opacity < 0.95) {
                        material.opacity = 1;
                    }
                    material.needsUpdate = true;
                });
            }
        });

        propsGroup.add(propNode);
        added += 1;
    });

    if (added === 0) {
        const fallback = legacyScene.clone(true);
        fallback.traverse((object: any) => {
            const objectName = (object.name || "").toLowerCase();
            if (object.isBone || object.isSkinnedMesh || LEGACY_CHARACTER_NODE_PATTERN.test(objectName)) {
                object.visible = false;
            }
        });
        propsGroup.add(fallback);
    }

    rig.add(propsGroup);
    return propsGroup;
};

export const Character3D = () => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);

        updateViewport();
        mediaQuery.addEventListener("change", updateViewport);

        return () => {
            mediaQuery.removeEventListener("change", updateViewport);
        };
    }, []);

    useEffect(() => {
        if (!isDesktopViewport) return;
        if (!containerRef.current || !wrapperRef.current) return;

        const wrapper = wrapperRef.current;
        const container = containerRef.current;
        gsap.set(wrapper, { autoAlpha: 1 });

        // Use container dimensions for sizing
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Init Scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(14.5, width / height, 0.1, 1000);
        camera.position.set(0, 13.1, 24.7);
        camera.zoom = 1.1;
        camera.updateProjectionMatrix();

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        if (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(renderer.domElement);

        // Lighting
        const directionalLight = new THREE.DirectionalLight(0xc7a9ff, 0);
        directionalLight.position.set(-0.47, -0.32, -1);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xc2a4ff, 0, 100, 3);
        pointLight.position.set(3, 12, 4);
        scene.add(pointLight);

        new RGBELoader().setPath("/models/").load("char_enviorment.hdr", (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.environmentIntensity = 0;
            scene.environmentRotation.set(5.76, 85.85, 1);
        });

        let mixer: THREE.AnimationMixer | null = null;
        let dracoLoader: DRACOLoader | null = null;
        let headBone: THREE.Object3D | null = null;
        let neckBone: THREE.Object3D | null = null;
        let screenLight: THREE.Object3D | null = null;
        let monitor: THREE.Object3D | null = null;
        const clock = new THREE.Clock();

        const loader = new GLTFLoader();
        dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");
        loader.setDRACOLoader(dracoLoader);

        let intensity = 0;
        const lightNoiseInterval = window.setInterval(() => {
            intensity = Math.random();
        }, 200);

        const initCharacter = async () => {
            try {
                const baseGltf = await loader.loadAsync(MODEL_PATH);
                const character = baseGltf.scene;
                const characterRig = new THREE.Group();
                characterRig.name = "character-rig";
                scene.add(characterRig);
                characterRig.add(character);

                const legacyPropsGltf = await loader.loadAsync(LEGACY_SCENE_PATH);
                const legacyPropsGroup = addLegacyPropsToRig(legacyPropsGltf.scene, characterRig);

                character.traverse((child: any) => {
                    if (child.isMesh) {
                        if (HIDE_CHARACTER_MESH_NAMES.includes(child.name)) {
                            child.visible = false;
                            return;
                        }

                        child.castShadow = false;
                        child.receiveShadow = false;
                        child.frustumCulled = true;
                        if (child.material && !Array.isArray(child.material)) {
                            (child.material as THREE.ShaderMaterial).precision = "mediump";
                        }
                    }
                });

                characterRig.traverse((object: any) => {
                    if (!monitor && object.material && object.material.name === "Material.027") {
                        object.material.transparent = true;
                        object.material.opacity = 1;
                        object.material.color.set("#FFFFFF");
                        monitor = object;
                    }

                    if (/screenlight/i.test(object.name || "") && object.material) {
                        object.material.transparent = true;
                        object.material.opacity = 0;
                        object.material.emissive.set("#C8BFFF");
                        gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
                            emissiveIntensity: () => intensity * 8,
                            duration: () => Math.random() * 0.6,
                            delay: () => Math.random() * 0.1,
                        });
                        screenLight = object;
                    }
                });

                headBone = findObjectByNames(character, ["spine006", "Head", "head", "mixamorigHead", "characters3d.com___Head"]);
                neckBone = findObjectByNames(character, ["spine005", "Neck", "neck", "mixamorigNeck", "characters3d.com___Neck"]);

                const animationGlbs = await Promise.all(
                    ANIMATION_FILES.map(async (fileName) => loader.loadAsync(`/models/animations/${encodeURIComponent(fileName)}`))
                );

                const allClips = collectUniqueClips([
                    ...(baseGltf.animations || []),
                    ...animationGlbs.flatMap((item) => item.animations || []),
                ]).map(sanitizeAnimationClip);

                fitRigToCharacter(characterRig, character, 16);
                characterRig.position.y += LANDING_RIG_Y_OFFSET;

                if (legacyPropsGroup) {
                    const rigScale = Math.max(characterRig.scale.x, 0.0001);
                    const inverseRigScale = 1 / rigScale;
                    legacyPropsGroup.scale.setScalar(inverseRigScale);
                    legacyPropsGroup.position.set(0, -0.1, 0.25);

                    LEGACY_COMPUTER_NODE_NAMES.forEach((nodeName) => {
                        const node = legacyPropsGroup.getObjectByName(nodeName);
                        if (node) {
                            node.position.x += LEGACY_COMPUTER_TO_CHARACTER_X_OFFSET;
                            node.position.z += LEGACY_COMPUTER_FORWARD_OFFSET;
                        }
                    });
                }

                mixer = new THREE.AnimationMixer(character);

                const introClip: THREE.AnimationClip | null = findBestClipByKeywords(allClips, ["intro"]);
                const idleClip: THREE.AnimationClip | null = findBestClipByKeywords(allClips, ["idle"]);
                const typePasscodeClip: THREE.AnimationClip | null =
                    findBestClipByKeywords(allClips, ["type passcode"]) ||
                    findBestClipByKeywords(allClips, ["passcode"]);
                const codeTypeClip: THREE.AnimationClip | null =
                    findBestClipByKeywords(allClips, ["code type"]) ||
                    findBestClipByKeywords(allClips, ["code"]);

                const landingAction = idleClip ? mixer.clipAction(idleClip) : null;
                const aboutAction = landingAction;
                const whatIDoAction = typePasscodeClip
                    ? mixer.clipAction(typePasscodeClip)
                    : codeTypeClip
                      ? mixer.clipAction(codeTypeClip)
                      : landingAction;

                const configureLoopAction = (action: THREE.AnimationAction | null, timeScale: number) => {
                    if (!action) return;
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.clampWhenFinished = false;
                    action.enabled = true;
                    action.setEffectiveWeight(1);
                    action.timeScale = timeScale;
                };

                configureLoopAction(landingAction, 0.66);
                configureLoopAction(aboutAction, 0.6);
                configureLoopAction(whatIDoAction, 0.72);

                let activeSectionAction: THREE.AnimationAction | null = null;
                const fadeToSectionAction = (nextAction: THREE.AnimationAction | null, fadeDuration = 0.45) => {
                    if (!nextAction || nextAction === activeSectionAction) return;

                    nextAction.reset();
                    nextAction.fadeIn(fadeDuration).play();

                    if (activeSectionAction) {
                        activeSectionAction.fadeOut(fadeDuration);
                    }

                    activeSectionAction = nextAction;
                };

                const activateLandingAction = () => fadeToSectionAction(landingAction);
                const activateAboutAction = () => fadeToSectionAction(aboutAction || landingAction);
                const activateWhatIDoAction = () => fadeToSectionAction(whatIDoAction || landingAction);

                if (introClip) {
                    const introAction = mixer.clipAction(introClip);
                    const introDelayMs = (introAction.getClip().duration + 0.1) * 1000;
                    introAction.setLoop(THREE.LoopOnce, 1);
                    introAction.clampWhenFinished = true;
                    introAction.play();

                    window.setTimeout(() => {
                        activateLandingAction();
                    }, introDelayMs);
                } else {
                    activateLandingAction();
                }

                ScrollTrigger.create({
                    trigger: ".ref-landing",
                    start: "top 55%",
                    end: "bottom 45%",
                    onEnter: activateLandingAction,
                    onEnterBack: activateLandingAction,
                });

                ScrollTrigger.create({
                    trigger: ".ref-about",
                    start: "top 55%",
                    end: "bottom 45%",
                    onEnter: activateAboutAction,
                    onEnterBack: activateAboutAction,
                });

                ScrollTrigger.create({
                    trigger: ".ref-whatido",
                    start: "top 55%",
                    end: "bottom 45%",
                    onEnter: activateWhatIDoAction,
                    onEnterBack: activateWhatIDoAction,
                });

                ScrollTrigger.create({
                    trigger: ".ref-hero",
                    start: "top 60%",
                    end: "bottom 40%",
                    onEnter: activateLandingAction,
                    onEnterBack: activateLandingAction,
                });

                ScrollTrigger.create({
                    trigger: ".ref-hero",
                    start: "top top",
                    onEnter: () => {
                        gsap.to(wrapper, { autoAlpha: 0, duration: 0.3, overwrite: "auto" });
                    },
                    onLeaveBack: () => {
                        gsap.to(wrapper, { autoAlpha: 1, duration: 0.3, overwrite: "auto" });
                    },
                });

                gsap.to(scene, { environmentIntensity: 0.64, duration: 2, ease: "power2.inOut" });
                gsap.to(directionalLight, { intensity: 1, duration: 2, ease: "power2.inOut" });

                const tl1 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".ref-landing",
                        start: "top top",
                        end: "bottom+=40% top",
                        scrub: 2.6,
                        invalidateOnRefresh: true,
                    },
                });
                const tl2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".ref-about",
                        start: "center 55%",
                        end: "bottom+=60% top",
                        scrub: 3,
                        invalidateOnRefresh: true,
                    },
                });
                const tl3 = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".ref-whatido",
                        start: "top top",
                        end: "bottom top",
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                });

                if (window.innerWidth > 1024) {
                    tl1
                        .fromTo(characterRig.rotation, { y: 0 }, { y: 0.45, duration: 1 }, 0)
                        .to(camera.position, { z: 22 }, 0)
                        .fromTo(wrapper, { x: 0 }, { x: "-18%", duration: 1 }, 0);

                    tl2
                        .to(camera.position, { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" }, 0)
                        .fromTo(wrapper, { pointerEvents: "inherit" }, { pointerEvents: "none", x: "-15%", delay: 2, duration: 5 }, 0)
                        .to(characterRig.rotation, { y: 0.68, x: 0.06, delay: 3, duration: 3 }, 0)
                        .fromTo(".character-rim", { opacity: 1, scaleX: 1.4 }, { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 }, 0.3);

                    if (neckBone) {
                        tl2.to(neckBone.rotation, { x: 0.35, delay: 2, duration: 3 }, 0);
                    }

                    if (monitor && (monitor as any).material) {
                        tl2.to((monitor as any).material, { opacity: 1, duration: 0.8, delay: 3.2 }, 0);
                        tl2.fromTo(monitor.position, { y: -10, z: 2 }, { y: 0, z: 0, delay: 1.5, duration: 3 }, 0);
                    }

                    if (screenLight && (screenLight as any).material) {
                        tl2.to((screenLight as any).material, { opacity: 1, duration: 0.8, delay: 4.5 }, 0);
                    }

                    tl3
                        .fromTo(wrapper, { y: 0 }, { y: "-85%", duration: 4, ease: "none", delay: 1 }, 0)
                        .to(characterRig.rotation, { x: -0.04, duration: 2, delay: 1 }, 0)
                        .to(characterRig.position, { x: -0.7, y: LANDING_RIG_Y_OFFSET + 1.6, duration: 2.4, delay: 0.8, ease: "power2.out" }, 0);

                    if (monitor && (monitor as any).material) {
                        tl3.to((monitor as any).material, { opacity: 1, duration: 0.6, delay: 0.6 }, 0);
                    }

                    if (screenLight && (screenLight as any).material) {
                        tl3.to((screenLight as any).material, { opacity: 1, duration: 0.6, delay: 0.6 }, 0);
                    }
                }
            } catch (err) {
                console.error("Failed to load character", err);
            }
        };

        if (document.querySelector(".ref-landing")) {
            initCharacter();
        }

        // Mouse tracking for head rotation
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener("mousemove", handleMouseMove);

        const handleResize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);

        // Rendering Loop
        let reqId: number;
        const animate = () => {
            reqId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            if (mixer) {
                mixer.update(delta);
            }

            if (headBone && window.scrollY < 200) {
                const maxRotation = Math.PI / 6;
                targetY = THREE.MathUtils.lerp(targetY, mouseX * maxRotation, 0.1);
                headBone.rotation.y = targetY;

                let minRotationX = -0.3;
                let maxRotationX = 0.4;
                if (mouseY > minRotationX) {
                    if (mouseY < maxRotationX) {
                        targetX = THREE.MathUtils.lerp(targetX, -mouseY - 0.5 * maxRotation, 0.1);
                    } else {
                        targetX = THREE.MathUtils.lerp(targetX, -maxRotation - 0.5 * maxRotation, 0.1);
                    }
                } else {
                    targetX = THREE.MathUtils.lerp(targetX, -minRotationX - 0.5 * maxRotation, 0.1);
                }
                headBone.rotation.x = targetX;
            } else if (headBone && window.innerWidth > 1024) {
                headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, 0, 0.06);
                headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, 0, 0.06);
            }

            const lightMaterial = screenLight && (screenLight as any).material ? (screenLight as any).material : null;
            if (lightMaterial) {
                if (lightMaterial.opacity > 0.9) {
                    pointLight.intensity = (lightMaterial.emissiveIntensity || 1) * 20;
                } else {
                    pointLight.intensity = 0;
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(reqId);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
            window.clearInterval(lightNoiseInterval);
            if (container.firstChild) container.removeChild(container.firstChild);
            renderer.dispose();
            dracoLoader?.dispose();
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
    }, [isDesktopViewport]);

    if (!isDesktopViewport) return null;

    return (
        <div
            ref={wrapperRef}
            className="fixed top-0 left-0 w-full h-[100vh] z-0 pointer-events-none hidden lg:block character-model overflow-hidden"
        >
            <div className="absolute w-[400px] h-[400px] bg-[#f59bf8] rounded-full top-[60%] left-1/2 -translate-x-1/2 scale-x-[1.4] opacity-100 shadow-[inset_66px_35px_85px_0px_rgba(85,0,255,0.65)] blur-[50px] character-rim z-[-1]" />
            <div ref={containerRef} className="w-full h-full relative" />
        </div>
    );
};
