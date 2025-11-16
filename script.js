// ===== GAME STATE =====
const GameState = {
    currentScene: 1,
    inventory: [],
    collectedItems: [],
    holdingItem: null,
    progressMax: 3,
    progressCurrent: 0,
    scene2ItemsCollected: 0,
    scene3ItemsCollected: 0,
    hasCardKey: false,
    hasGoldenKey: false,
    doorUnlocked: false
};

// ===== THREE.JS SETUP =====
let scene, camera, renderer, raycaster, mouse;
let controls = { forward: false, backward: false, left: false, right: false };
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let interactiveObjects = [];
let currentHoverObject = null;

// Camera rotation
let cameraRotation = { yaw: 0, pitch: 0 };

// Initialize Three.js
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);

    // Renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Raycaster for interactions
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Setup scenes
    setupScene1();

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        showSceneTitle('Scene 1: Metallic Room');
    }, 1000);
}

// ===== SCENE 1: METALLIC ROOM =====
function setupScene1() {
    clearScene();
    GameState.currentScene = 1;
    GameState.progressCurrent = 0;
    updateProgressUI();

    // Room
    const roomSize = 20;
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x8899aa,
        metalness: 0.7,
        roughness: 0.3
    });

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 6, 0.5),
        wallMaterial
    );
    backWall.position.set(0, 3, -roomSize / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, roomSize),
        wallMaterial
    );
    leftWall.position.set(-roomSize / 2, 3, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, roomSize),
        wallMaterial
    );
    rightWall.position.set(roomSize / 2, 3, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    scene.add(ceiling);

    // Red Rotating Lights
    const redLight1 = new THREE.PointLight(0xff0000, 2, 15);
    redLight1.position.set(-3, 5, 0);
    scene.add(redLight1);

    const redLight2 = new THREE.PointLight(0xff0000, 2, 15);
    redLight2.position.set(3, 5, 0);
    scene.add(redLight2);

    // Light housings
    const lightHousing1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    lightHousing1.position.copy(redLight1.position);
    scene.add(lightHousing1);

    const lightHousing2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
    );
    lightHousing2.position.copy(redLight2.position);
    scene.add(lightHousing2);

    // Animate lights
    function animateLights() {
        const time = Date.now() * 0.001;
        redLight1.intensity = 1.5 + Math.sin(time * 2) * 0.5;
        redLight2.intensity = 1.5 + Math.cos(time * 2) * 0.5;
    }
    scene.userData.animateLights = animateLights;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x666666, 0.5);
    scene.add(ambientLight);

    // Glass Door
    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 })
    );
    doorFrame.position.set(0, 2, -9.5);
    scene.add(doorFrame);

    const glassDoor = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 3.8, 0.1),
        new THREE.MeshPhysicalMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1
        })
    );
    glassDoor.position.set(0, 2, -9.4);
    glassDoor.userData = { type: 'glassDoor', locked: true };
    scene.add(glassDoor);
    interactiveObjects.push(glassDoor);

    // Exit Sign
    const exitSign = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 0.1),
        new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8
        })
    );
    exitSign.position.set(0, 4.5, -9.3);
    scene.add(exitSign);

    // Green light from exit sign
    const exitLight = new THREE.PointLight(0x00ff00, 1, 5);
    exitLight.position.set(0, 4.5, -9);
    scene.add(exitLight);

    // Card Reader
    const cardReader = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 })
    );
    cardReader.position.set(2, 1.5, -9.3);
    cardReader.userData = { type: 'cardReader', requiresKey: true };
    scene.add(cardReader);
    interactiveObjects.push(cardReader);

    const readerLight = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 16),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        })
    );
    readerLight.position.set(2, 1.7, -9.2);
    readerLight.userData = { isReaderLight: true };
    scene.add(readerLight);

    // Key Board (mounted on back wall, right side of door)
    const keyBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.6 })
    );
    keyBoard.position.set(3.2, 2.5, -9.3);
    scene.add(keyBoard);

    // Keys on board - ONLY the card key is interactive
    // Row 1 (top) - decorative traditional keys
    createKey(2.6, 3.2, -9.2, 0xcccccc, 'vintage1', false);
    createKey(3.0, 3.2, -9.2, 0x888888, 'vintage2', false);
    createKey(3.4, 3.2, -9.2, 0xaa8866, 'vintage3', false);
    createKey(3.8, 3.2, -9.2, 0x999999, 'vintage4', false);

    // Row 2 - more decorative keys
    createKey(2.6, 2.7, -9.2, 0xaaaaaa, 'ordinary1', false);
    createKey(3.0, 2.7, -9.2, 0x777777, 'ordinary2', false);
    createKey(3.4, 2.7, -9.2, 0xbbbbbb, 'ordinary3', false);
    createKey(3.8, 2.7, -9.2, 0x666666, 'ordinary4', false);

    // Row 3 - THE INTERACTIVE CARD KEY (center) + decorative keys
    createKey(2.6, 2.2, -9.2, 0x999999, 'ordinary5', false);
    createKey(3.2, 2.2, -9.2, 0xffaa00, 'card', true); // ← ONLY INTERACTIVE KEY
    createKey(3.8, 2.2, -9.2, 0x888888, 'ordinary6', false);

    // Row 4 (bottom) - decorative keys
    createKey(2.6, 1.7, -9.2, 0xaaaaaa, 'ordinary7', false);
    createKey(3.0, 1.7, -9.2, 0x999999, 'ordinary8', false);
    createKey(3.4, 1.7, -9.2, 0x777777, 'ordinary9', false);
    createKey(3.8, 1.7, -9.2, 0xbbbbbb, 'ordinary10', false);

    camera.position.set(0, 1.6, 5);
    cameraRotation = { yaw: 0, pitch: 0 };
}

