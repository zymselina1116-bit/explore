// Game variables
let scene, camera, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const moveSpeed = 50.0;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 5); // Eye level height

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create walls
    createWalls();

    // Setup controls
    controls = new THREE.PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', function() {
        controls.lock();
    });

    controls.addEventListener('lock', function() {
        instructions.classList.add('hidden');
    });

    controls.addEventListener('unlock', function() {
        instructions.classList.remove('hidden');
    });

    scene.add(controls.getObject());

    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();
}

// Create room walls
function createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(40, 10, 0.5),
        wallMaterial
    );
    backWall.position.set(0, 5, -20);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Front wall (with opening)
    const frontWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(15, 10, 0.5),
        wallMaterial
    );
    frontWallLeft.position.set(-12.5, 5, 20);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(15, 10, 0.5),
        wallMaterial
    );
    frontWallRight.position.set(12.5, 5, 20);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    scene.add(frontWallRight);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 10, 40),
        wallMaterial
    );
    leftWall.position.set(-20, 5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 10, 40),
        wallMaterial
    );
    rightWall.position.set(20, 5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

// Keyboard event handlers
function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'KeyE':
            interact();
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Interact function
function interact() {
    console.log('Interact key pressed! (E)');
    // This is where you'll add interaction logic later
    // For now, just log to console
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {
        // Update movement
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) {
            velocity.z -= direction.z * moveSpeed * delta;
        }
        if (moveLeft || moveRight) {
            velocity.x -= direction.x * moveSpeed * delta;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;

    // Render
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('load', init);
