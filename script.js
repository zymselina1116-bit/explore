// Import Three.js from CDN
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ========== GAME STATE ==========
const gameState = {
    currentScene: 'room1',
    inventory: new Set(),
    evidenceCollected: new Set(),
    artifactsCollected: new Set(),
    hasCardKey: false,
    door1Unlocked: false,
    hasGoldenKey: false,
    door2Unlocked: false,
    itemsDroppedAroundBarrel: false,
    itemsDelivered: false,
};

// ========== ITEM DEFINITIONS ==========
const ITEMS = {
    cardKey: { icon: '🔑', name: 'Access Card', type: 'key' },
    evidence_photo: { icon: '📷', name: 'Creature Photo', type: 'evidence' },
    evidence_profile: { icon: '📄', name: 'Profile Document', type: 'evidence' },
    evidence_map: { icon: '🗺️', name: 'Route Map', type: 'evidence' },
    goldenKey: { icon: '🔐', name: 'Golden Key', type: 'key' },
    artifact_1: { icon: '🦴', name: 'Artifact Bone 1', type: 'artifact' },
    artifact_2: { icon: '🦴', name: 'Artifact Bone 2', type: 'artifact' },
    artifact_3: { icon: '🦴', name: 'Artifact Bone 3', type: 'artifact' },
};

// ========== TEXTURE URLS ==========
const TEXTURES = {
    scene1_floor: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/41db52c3b4a967c77989cde41f51bbd8ea60b10d/Screenshot%202025-11-16%20at%2011.32.02.png',
    scene1_wall: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/1d3a162a583640f4cc4887a90ac3b21df84f9f75/Screenshot%202025-11-16%20at%2011.33.37.png',
    scene1_door: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/d1f948a98383aa407fedbcc7bba124ba6bf5cc37/Screenshot%202025-11-16%20at%2011.37.24.png',
    scene1_exit: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/6c609a9c86e17d96e216752c622768e152a4016f/Screenshot%202025-11-16%20at%2011.38.38.png',
    scene1_keyBoard: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/f8c5cf58ca6dffd8f43eaa849055ce498c501483/Screenshot%202025-11-16%20at%2012.43.29.png',
    scene1_keys1: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/9fc50bdbe91cff0ef23ab1138a30ba9e99cf2c0b/Screenshot%202025-11-16%20at%2012.44.25.png',
    scene1_keys2: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/7a9781ddb37d5877917511935de0f9d9cceac3f2/Screenshot%202025-11-16%20at%2012.45.54.png',
    scene1_card: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/f69447a77e66b14fc7f96d9c62291e4e1621e173/Screenshot%202025-11-16%20at%2012.47.51.png',
    scene2_floor: 'https://raw.githubusercontent.com/zymselina1116-bit/explore/bf02def17b7a6a47a1d6230743ec79c70424dc5c/Screenshot%202025-11-16%20at%2011.41.56.png',
};

// ========== GLOBALS ==========
let scene, camera, renderer;
let interactiveObjects = [];
let currentHintTarget = null;
let clickTime = 0;
const DOUBLE_CLICK_DELAY = 300;

// Movement
const keys = { w: false, a: false, s: false, d: false };
const moveSpeed = 0.1;
const mouseSensitivity = 0.002;
let yaw = 0;
let pitch = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

// Room bounds (for collision)
let roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };

// ========== UI ELEMENTS ==========
const ui = {
    sceneName: document.getElementById('scene-name'),
    progress: document.getElementById('progress'),
    hint: document.getElementById('interaction-hint'),
    backpackIcon: document.getElementById('backpack-icon'),
    itemCount: document.getElementById('item-count'),
    backpackPanel: document.getElementById('backpack-panel'),
    backpackItems: document.getElementById('backpack-items'),
    closeBackpack: document.getElementById('close-backpack'),
    transitionOverlay: document.getElementById('transition-overlay'),
    messageOverlay: document.getElementById('message-overlay'),
    messageText: document.getElementById('message-text'),
    endingScreen: document.getElementById('ending-screen'),
    playAgain: document.getElementById('play-again'),
};

// ========== TEXTURE LOADING ==========
const textureLoader = new THREE.TextureLoader();