function createKey(x, y, z, color, keyType, isInteractive) {
    let keyMesh;

    if (keyType === 'card') {
        keyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.15, 0.05),
            new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.3,
                emissive: isInteractive ? color : 0x000000,
                emissiveIntensity: isInteractive ? 0.3 : 0
            })
        );
    } else {
        // Traditional key shape
        const keyGroup = new THREE.Group();
        const keyHead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16),
            new THREE.MeshStandardMaterial({ color: color, metalness: 0.7 })
        );
        keyHead.rotation.x = Math.PI / 2;
        keyGroup.add(keyHead);

        const keyShaft = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.2, 0.02),
            new THREE.MeshStandardMaterial({ color: color, metalness: 0.7 })
        );
        keyShaft.position.y = -0.1;
        keyGroup.add(keyShaft);

        keyMesh = keyGroup;
    }

    keyMesh.position.set(x, y, z);
    keyMesh.userData = {
        type: 'key',
        keyType: keyType,
        isInteractive: isInteractive
    };

    if (isInteractive) {
        interactiveObjects.push(keyMesh);
    }

    scene.add(keyMesh);
}

// ===== SCENE 2: OFFICE FLOOR =====
function setupScene2() {
    clearScene();
    GameState.currentScene = 2;
    GameState.progressMax = 3;
    GameState.progressCurrent = 0;
    GameState.scene2ItemsCollected = 0;
    updateProgressUI();

    showSceneTitle('Scene 2: Office Floor');

    // Larger room
    const roomSize = 40;

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.2,
            roughness: 0.8
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.1,
        roughness: 0.9
    });

    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 6, 0.5),
        wallMaterial
    );
    backWall.position.set(0, 3, -roomSize / 2);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 6, 0.5),
        wallMaterial
    );
    frontWall.position.set(0, 3, roomSize / 2);
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, roomSize),
        wallMaterial
    );
    leftWall.position.set(-roomSize / 2, 3, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 6, roomSize),
        wallMaterial
    );
    rightWall.position.set(roomSize / 2, 3, 0);
    scene.add(rightWall);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x444444, 0.6);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0xffffee, 0.8, 20);
    light1.position.set(-10, 4, -10);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xffffee, 0.8, 20);
    light2.position.set(10, 4, -10);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xffffee, 0.8, 20);
    light3.position.set(-10, 4, 10);
    scene.add(light3);

    const light4 = new THREE.PointLight(0xffffee, 0.8, 20);
    light4.position.set(10, 4, 10);
    scene.add(light4);

    // Scatter desks and furniture
    createOfficeDesk(-8, 0, -8, false);
    createOfficeDesk(8, 0, -8, false);
    createOfficeDesk(-8, 0, 8, false);
    createOfficeDesk(0, 0, -12, true); // This is the glowing desk with evidence

    // Shelves
    createShelf(-15, 0, 0);
    createShelf(15, 0, 5);

    // Chairs
    createChair(-7, 0, -7);
    createChair(9, 0, -7);
    createChair(-7, 0, 9);

    // Wooden Door (randomly placed on perimeter)
    const doorX = 15;
    const doorZ = -10;

    const woodenDoorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
    );
    woodenDoorFrame.position.set(doorX, 2, doorZ);
    scene.add(woodenDoorFrame);

    const woodenDoor = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 3.8, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 })
    );
    woodenDoor.position.set(doorX, 2, doorZ);
    woodenDoor.userData = { type: 'woodenDoor', locked: true };
    scene.add(woodenDoor);
    interactiveObjects.push(woodenDoor);

    // Key board next to door
    const keyBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.8, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 })
    );
    keyBoard.position.set(doorX + 2, 2, doorZ);
    scene.add(keyBoard);

    // Golden Key
    const goldenKey = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.04, 8, 16),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            emissive: 0xffd700,
            emissiveIntensity: 0.5
        })
    );
    goldenKey.position.set(doorX + 2, 2, doorZ + 0.2);
    goldenKey.userData = { type: 'goldenKey', isInteractive: true };
    scene.add(goldenKey);
    interactiveObjects.push(goldenKey);

    // Animate golden key
    scene.userData.animateGoldenKey = () => {
        if (goldenKey.parent) {
            goldenKey.rotation.z += 0.02;
        }
    };

    camera.position.set(0, 1.6, 15);
    cameraRotation = { yaw: 0, pitch: 0 };
}