function loadTexture(url, fallbackColor = 0xcccccc) {
    const texture = textureLoader.load(
        url,
        // onLoad
        (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
        },
        // onProgress
        undefined,
        // onError
        (err) => {
            console.warn(`Failed to load texture: ${url}`, err);
        }
    );
    return texture;
}

// ========== INITIALIZATION ==========
function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 8);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Build initial scene
    buildScene1();

    // Event listeners
    setupEventListeners();

    // Start game loop
    animate();
}

// ========== SCENE BUILDERS ==========

function buildScene1() {
    clearScene();
    gameState.currentScene = 'room1';
    ui.sceneName.textContent = 'Industrial Hall';
    ui.progress.textContent = '';

    // Set room bounds
    roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };

    // Background
    scene.background = new THREE.Color(0x3a3a3a);
    scene.fog = new THREE.Fog(0x3a3a3a, 1, 50);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    // Floor
    const floorTexture = loadTexture(TEXTURES.scene1_floor);
    floorTexture.repeat.set(2, 2);
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.9,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling with light panels
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    scene.add(ceiling);

    // Light panels on ceiling
    for (let i = -15; i <= 15; i += 10) {
        for (let j = -15; j <= 15; j += 10) {
            const lightPanel = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 6),
                new THREE.MeshStandardMaterial({
                    color: 0xffffee,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.5
                })
            );
            lightPanel.rotation.x = Math.PI / 2;
            lightPanel.position.set(i, 7.9, j);
            scene.add(lightPanel);
        }
    }

    // Walls (yellowish aged with texture)
    const wallTexture = loadTexture(TEXTURES.scene1_wall);
    wallTexture.repeat.set(4, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.8,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 0.5), wallMaterial);
    backWall.position.set(0, 4, -20);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallTexture = loadTexture(TEXTURES.scene1_wall);
    leftWallTexture.repeat.set(4, 1);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 40), new THREE.MeshStandardMaterial({
        map: leftWallTexture,
        roughness: 0.8,
        metalness: 0.1
    }));
    leftWall.position.set(-20, 4, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWallTexture = loadTexture(TEXTURES.scene1_wall);
    rightWallTexture.repeat.set(4, 1);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 40), new THREE.MeshStandardMaterial({
        map: rightWallTexture,
        roughness: 0.8,
        metalness: 0.1
    }));
    rightWall.position.set(20, 4, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Front wall (with door opening)
    const frontWallLeftTexture = loadTexture(TEXTURES.scene1_wall);
    frontWallLeftTexture.repeat.set(2, 1);
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.5), new THREE.MeshStandardMaterial({
        map: frontWallLeftTexture,
        roughness: 0.8,
        metalness: 0.1
    }));
    frontWallLeft.position.set(-13, 4, 20);
    scene.add(frontWallLeft);

    const frontWallRightTexture = loadTexture(TEXTURES.scene1_wall);
    frontWallRightTexture.repeat.set(2, 1);
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.5), new THREE.MeshStandardMaterial({
        map: frontWallRightTexture,
        roughness: 0.8,
        metalness: 0.1
    }));
    frontWallRight.position.set(13, 4, 20);
    scene.add(frontWallRight);

    // Glass/metal door
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, 19.5);

    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 6.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    doorFrame.position.y = 3.1;
    doorGroup.add(doorFrame);

    const doorTexture = loadTexture(TEXTURES.scene1_door);
    const doorGlass = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 5.8, 0.2),
        new THREE.MeshStandardMaterial({
            map: doorTexture,
            transparent: true,
            opacity: 0.7,
            metalness: 0.5,
            roughness: 0.1
        })
    );
    doorGlass.position.y = 3.1;
    doorGlass.position.x = -2.9;
    doorGlass.userData = { type: 'door', id: 'door1', pivot: new THREE.Vector3(2.9, 0, 0) };
    doorGroup.add(doorGlass);
    interactiveObjects.push(doorGlass);

    scene.add(doorGroup);

    // Exit sign above door
    const exitSign = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.5, 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8
        })
    );
    exitSign.position.set(0, 6.5, 19);
    scene.add(exitSign);

    // Key board on wall next to door
    const keyBoardTexture = loadTexture(TEXTURES.scene1_keyBoard);
    const keyBoardBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 0.1),
        new THREE.MeshStandardMaterial({
            map: keyBoardTexture,
            metalness: 0.7
        })
    );
    keyBoardBase.position.set(4, 3, 19.3);
    scene.add(keyBoardBase);

    // Decorative keys on board
    const keyPositions = [
        { x: 3.6, y: 3.8 },
        { x: 4.4, y: 3.8 },
        { x: 3.6, y: 3.2 },
        { x: 4.4, y: 3.2 },
    ];

    keyPositions.forEach((pos, i) => {
        const keyMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.3),
            new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xffcc00 : 0xcccccc })
        );
        keyMesh.rotation.z = Math.PI / 2;
        keyMesh.position.set(pos.x, pos.y, 19.4);
        scene.add(keyMesh);
    });

    // Access card (pickable)
    if (!gameState.hasCardKey) {
        const cardTexture = loadTexture(TEXTURES.scene1_card);
        const cardMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.5, 0.02),
            new THREE.MeshStandardMaterial({
                map: cardTexture,
                emissive: 0x0066ff,
                emissiveIntensity: 0.3
            })
        );
        cardMesh.position.set(4, 2.5, 19.4);
        cardMesh.userData = { type: 'pickup', id: 'cardKey', doubleClick: true };
        scene.add(cardMesh);
        interactiveObjects.push(cardMesh);
    }

    // Card reader on other side of door
    const cardReader = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    cardReader.position.set(-4, 3, 19.3);
    scene.add(cardReader);

    // Card reader indicator light
    const indicatorLight = new THREE.Mesh(
        new THREE.CircleGeometry(0.05),
        new THREE.MeshStandardMaterial({
            color: gameState.door1Unlocked ? 0x00ff00 : 0xff0000,
            emissive: gameState.door1Unlocked ? 0x00ff00 : 0xff0000,
            emissiveIntensity: 1
        })
    );
    indicatorLight.position.set(-4, 3.2, 19.35);
    scene.add(indicatorLight);

    cardReader.userData = { type: 'cardReader', id: 'reader1', indicatorLight };
    interactiveObjects.push(cardReader);

    // Position camera
    camera.position.set(0, 1.6, 8);
    yaw = 0;
    pitch = 0;
}

function buildScene2() {
    clearScene();
    gameState.currentScene = 'office';
    ui.sceneName.textContent = 'Office Floor';
    updateProgressUI();

    roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };

    // Background
    scene.background = new THREE.Color(0x2a2a2a);
    scene.fog = new THREE.Fog(0x2a2a2a, 1, 50);

    // Lights (dimmer)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Floor (office carpet)
    const officeFloorTexture = loadTexture(TEXTURES.scene2_floor);
    officeFloorTexture.repeat.set(2, 2);
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: officeFloorTexture,
        roughness: 0.95
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a, roughness: 0.9 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 0.5), wallMaterial);
    backWall.position.set(0, 4, -20);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 40), wallMaterial);
    leftWall.position.set(-20, 4, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 40), wallMaterial);
    rightWall.position.set(20, 4, 0);
    scene.add(rightWall);

    // Evidence desk (glowing)
    const deskPosition = { x: -8, z: -5 };

    // Desk surface
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.1, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 })
    );
    desk.position.set(deskPosition.x, 1.2, deskPosition.z);
    scene.add(desk);

    // Desk legs
    [-1.4, 1.4].forEach(x => {
        [-0.7, 0.7].forEach(z => {
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.2),
                new THREE.MeshStandardMaterial({ color: 0x555555 })
            );
            leg.position.set(deskPosition.x + x, 0.6, deskPosition.z + z);
            scene.add(leg);
        });
    });

    // Spotlight above desk
    const deskLight = new THREE.PointLight(0xffffaa, 1, 5);
    deskLight.position.set(deskPosition.x, 3, deskPosition.z);
    scene.add(deskLight);

    // Evidence items
    const evidenceItems = [
        { id: 'evidence_photo', pos: { x: -0.8, z: 0.3 }, size: 0.3, color: 0xffffff },
        { id: 'evidence_profile', pos: { x: 0, z: 0 }, size: 0.35, color: 0xffffcc },
        { id: 'evidence_map', pos: { x: 0.8, z: -0.2 }, size: 0.4, color: 0xccffcc },
    ];

    evidenceItems.forEach(item => {
        if (!gameState.evidenceCollected.has(item.id)) {
            const evidenceMesh = new THREE.Mesh(
                new THREE.BoxGeometry(item.size, 0.02, item.size * 0.7),
                new THREE.MeshStandardMaterial({
                    color: item.color,
                    emissive: item.color,
                    emissiveIntensity: 0.3
                })
            );
            evidenceMesh.position.set(
                deskPosition.x + item.pos.x,
                1.26,
                deskPosition.z + item.pos.z
            );
            evidenceMesh.userData = { type: 'pickup', id: item.id, doubleClick: false };
            scene.add(evidenceMesh);
            interactiveObjects.push(evidenceMesh);
        }
    });

    // Other desks and chairs (decorative)
    const officePositions = [
        { x: 5, z: -8 }, { x: 10, z: -8 },
        { x: 5, z: 5 }, { x: 10, z: 5 },
    ];

    officePositions.forEach(pos => {
        const deskDecor = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.1, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x6a5a4a })
        );
        deskDecor.position.set(pos.x, 1.2, pos.z);
        scene.add(deskDecor);

        const chair = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        chair.position.set(pos.x, 0.5, pos.z + 1.5);
        scene.add(chair);
    });

    // Wooden door on perimeter
    const doorWall = new THREE.Mesh(
        new THREE.BoxGeometry(15, 8, 0.5),
        wallMaterial
    );
    doorWall.position.set(-12.5, 4, 20);
    scene.add(doorWall);

    const doorWall2 = new THREE.Mesh(
        new THREE.BoxGeometry(15, 8, 0.5),
        wallMaterial
    );
    doorWall2.position.set(12.5, 4, 20);
    scene.add(doorWall2);

    // Wooden door
    const woodenDoor = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 })
    );
    woodenDoor.position.set(0, 3, 19.8);
    woodenDoor.userData = { type: 'door', id: 'door2' };
    scene.add(woodenDoor);
    interactiveObjects.push(woodenDoor);

    // Key board with golden key
    const keyBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    keyBoard.position.set(3, 3, 19.5);
    scene.add(keyBoard);

    // Golden key (only if evidence collected)
    if (gameState.evidenceCollected.size === 3 && !gameState.hasGoldenKey) {
        const goldenKey = new THREE.Mesh(
            new THREE.TorusGeometry(0.2, 0.05, 8, 16),
            new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffaa00,
                emissiveIntensity: 0.7,
                metalness: 0.9
            })
        );
        goldenKey.position.set(3, 3, 19.6);
        goldenKey.userData = { type: 'pickup', id: 'goldenKey', doubleClick: true, rotating: true };
        scene.add(goldenKey);
        interactiveObjects.push(goldenKey);
    }

    camera.position.set(0, 1.6, 10);
    yaw = 0;
    pitch = 0;
}