function createOfficeDesk(x, y, z, isGlowing) {
    const deskGroup = new THREE.Group();

    // Desk top
    const deskTop = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.1, 1.5),
        new THREE.MeshStandardMaterial({
            color: isGlowing ? 0x6688aa : 0x8b4513,
            roughness: 0.6,
            emissive: isGlowing ? 0x4466aa : 0x000000,
            emissiveIntensity: isGlowing ? 0.3 : 0
        })
    );
    deskTop.position.y = 1;
    deskGroup.add(deskTop);

    // Legs
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);

    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-1.4, 0.5, -0.7);
    deskGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(1.4, 0.5, -0.7);
    deskGroup.add(leg2);

    const leg3 = new THREE.Mesh(legGeometry, legMaterial);
    leg3.position.set(-1.4, 0.5, 0.7);
    deskGroup.add(leg3);

    const leg4 = new THREE.Mesh(legGeometry, legMaterial);
    leg4.position.set(1.4, 0.5, 0.7);
    deskGroup.add(leg4);

    // Drawer (only for glowing desk)
    if (isGlowing) {
        const drawer = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.3, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 })
        );
        drawer.position.set(0, 0.8, 0);
        drawer.userData = { type: 'drawer', isInteractive: true, parentDesk: deskGroup };
        deskGroup.add(drawer);
        interactiveObjects.push(drawer);

        // Add glow light
        const glowLight = new THREE.PointLight(0x4466ff, 0.8, 5);
        glowLight.position.set(0, 1.5, 0);
        deskGroup.add(glowLight);

        // Evidence items (initially hidden)
        createEvidenceItem(deskGroup, 0.5, 1.2, 0.2, 'sketch', '🎨');
        createEvidenceItem(deskGroup, -0.5, 1.2, 0.2, 'profile', '📋');
        createEvidenceItem(deskGroup, 0, 1.2, -0.3, 'map', '🗺️');
    }

    deskGroup.position.set(x, y, z);
    deskGroup.userData = { isGlowingDesk: isGlowing };
    scene.add(deskGroup);
}

function createEvidenceItem(parent, x, y, z, itemType, icon) {
    const item = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.4),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.3
        })
    );
    item.position.set(x, y, z);
    item.userData = {
        type: 'evidence',
        itemType: itemType,
        isInteractive: true,
        icon: icon,
        name: itemType === 'sketch' ? 'Creature Sketch' :
              itemType === 'profile' ? 'Profile Card' :
              'Location Map',
        collected: false
    };
    item.visible = false; // Hidden until drawer opens
    parent.add(item);
    interactiveObjects.push(item);
}

function createShelf(x, y, z) {
    const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
    );
    shelf.position.set(x, y + 1.5, z);
    scene.add(shelf);
}

function createChair(x, y, z) {
    const chairGroup = new THREE.Group();

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    seat.position.y = 0.6;
    chairGroup.add(seat);

    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    back.position.set(0, 1, -0.25);
    chairGroup.add(back);

    chairGroup.position.set(x, y, z);
    scene.add(chairGroup);
}