function buildScene3() {
    clearScene();
    gameState.currentScene = 'garden';
    ui.sceneName.textContent = 'Garden Atrium';
    updateProgressUI();

    roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };

    // Background (warm dusk)
    scene.background = new THREE.Color(0xffa858);
    scene.fog = new THREE.Fog(0xffa858, 5, 50);

    // Warm lighting
    const ambientLight = new THREE.AmbientLight(0xffe4b5, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffcc88, 0.8);
    sunLight.position.set(-20, 15, -20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Grass floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a7d3a,
        roughness: 0.95
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Fountain in center
    const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3 })
    );
    fountainBase.position.set(0, 0.25, 0);
    scene.add(fountainBase);

    const fountainWater = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 0.2, 16),
        new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1
        })
    );
    fountainWater.position.set(0, 0.6, 0);
    scene.add(fountainWater);

    // Water droplets (animated)
    for (let i = 0; i < 5; i++) {
        const droplet = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
        );
        const angle = (i / 5) * Math.PI * 2;
        droplet.position.set(Math.cos(angle) * 0.5, 1.5 + i * 0.3, Math.sin(angle) * 0.5);
        droplet.userData = { type: 'droplet', startY: droplet.position.y, offset: i };
        scene.add(droplet);
    }

    // Bushes and flowers
    const bushPositions = [
        { x: -8, z: -8 }, { x: 8, z: -8 }, { x: -8, z: 8 }, { x: 8, z: 8 },
        { x: -12, z: 0 }, { x: 12, z: 0 }, { x: 0, z: -12 }, { x: 0, z: 12 },
    ];

    bushPositions.forEach(pos => {
        const bush = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.9 })
        );
        bush.position.set(pos.x, 0.8, pos.z);
        bush.scale.y = 0.7;
        scene.add(bush);

        // Flowers on bushes
        for (let i = 0; i < 3; i++) {
            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.15),
                new THREE.MeshStandardMaterial({
                    color: [0xff69b4, 0xffff00, 0xff6347][i % 3],
                    emissive: [0xff1493, 0xffdd00, 0xff4500][i % 3],
                    emissiveIntensity: 0.3
                })
            );
            const angle = (i / 3) * Math.PI * 2;
            flower.position.set(
                pos.x + Math.cos(angle) * 0.8,
                1.2,
                pos.z + Math.sin(angle) * 0.8
            );
            scene.add(flower);
        }
    });

    // Artifact bones (hidden among plants)
    const artifactPositions = [
        { id: 'artifact_1', x: -7.5, z: -7.5 },
        { id: 'artifact_2', x: 8.5, z: 8.5 },
        { id: 'artifact_3', x: -12.5, z: 0.5 },
    ];

    artifactPositions.forEach(pos => {
        if (!gameState.artifactsCollected.has(pos.id)) {
            const artifact = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6),
                new THREE.MeshStandardMaterial({
                    color: 0xf5f5dc,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.4
                })
            );
            artifact.position.set(pos.x, 0.5, pos.z);
            artifact.rotation.z = Math.PI / 6;
            artifact.userData = { type: 'pickup', id: pos.id, doubleClick: false };
            scene.add(artifact);
            interactiveObjects.push(artifact);
        }
    });

    // Garden walls (partial)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });

    [-20, 20].forEach(x => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 40), wallMaterial);
        wall.position.set(x, 4, 0);
        scene.add(wall);
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 0.5), wallMaterial);
    backWall.position.set(0, 4, -20);
    scene.add(backWall);

    // Double doors on front wall
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.5), wallMaterial);
    frontWallLeft.position.set(-13, 4, 20);
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 0.5), wallMaterial);
    frontWallRight.position.set(13, 4, 20);
    scene.add(frontWallRight);

    // Double wooden doors
    const leftDoor = new THREE.Mesh(
        new THREE.BoxGeometry(3, 6, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x6a4a3a })
    );
    leftDoor.position.set(-1.5, 3, 19.8);
    scene.add(leftDoor);

    const rightDoor = new THREE.Mesh(
        new THREE.BoxGeometry(3, 6, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x6a4a3a })
    );
    rightDoor.position.set(1.5, 3, 19.8);
    rightDoor.userData = { type: 'gardenDoor' };
    scene.add(rightDoor);

    // Bell next to door
    const bellPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    bellPost.position.set(4, 1, 19.5);
    scene.add(bellPost);

    const bell = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.2
        })
    );
    bell.scale.y = 1.2;
    bell.position.set(4, 2.2, 19.5);
    bell.userData = { type: 'bell', id: 'gardenBell', doubleClick: true };
    scene.add(bell);
    interactiveObjects.push(bell);

    camera.position.set(0, 1.6, 12);
    yaw = 0;
    pitch = 0;
}