// ===== SCENE 3: INDOOR GARDEN =====
function setupScene3() {
    clearScene();
    GameState.currentScene = 3;
    GameState.progressMax = 3;
    GameState.progressCurrent = 0;
    GameState.scene3ItemsCollected = 0;
    updateProgressUI();

    showSceneTitle('Scene 3: Garden Atrium');

    // ========== 写实世界参数 ==========
    const gardenSize = 36;

    // ========== 背景 / 氛围设置 ==========
    scene.background = new THREE.Color(0xf3d9b1); // 暖色黄昏天空
    scene.fog = new THREE.FogExp2(0xf3d9b1, 0.035); // 柔和雾气

    // ========== 地板（写实草皮材质） ==========
    const grassTexture = new THREE.TextureLoader().load(
        "https://textures.pixel-furnace.com/grass/grass_001_diffuse_2k.jpg"
    );
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(8, 8);

    const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.95,
        metalness: 0.0
    });

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(gardenSize, gardenSize),
        grassMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ========== 光照（Steam 写实风格） ==========
    const ambient = new THREE.AmbientLight(0xffd9b0, 0.55);
    scene.add(ambient);

    // 柔和夕阳方向光
    const sunLight = new THREE.DirectionalLight(0xffd7a0, 1.2);
    sunLight.position.set(12, 18, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // ========== 中央喷泉（写实低模） ==========
    const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.4, 0.6, 24),
        new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5,
            metalness: 0.1
        })
    );
    fountainBase.position.set(0, 0.3, 0);
    scene.add(fountainBase);

    const waterSurface = new THREE.Mesh(
        new THREE.CircleGeometry(1.8, 32),
        new THREE.MeshPhysicalMaterial({
            color: 0x55aaff,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.0
        })
    );
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(0, 0.61, 0);
    scene.add(waterSurface);

    // 水花粒子（轻微写实）
    const waterDrops = [];
    for (let i = 0; i < 26; i++) {
        const drop = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 })
        );
        drop.position.set(0, 2 + Math.random() * 0.6, 0);
        drop.userData = { velocity: -0.015 - Math.random() * 0.02 };
        scene.add(drop);
        waterDrops.push(drop);
    }
    scene.userData.animateWater = () => {
        waterDrops.forEach((drop) => {
            drop.position.y += drop.userData.velocity;
            if (drop.position.y < 0.65) drop.position.y = 2 + Math.random() * 0.6;
        });
    };

    // ========== 花朵（写实低模） ==========
    function createFlowerPatch(x, z, color, hasArtifact, id) {
        const group = new THREE.Group();

        for (let i = 0; i < 6; i++) {
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8),
                new THREE.MeshStandardMaterial({ color: 0x225522 })
            );
            stem.position.set(
                (Math.random() - 0.5) * 0.8,
                0.2,
                (Math.random() - 0.5) * 0.8
            );
            group.add(stem);

            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 12, 12),
                new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.5
                })
            );
            flower.position.copy(stem.position);
            flower.position.y += 0.25;
            group.add(flower);
        }

        // 写实发光 Artifact（骨头）
        if (hasArtifact) {
            const bone = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.18, 0.18),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffe8bb,
                    emissiveIntensity: 0.6,
                    roughness: 0.3
                })
            );
            bone.position.set(0, 0.35, 0);
            bone.userData = {
                type: "artifact",
                artifactId: id,
                isInteractive: true,
                collected: false
            };
            group.add(bone);
            interactiveObjects.push(bone);

            const glow = new THREE.PointLight(0xffe8bb, 0.7, 3);
            glow.position.set(0, 0.5, 0);
            group.add(glow);
        }

        group.position.set(x, 0, z);
        scene.add(group);
    }

    // ✨ 三个需要收集的 Artifact
    createFlowerPatch(-6, -6, 0xff88aa, true, "artifact1");
    createFlowerPatch(7, -4, 0xcc88ff, true, "artifact2");
    createFlowerPatch(-4, 8, 0xffcc66, true, "artifact3");

    // 🌸 普通花丛（仅装饰）
    createFlowerPatch(9, 5, 0xff6688, false);
    createFlowerPatch(-7, 3, 0x77bbff, false);
    createFlowerPatch(3, -8, 0xffe066, false);

    // ========== 巨大木门（Steam 写实风） ==========
    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 4.8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x5c3a20, roughness: 0.8 })
    );
    doorFrame.position.set(0, 2.4, -15);
    scene.add(doorFrame);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 4.4, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 })
    );
    door.position.set(0, 2.4, -14.9);
    door.userData = { type: "gardenDoor", locked: true };
    interactiveObjects.push(door);
    scene.add(door);

    // ========== 门铃（双击开门） ==========
    const bell = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 20, 20),
        new THREE.MeshStandardMaterial({
            color: 0xffd88a,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0xffcc88,
            emissiveIntensity: 0.2
        })
    );
    bell.position.set(3.5, 2.1, -15);
    bell.userData = { type: "bell", isInteractive: true };
    interactiveObjects.push(bell);
    scene.add(bell);

    // 摄像机初始化
    camera.position.set(0, 1.6, 12);
    cameraRotation = { yaw: 0, pitch: 0 };
}

function createFlowerPatch(x, y, z, color, hasArtifact, artifactId, icon) {
    const patchGroup = new THREE.Group();

    // Create several flowers
    for (let i = 0; i < 5; i++) {
        const flower = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 6),
            new THREE.MeshStandardMaterial({ color: color })
        );
        const offsetX = (Math.random() - 0.5) * 1;
        const offsetZ = (Math.random() - 0.5) * 1;
        flower.position.set(offsetX, 0.25, offsetZ);
        patchGroup.add(flower);
    }

    // Stem circles
    for (let i = 0; i < 5; i++) {
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x2d5016 })
        );
        const offsetX = (Math.random() - 0.5) * 1;
        const offsetZ = (Math.random() - 0.5) * 1;
        stem.position.set(offsetX, 0.15, offsetZ);
        patchGroup.add(stem);
    }

    if (hasArtifact) {
        // Bone-shaped artifact (simplified)
        const artifact = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.2, 0.2),
            new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                emissive: 0xffffaa,
                emissiveIntensity: 0.4
            })
        );
        artifact.position.set(0, 0.4, 0);
        artifact.userData = {
            type: 'artifact',
            artifactId: artifactId,
            isInteractive: true,
            icon: icon,
            name: 'Decorative Artifact',
            collected: false
        };
        patchGroup.add(artifact);
        interactiveObjects.push(artifact);

        // Glow light
        const glowLight = new THREE.PointLight(0xffffaa, 0.5, 3);
        glowLight.position.set(0, 0.5, 0);
        patchGroup.add(glowLight);
    }

    patchGroup.position.set(x, y, z);
    scene.add(patchGroup);
}

function createBush(x, y, z) {
    const bush = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 })
    );
    bush.position.set(x, y + 0.5, z);
    bush.scale.set(1, 0.6, 1);
    scene.add(bush);
}

// ===== SCENE 4: COURTYARD =====
function setupScene4() {
    clearScene();
    GameState.currentScene = 4;
    updateProgressUI();

    showSceneTitle('Scene 4: Courtyard - Place items in mailbox');

    const roomSize = 25;

    // Floor (concrete)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Bright lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffee, 0.7);
    sunLight.position.set(10, 15, 5);
    scene.add(sunLight);

    // Sky-like background
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

    // Mailbox at center
    const mailboxPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 })
    );
    mailboxPost.position.set(0, 0.75, -5);
    scene.add(mailboxPost);

    const mailboxBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 1),
        new THREE.MeshStandardMaterial({ color: 0x3366cc, metalness: 0.5 })
    );
    mailboxBody.position.set(0, 1.7, -5);
    mailboxBody.userData = { type: 'mailbox', isInteractive: true, itemsInside: 0 };
    scene.add(mailboxBody);
    interactiveObjects.push(mailboxBody);

    const mailboxDoor = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.6, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2255aa })
    );
    mailboxDoor.position.set(0, 1.7, -4.5);
    scene.add(mailboxDoor);

    // Flag
    const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    flag.position.set(0.8, 2, -5);
    scene.add(flag);

    camera.position.set(0, 1.6, 5);
    cameraRotation = { yaw: 0, pitch: 0 };
}