function buildScene4() {
    clearScene();
    gameState.currentScene = 'courtyard';
    ui.sceneName.textContent = 'Courtyard Plaza';
    ui.progress.textContent = '';

    roomBounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    // Bright daylight
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 60);

    // Bright lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Paved floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid pattern on floor
    for (let i = -15; i <= 15; i += 3) {
        const line1 = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        line1.rotation.x = -Math.PI / 2;
        line1.position.set(0, 0.01, i);
        scene.add(line1);

        const line2 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 30),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        line2.rotation.x = -Math.PI / 2;
        line2.position.set(i, 0.01, 0);
        scene.add(line2);
    }

    // Barrel/mailbox in center
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 1.5, 16),
        new THREE.MeshStandardMaterial({
            color: 0x8b6914,
            roughness: 0.8,
            metalness: 0.2
        })
    );
    barrel.position.set(0, 0.75, 0);
    barrel.castShadow = true;
    barrel.userData = { type: 'barrel', id: 'deliveryBarrel' };
    scene.add(barrel);
    interactiveObjects.push(barrel);

    // Sign above barrel
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffee })
    );
    sign.position.set(0, 2.5, 0);
    scene.add(sign);

    camera.position.set(0, 1.6, 8);
    yaw = 0;
    pitch = 0;
}

function buildEndingScene() {
    clearScene();
    gameState.currentScene = 'ending';

    // Calm, bright background
    scene.background = new THREE.Color(0xe0f0ff);

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Transparent container with creature
    const container = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
            roughness: 0.1
        })
    );
    container.position.set(0, 1.5, -5);
    scene.add(container);

    // Stylized friendly creature (abstract blob)
    const creature = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffccff,
            emissive: 0xffaaff,
            emissiveIntensity: 0.3
        })
    );
    creature.position.set(0, 1.5, -5);
    creature.scale.set(1, 1.2, 0.8);
    scene.add(creature);

    // Eyes
    [-0.3, 0.3].forEach(x => {
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        eye.position.set(x, 1.7, -4.3);
        scene.add(eye);
    });

    // Observer characters (simple colorful shapes)
    const observerPositions = [
        { x: -4, z: -3, color: 0xff9999 },
        { x: 4, z: -3, color: 0x99ff99 },
        { x: -3, z: 0, color: 0x9999ff },
        { x: 3, z: 0, color: 0xffff99 },
    ];

    observerPositions.forEach(pos => {
        const observer = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.3, 0.8, 8, 16),
            new THREE.MeshStandardMaterial({ color: pos.color })
        );
        observer.position.set(pos.x, 1, pos.z);
        scene.add(observer);
    });

    camera.position.set(0, 1.6, 5);
    yaw = 0;
    pitch = 0;

    // Show ending screen
    setTimeout(() => {
        ui.endingScreen.classList.remove('hidden');
        ui.endingScreen.classList.add('active');
    }, 1000);
}

// ========== SCENE MANAGEMENT ==========

function clearScene() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    interactiveObjects = [];
    currentHintTarget = null;
    hideHint();
}

function transitionToScene(sceneBuilder, delay = 1500) {
    ui.transitionOverlay.classList.remove('hidden');
    ui.transitionOverlay.classList.add('active');

    setTimeout(() => {
        sceneBuilder();
        setTimeout(() => {
            ui.transitionOverlay.classList.remove('active');
            setTimeout(() => {
                ui.transitionOverlay.classList.add('hidden');
            }, 800);
        }, 300);
    }, delay);
}

// ========== INTERACTION SYSTEM ==========

function checkInteractions() {
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.set(camera.position, direction);

    const intersects = raycaster.intersectObjects(interactiveObjects);

    if (intersects.length > 0 && intersects[0].distance < 4) {
        const target = intersects[0].object;
        if (target !== currentHintTarget) {
            currentHintTarget = target;
            showHint(target);
        }
    } else {
        if (currentHintTarget !== null) {
            currentHintTarget = null;
            hideHint();
        }
    }
}

function showHint(target) {
    const data = target.userData;
    let hintText = '';

    switch (data.type) {
        case 'pickup':
            if (data.doubleClick) {
                hintText = `Double-click to pick up ${ITEMS[data.id].name}`;
            } else {
                hintText = `Click to collect ${ITEMS[data.id].name}`;
            }
            break;
        case 'cardReader':
            hintText = gameState.hasCardKey ? 'Click to use access card' : 'Access card required';
            break;
        case 'door':
            if (data.id === 'door1') {
                hintText = gameState.door1Unlocked ? 'Door unlocked' : 'Locked - use card reader';
            } else if (data.id === 'door2') {
                hintText = gameState.hasGoldenKey ? 'Click to open door' : 'Locked - find the golden key';
            }
            break;
        case 'bell':
            hintText = gameState.artifactsCollected.size === 3 ? 'Double-click to ring bell' : 'Find all artifacts first';
            break;
        case 'barrel':
            hintText = gameState.inventory.size > 0 ? 'Drop all items from backpack first' : 'Click to deliver items';
            break;
    }

    ui.hint.textContent = hintText;
    ui.hint.classList.add('visible');
}