// ===== SCENE 5: CELEBRATION =====
function setupScene5() {
    clearScene();
    GameState.currentScene = 5;

    // Colorful celebration room
    scene.background = new THREE.Color(0xffddee);

    const roomSize = 20;

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize),
        new THREE.MeshStandardMaterial({ color: 0xeeddff })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Bright lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Central friendly creature (simplified cute character)
    const creatureBody = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff88cc })
    );
    creatureBody.position.set(0, 1.5, -5);
    scene.add(creatureBody);

    // Eyes
    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    leftEye.position.set(-0.3, 1.8, -4.3);
    scene.add(leftEye);

    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    rightEye.position.set(0.3, 1.8, -4.3);
    scene.add(rightEye);

    // Smile
    const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    smile.position.set(0, 1.4, -4.2);
    smile.rotation.x = Math.PI;
    scene.add(smile);

    // Cheering characters around (simple cylinders with happy colors)
    const cheerColors = [0xffaa44, 0x44aaff, 0xaa44ff, 0x44ffaa, 0xff4488];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 4;
        const character = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: cheerColors[i] })
        );
        character.position.set(
            Math.cos(angle) * radius,
            0.75,
            -5 + Math.sin(angle) * radius
        );
        scene.add(character);

        // Simple face
        const face = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffddaa })
        );
        face.position.set(
            Math.cos(angle) * radius,
            1.6,
            -5 + Math.sin(angle) * radius
        );
        scene.add(face);
    }

    // Confetti particles
    for (let i = 0; i < 50; i++) {
        const confetti = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 0.1),
            new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff,
                side: THREE.DoubleSide
            })
        );
        confetti.position.set(
            (Math.random() - 0.5) * 15,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 15 - 5
        );
        confetti.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(confetti);

        // Animate confetti
        confetti.userData = {
            velocityY: -0.02 - Math.random() * 0.02,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        };
    }

    scene.userData.animateConfetti = () => {
        scene.children.forEach(child => {
            if (child.userData.velocityY) {
                child.position.y += child.userData.velocityY;
                child.rotation.z += child.userData.rotationSpeed;
                if (child.position.y < 0) {
                    child.position.y = 7;
                }
            }
        });
    };

    camera.position.set(0, 1.6, 8);
    cameraRotation = { yaw: 0, pitch: 0 };

    // Show end game screen
    setTimeout(() => {
        document.getElementById('end-game-screen').classList.remove('hidden');
    }, 2000);
}

// ===== HELPER FUNCTIONS =====
function clearScene() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    interactiveObjects = [];
    scene.userData = {};
}

function updateProgressUI() {
    const progressText = document.getElementById('progress-text');
    if (GameState.currentScene === 2 || GameState.currentScene === 3) {
        progressText.textContent = `Progress: ${GameState.progressCurrent}/${GameState.progressMax}`;
        progressText.parentElement.style.display = 'block';
    } else {
        progressText.parentElement.style.display = 'none';
    }
}

function updateBackpackUI() {
    document.getElementById('item-count').textContent = GameState.inventory.length;
}

function showSceneTitle(title) {
    const titleElement = document.getElementById('scene-title');
    titleElement.textContent = title;
    titleElement.classList.add('show');
    setTimeout(() => {
        titleElement.classList.remove('show');
    }, 3000);
}

function showInteractionHint(text) {
    const hint = document.getElementById('interaction-hint');
    hint.textContent = text;
    hint.classList.remove('hidden');
    setTimeout(() => {
        hint.classList.add('hidden');
    }, 2000);
}