function hideHint() {
    ui.hint.classList.remove('visible');
}

function handleClick(isDoubleClick) {
    if (!currentHintTarget) return;

    const data = currentHintTarget.userData;

    if (data.type === 'pickup') {
        if ((data.doubleClick && isDoubleClick) || (!data.doubleClick && !isDoubleClick)) {
            pickUpItem(data.id, currentHintTarget);
        }
    } else if (data.type === 'cardReader' && !isDoubleClick) {
        useCardReader(currentHintTarget);
    } else if (data.type === 'door' && !isDoubleClick) {
        openDoor(data.id);
    } else if (data.type === 'bell' && isDoubleClick) {
        ringBell();
    } else if (data.type === 'barrel' && !isDoubleClick) {
        deliverItems();
    }
}

function pickUpItem(itemId, mesh) {
    // Add to inventory
    gameState.inventory.add(itemId);

    // Update specific collections
    const itemData = ITEMS[itemId];
    if (itemData.type === 'evidence') {
        gameState.evidenceCollected.add(itemId);
    } else if (itemData.type === 'artifact') {
        gameState.artifactsCollected.add(itemId);
    } else if (itemId === 'cardKey') {
        gameState.hasCardKey = true;
    } else if (itemId === 'goldenKey') {
        gameState.hasGoldenKey = true;
    }

    // Remove mesh
    scene.remove(mesh);
    interactiveObjects = interactiveObjects.filter(obj => obj !== mesh);
    currentHintTarget = null;
    hideHint();

    // Update UI
    updateInventoryUI();
    updateProgressUI();

    // Show message
    showMessage(`${itemData.name} collected`, 1500);

    // Check for special messages
    if (gameState.evidenceCollected.size === 3 && gameState.currentScene === 'office' && !gameState.hasGoldenKey) {
        setTimeout(() => {
            showMessage('All evidence collected. Find the golden key.', 2500);
            // Rebuild scene to show golden key
            buildScene2();
        }, 1600);
    } else if (gameState.artifactsCollected.size === 3 && gameState.currentScene === 'garden') {
        setTimeout(() => {
            showMessage('All artifacts collected. Ring the bell near the door.', 2500);
        }, 1600);
    }
}

function useCardReader(reader) {
    if (!gameState.hasCardKey) {
        showMessage('You need an access card', 1500);
        return;
    }

    if (gameState.door1Unlocked) return;

    gameState.door1Unlocked = true;

    // Change indicator light to green
    reader.userData.indicatorLight.material.color.setHex(0x00ff00);
    reader.userData.indicatorLight.material.emissive.setHex(0x00ff00);

    showMessage('Door unlocked', 1500);

    // Transition to Scene 2
    setTimeout(() => {
        transitionToScene(buildScene2, 1000);
    }, 1500);
}

function openDoor(doorId) {
    if (doorId === 'door2') {
        if (!gameState.hasGoldenKey) {
            showMessage('The door is locked.', 1500);
            return;
        }

        gameState.door2Unlocked = true;
        showMessage('Door opened', 1500);

        setTimeout(() => {
            transitionToScene(buildScene3, 1000);
        }, 1500);
    }
}

function ringBell() {
    if (gameState.artifactsCollected.size < 3) {
        showMessage('You still have artifacts to find.', 1500);
        return;
    }

    showMessage('Bell ringing...', 1500);

    setTimeout(() => {
        transitionToScene(buildScene4, 1000);
    }, 1500);
}

function deliverItems() {
    if (gameState.inventory.size > 0) {
        showMessage('Drop all items from your backpack near the barrel first.', 2000);
        return;
    }

    if (gameState.evidenceCollected.size === 3 && gameState.artifactsCollected.size === 3) {
        gameState.itemsDelivered = true;
        showMessage('Items Delivered', 2000);

        setTimeout(() => {
            transitionToScene(buildEndingScene, 1500);
        }, 2000);
    } else {
        showMessage('Nothing to deliver yet.', 1500);
    }
}

// ========== UI UPDATES ==========

function updateInventoryUI() {
    ui.itemCount.textContent = gameState.inventory.size;

    ui.backpackItems.innerHTML = '';
    gameState.inventory.forEach(itemId => {
        const itemData = ITEMS[itemId];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `
            <span class="item-icon">${itemData.icon}</span>
            <span class="item-name">${itemData.name}</span>
        `;
        itemDiv.addEventListener('dblclick', () => {
            if (gameState.currentScene === 'courtyard') {
                dropItem(itemId);
            }
        });
        ui.backpackItems.appendChild(itemDiv);
    });
}

function updateProgressUI() {
    if (gameState.currentScene === 'office') {
        ui.progress.textContent = `Evidence: ${gameState.evidenceCollected.size} / 3`;
    } else if (gameState.currentScene === 'garden') {
        ui.progress.textContent = `Artifacts: ${gameState.artifactsCollected.size} / 3`;
    } else {
        ui.progress.textContent = '';
    }
}

function dropItem(itemId) {
    gameState.inventory.delete(itemId);
    updateInventoryUI();
    showMessage('Item dropped', 1000);
}

function showMessage(text, duration) {
    ui.messageText.textContent = text;
    ui.messageOverlay.classList.remove('hidden');
    ui.messageOverlay.classList.add('active');

    setTimeout(() => {
        ui.messageOverlay.classList.remove('active');
        setTimeout(() => {
            ui.messageOverlay.classList.add('hidden');
        }, 500);
    }, duration);
}

// ========== CONTROLS ==========

function setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || e.key === 'ArrowUp') keys.w = true;
        if (key === 'a' || e.key === 'ArrowLeft') keys.a = true;
        if (key === 's' || e.key === 'ArrowDown') keys.s = true;
        if (key === 'd' || e.key === 'ArrowRight') keys.d = true;
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || e.key === 'ArrowUp') keys.w = false;
        if (key === 'a' || e.key === 'ArrowLeft') keys.a = false;
        if (key === 's' || e.key === 'ArrowDown') keys.s = false;
        if (key === 'd' || e.key === 'ArrowRight') keys.d = false;
    });

    // Mouse controls
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMouseX;
            const deltaY = e.clientY - previousMouseY;

            yaw -= deltaX * mouseSensitivity;
            pitch -= deltaY * mouseSensitivity;

            // Clamp pitch
            pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));

            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        }
    });

    // Click handling
    renderer.domElement.addEventListener('click', (e) => {
        const currentTime = Date.now();
        const isDoubleClick = currentTime - clickTime < DOUBLE_CLICK_DELAY;
        clickTime = currentTime;

        handleClick(isDoubleClick);
    });

    // Backpack toggle
    ui.backpackIcon.addEventListener('click', () => {
        ui.backpackPanel.classList.toggle('hidden');
    });

    ui.closeBackpack.addEventListener('click', () => {
        ui.backpackPanel.classList.add('hidden');
    });

    // Play again
    ui.playAgain.addEventListener('click', () => {
        location.reload();
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updateMovement() {
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Calculate forward direction (only horizontal)
    forward.set(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    ).normalize();

    right.set(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    ).normalize();

    const velocity = new THREE.Vector3();

    if (keys.w) velocity.add(forward);
    if (keys.s) velocity.sub(forward);
    if (keys.d) velocity.add(right);
    if (keys.a) velocity.sub(right);

    if (velocity.length() > 0) {
        velocity.normalize().multiplyScalar(moveSpeed);

        const newPosition = camera.position.clone().add(velocity);

        // Apply bounds
        newPosition.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, newPosition.x));
        newPosition.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, newPosition.z));

        camera.position.copy(newPosition);
    }

    // Always keep camera at eye level
    camera.position.y = 1.6;

    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// ========== ANIMATION LOOP ==========

function animate() {
    requestAnimationFrame(animate);

    updateMovement();
    checkInteractions();

    // Animate rotating objects
    scene.children.forEach(child => {
        if (child.userData && child.userData.rotating) {
            child.rotation.y += 0.02;
        }
        if (child.userData && child.userData.type === 'droplet') {
            const time = Date.now() * 0.001;
            child.position.y = child.userData.startY + Math.sin(time * 2 + child.userData.offset) * 0.3;
        }
    });

    renderer.render(scene, camera);
}

// ========== START GAME ==========
window.addEventListener('load', init);