// ===== AVATAR ANIMATIONS =====
function playAvatarAnimation(animationType) {
    const avatar = document.getElementById('player-avatar');
    const itemGlow = document.getElementById('item-glow');

    // Remove all animation classes
    avatar.classList.remove('avatar-idle', 'avatar-pickup', 'avatar-lean', 'avatar-shift', 'avatar-toss');

    // Add the requested animation
    avatar.classList.add(`avatar-${animationType}`);

    // Show/hide item glow
    if (animationType === 'pickup' || GameState.holdingItem) {
        setTimeout(() => {
            itemGlow.style.opacity = '1';
        }, 300);
    } else if (animationType === 'toss') {
        itemGlow.style.opacity = '0';
    }

    // Reset to idle after animation
    setTimeout(() => {
        avatar.classList.remove(`avatar-${animationType}`);
        if (GameState.holdingItem) {
            avatar.classList.add('avatar-idle');
        }
    }, 800);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                controls.forward = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                controls.backward = true;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                controls.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                controls.right = true;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                controls.forward = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                controls.backward = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                controls.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                controls.right = false;
                break;
        }
    });

    // Mouse controls
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        // Update mouse position for raycasting
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Camera rotation
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            cameraRotation.yaw -= deltaX * 0.003;
            cameraRotation.pitch -= deltaY * 0.003;

            // Clamp pitch
            cameraRotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.pitch));

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Click interactions
    let clickTimer = null;
    let clickCount = 0;

    canvas.addEventListener('click', (e) => {
        clickCount++;

        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                // Single click
                handleClick(false);
                clickCount = 0;
            }, 250);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            // Double click
            handleClick(true);
            clickCount = 0;
        }
    });

    // Backpack UI
    document.getElementById('backpack-icon').addEventListener('click', (e) => {
        e.stopPropagation();
        openBackpack();
    });

    document.getElementById('close-backpack').addEventListener('click', () => {
        closeBackpack();
    });

    document.getElementById('backpack-modal').addEventListener('click', (e) => {
        if (e.target.id === 'backpack-modal') {
            closeBackpack();
        }
    });

    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function handleClick(isDoubleClick) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const userData = object.userData;

        // Scene 1 interactions
        if (GameState.currentScene === 1) {
            if (userData.type === 'key' && userData.keyType === 'card' && userData.isInteractive && isDoubleClick) {
                // Pick up card key (only if interactive and not already collected)
                if (!GameState.hasCardKey) {
                    GameState.hasCardKey = true;
                    GameState.holdingItem = 'cardKey';
                    showInteractionHint('Card Key acquired!');
                    playAvatarAnimation('pickup');
                    scene.remove(object);
                    updateBackpackUI();
                }
            } else if (userData.type === 'cardReader' && !isDoubleClick) {
                // Use card key on reader
                if (GameState.hasCardKey) {
                    showInteractionHint('Door unlocked!');
                    playAvatarAnimation('shift');

                    // Change reader light to green
                    scene.children.forEach(child => {
                        if (child.userData.isReaderLight) {
                            child.material.color.setHex(0x00ff00);
                            child.material.emissive.setHex(0x00ff00);
                        }
                    });

                    // Open door and transition
                    setTimeout(() => {
                        setupScene2();
                    }, 1000);
                } else {
                    showInteractionHint('Need a card key!');
                }
            }
        }

        // Scene 2 interactions
        if (GameState.currentScene === 2) {
            if (userData.type === 'drawer' && !isDoubleClick) {
                // Open drawer and reveal evidence
                showInteractionHint('Drawer opened!');
                playAvatarAnimation('lean');

                // Show evidence items
                object.parent.children.forEach(child => {
                    if (child.userData.type === 'evidence') {
                        child.visible = true;
                    }
                });
            } else if (userData.type === 'evidence' && !isDoubleClick) {
                // Check if already collected
                if (userData.collected) {
                    return;
                }

                // Collect evidence
                userData.collected = true;
                GameState.scene2ItemsCollected++;
                GameState.progressCurrent = GameState.scene2ItemsCollected;
                GameState.inventory.push({
                    name: userData.name,
                    icon: userData.icon,
                    type: 'evidence'
                });
                updateProgressUI();
                updateBackpackUI();
                showInteractionHint(`${userData.name} collected!`);
                playAvatarAnimation('pickup');
                scene.remove(object);

                if (GameState.scene2ItemsCollected === 3) {
                    showInteractionHint('All evidence collected! Get the golden key!');
                }
            } else if (userData.type === 'goldenKey' && isDoubleClick) {
                if (GameState.scene2ItemsCollected === 3) {
                    GameState.hasGoldenKey = true;
                    GameState.holdingItem = 'goldenKey';
                    showInteractionHint('Golden Key acquired!');
                    playAvatarAnimation('pickup');
                    scene.remove(object);
                } else {
                    showInteractionHint('Collect all evidence first!');
                }
            } else if (userData.type === 'woodenDoor' && !isDoubleClick) {
                if (GameState.hasGoldenKey) {
                    showInteractionHint('Door unlocked!');
                    playAvatarAnimation('shift');
                    setTimeout(() => {
                        setupScene3();
                    }, 1000);
                } else {
                    showInteractionHint('Door is locked. Find the key!');
                }
            }
        }

        // Scene 3 interactions
        if (GameState.currentScene === 3) {
            if (userData.type === 'artifact' && !isDoubleClick) {
                // Check if already collected
                if (userData.collected) {
                    return;
                }

                // Collect artifact
                userData.collected = true;
                GameState.scene3ItemsCollected++;
                GameState.progressCurrent = GameState.scene3ItemsCollected;
                GameState.inventory.push({
                    name: userData.name || 'Decorative Artifact',
                    icon: userData.icon || '🦴',
                    type: 'artifact'
                });
                updateProgressUI();
                updateBackpackUI();
                showInteractionHint(`${userData.name || 'Artifact'} collected!`);
                playAvatarAnimation('pickup');
                scene.remove(object);

                if (GameState.scene3ItemsCollected === 3) {
                    showInteractionHint('All artifacts collected! Ring the bell!');
                }
            } else if (userData.type === 'bell' && isDoubleClick) {
                if (GameState.scene3ItemsCollected === 3) {
                    showInteractionHint('*Bell rings*');
                    playAvatarAnimation('shift');
                    setTimeout(() => {
                        setupScene4();
                    }, 1000);
                } else {
                    showInteractionHint('Collect all artifacts first!');
                }
            }
        }

        // Scene 4 interactions
        if (GameState.currentScene === 4) {
            if (userData.type === 'mailbox' && !isDoubleClick) {
                // Check if player has opened backpack and dropped items
                if (GameState.inventory.length === 0) {
                    showInteractionHint('All items delivered!');
                    playAvatarAnimation('shift');

                    // Transition effect
                    const overlay = document.createElement('div');
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        z-index: 1500;
                        opacity: 0;
                        transition: opacity 2s ease;
                    `;
                    document.body.appendChild(overlay);

                    setTimeout(() => {
                        overlay.style.opacity = '1';
                    }, 100);

                    setTimeout(() => {
                        setupScene5();
                        document.body.removeChild(overlay);
                    }, 2000);
                } else {
                    showInteractionHint('Open your backpack and drop all items near the mailbox first!');
                }
            }
        }
    }
}

function openBackpack() {
    const modal = document.getElementById('backpack-modal');
    const itemsContainer = document.getElementById('backpack-items');

    itemsContainer.innerHTML = '';

    if (GameState.inventory.length === 0) {
        itemsContainer.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No items yet!</p>';
    } else {
        GameState.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'backpack-item';
            itemDiv.innerHTML = `
                <div class="backpack-item-icon">${item.icon}</div>
                <div class="backpack-item-name">${item.name}</div>
            `;

            // Double-click to drop (only in scene 4)
            if (GameState.currentScene === 4) {
                itemDiv.addEventListener('dblclick', () => {
                    GameState.inventory.splice(index, 1);
                    updateBackpackUI();
                    playAvatarAnimation('toss');
                    showInteractionHint(`${item.name} dropped!`);
                    openBackpack(); // Refresh
                });
                itemDiv.style.cursor = 'pointer';
                itemDiv.title = 'Double-click to drop';
            }

            itemsContainer.appendChild(itemDiv);
        });
    }

    modal.classList.remove('hidden');
}

function closeBackpack() {
    document.getElementById('backpack-modal').classList.add('hidden');
}

// ===== GAME LOOP =====
function animate() {
    requestAnimationFrame(animate);

    // Update camera rotation
    const yaw = cameraRotation.yaw;
    const pitch = cameraRotation.pitch;

    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch)
    );

    camera.lookAt(
        camera.position.x + direction.x,
        camera.position.y + direction.y,
        camera.position.z + direction.z
    );

    // Movement
    const moveSpeed = 0.1;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));

    if (controls.forward) camera.position.addScaledVector(forward, moveSpeed);
    if (controls.backward) camera.position.addScaledVector(forward, -moveSpeed);
    if (controls.left) camera.position.addScaledVector(right, -moveSpeed);
    if (controls.right) camera.position.addScaledVector(right, moveSpeed);

    // Keep camera at head height
    camera.position.y = 1.6;

    // Scene-specific animations
    if (scene.userData.animateLights) scene.userData.animateLights();
    if (scene.userData.animateGoldenKey) scene.userData.animateGoldenKey();
    if (scene.userData.animateWater) scene.userData.animateWater();
    if (scene.userData.animateConfetti) scene.userData.animateConfetti();

    // Raycasting for hover effects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        if (hoveredObject !== currentHoverObject) {
            currentHoverObject = hoveredObject;
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (currentHoverObject !== null) {
            currentHoverObject = null;
            document.body.style.cursor = 'crosshair';
        }
    }

    renderer.render(scene, camera);
}

// ===== START GAME =====
window.addEventListener('load', () => {
    init();
});
