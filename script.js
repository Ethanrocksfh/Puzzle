let scene, camera, renderer, player, blocks, targets, walls, floor;
let moves = 0;
let currentLevel = 1;
const maxLevels = 5;
const gridSize = 5;
const cellSize = 1;
let playerPos = { x: 0, z: 0 };
let isAnimationPlaying = false;
let moveHistory = [];

const levels = [
    {
        blockPositions: [
            { x: 1, z: 1 },
            { x: -1, z: 0 },
            { x: 0, z: -1 }
        ],
        targetPositions: [
            { x: 2, z: 2 },
            { x: -2, z: 2 },
            { x: 2, z: -2 }
        ],
        wallPositions: []
    },
    {
        blockPositions: [
            { x: 1, z: 1 },
            { x: -1, z: -1 },
            { x: 0, z: 1 },
            { x: -1, z: 0 }
        ],
        targetPositions: [
            { x: 2, z: 2 },
            { x: -2, z: -2 },
            { x: 2, z: -2 },
            { x: -2, z: 2 }
        ],
        wallPositions: [
            { x: 0, z: 0 },
            { x: 1, z: -1 }
        ]
    },
    {
        blockPositions: [
            { x: 1, z: 1 },
            { x: -1, z: 1 },
            { x: 0, z: -1 },
            { x: -1, z: -1 }
        ],
        targetPositions: [
            { x: 1, z: -2 },
            { x: 0, z: -2 },
            { x: -1, z: -2 },
            { x: 2, z: -2 }
        ],
        wallPositions: [
            { x: 0, z: 0 },
            { x: 1, z: 0 },
            { x: -1, z: 0 }
        ]
    },
    {
        blockPositions: [
            { x: 1, z: 1 },
            { x: -1, z: 1 },
            { x: 1, z: -1 },
            { x: -1, z: -1 }
        ],
        targetPositions: [
            { x: 1, z: -2 },
            { x: -1, z: -2 },
            { x: -1, z: 2 },
            { x: 1, z: 2 }
        ],
        wallPositions: [
            { x: 1, z: 0 },
            { x: -1, z: 0 }
        ]
    },
    {
        blockPositions: [
            { x: 1, z: 1 },
            { x: -1, z: 1 },
            { x: 0, z: -1 },
            { x: -1, z: -1 },
            { x: 1, z: -1 }
        ],
        targetPositions: [
            { x: 2, z: 0 },
            { x: 2, z: 1 },
            { x: 2, z: -1 },
            { x: -2, z: 0 },
            { x: -2, z: 1 }
        ],
        wallPositions: [
            { x: 0, z: 0 },
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 2 },
            { x: 0, z: -2 }
        ]
    }
];

function createPixelatedTexture(color, size = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 4) {
        for (let y = 0; y < size; y += 4) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            ctx.fillRect(x, y, 4, 4);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

function createVolcano() {
    const volcanoGroup = new THREE.Group();
    const brickMaterial = new THREE.MeshBasicMaterial({ map: createPixelatedTexture('#8B0000') });

    for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), brickMaterial);
            cube.position.set(x + 3, 0.25, z);
            volcanoGroup.add(cube);
        }
    }
    for (let x = -0.5; x <= 0.5; x += 1) {
        for (let z = -0.5; z <= 0.5; z += 1) {
            if (x === 0 && z === 0) continue;
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), brickMaterial);
            cube.position.set(x + 3, 0.75, z);
            volcanoGroup.add(cube);
        }
    }
    const topCube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), brickMaterial);
    topCube.position.set(3, 1.25, 0);
    volcanoGroup.add(topCube);

    scene.add(volcanoGroup);
    return volcanoGroup;
}

function createLavaParticles() {
    const particles = new THREE.Group();
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), particleMaterial);
        particle.position.set(
            3 + (Math.random() - 0.5) * 0.5,
            1.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        particles.add(particle);
    }
    scene.add(particles);
    return particles;
}

function animateLevel4Win() {
    isAnimationPlaying = true;
    document.getElementById('ui').style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);

    const volcano = createVolcano();
    const particles = createLavaParticles();

    let time = 0;
    const duration = 7000;
    const originalCameraPos = camera.position.clone();
    const originalCameraTarget = new THREE.Vector3(0, 0, 0);

    const animationText = document.getElementById('animationText');
    animationText.style.display = 'block';

    function animateScene() {
        if (time >= duration) {
            scene.remove(volcano);
            scene.remove(particles);
            animationText.style.display = 'none';
            document.getElementById('continuationScreen').style.display = 'flex';
            renderer.domElement.style.display = 'none';
            isAnimationPlaying = false;
            return;
        }

        time += 16;

        const t = time / duration;
        const jumpHeight = 3 * Math.sin(t * Math.PI);
        const xMove = 3 * t;
        player.position.set(xMove, 0.25 + jumpHeight, 0);

        const shake = 0.1 * Math.sin(time * 0.01);
        camera.position.set(originalCameraPos.x + shake, originalCameraPos.y + shake, originalCameraPos.z);

        const angle = t * Math.PI * 2;
        camera.position.x = 3 + 5 * Math.cos(angle);
        camera.position.z = 5 * Math.sin(angle);
        camera.lookAt(3, 1, 0);

        particles.children.forEach(particle => {
            particle.position.y += 0.01;
            if (particle.position.y > 2) particle.position.y = 1.5;
        });

        requestAnimationFrame(animateScene);
        renderer.render(scene, camera);
    }

    requestAnimationFrame(animateScene);
}

function saveState() {
    const state = {
        playerPos: { x: playerPos.x, z: playerPos.z },
        blocks: blocks.map(b => ({ x: b.x, z: b.z })),
        moves: moves
    };
    moveHistory.push(state);
    if (moveHistory.length > 50) moveHistory.shift();
}

function undoMove() {
    if (moveHistory.length === 0) return;
    const lastState = moveHistory.pop();
    playerPos.x = lastState.playerPos.x;
    playerPos.z = lastState.playerPos.z;
    player.position.set(playerPos.x, 0.25, playerPos.z);
    blocks.forEach((block, index) => {
        block.x = lastState.blocks[index].x;
        block.z = lastState.blocks[index].z;
        block.mesh.position.set(block.x, 0.25, block.z);
    });
    moves = lastState.moves;
    document.getElementById('moves').textContent = moves;
    updateBlockPositionsUI();
}

function updateBlockPositionsUI() {
    document.getElementById('blockPositions').textContent = `Blocks: ${blocks.map(b => `(${b.x},${b.z})`).join(', ')}`;
}

function showLevelSelect() {
    const levelSelect = document.getElementById('levelSelect');
    levelSelect.style.display = 'block';
    window.removeEventListener('keydown', onKeyDown);
}

function hideLevelSelect() {
    const levelSelect = document.getElementById('levelSelect');
    levelSelect.style.display = 'none';
    window.addEventListener('keydown', onKeyDown);
}

function selectLevel(level) {
    currentLevel = level;
    moves = 0;
    moveHistory = [];
    loadLevel(currentLevel);
    hideLevelSelect();
}

function initTouchControls() {
    const touchControls = document.getElementById('touchControls');
    const directions = ['up', 'down', 'left', 'right'];
    directions.forEach(dir => {
        const button = document.createElement('button');
        button.className = 'touchButton';
        button.textContent = dir.charAt(0).toUpperCase() + dir.slice(1);
        button.addEventListener('click', () => simulateKeyPress(dir));
        touchControls.appendChild(button);
    });
}

function simulateKeyPress(direction) {
    const keyMap = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    };
    const event = new KeyboardEvent('keydown', { key: keyMap[direction] });
    window.dispatchEvent(event);
}

function loadLevel(level) {
    if (player) scene.remove(player);
    if (blocks) blocks.forEach(block => scene.remove(block.mesh));
    if (targets) targets.forEach(target => scene.remove(target.mesh));
    if (walls) walls.forEach(wall => scene.remove(wall.mesh));

    playerPos = { x: 0, z: 0 };
    const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const playerMaterial = new THREE.MeshBasicMaterial({ 
        map: createPixelatedTexture('#00ff00')
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.25, 0);
    scene.add(player);

    blocks = [];
    const levelData = levels[level - 1];
    levelData.blockPositions.forEach(pos => {
        const blockGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const blockMaterial = new THREE.MeshBasicMaterial({ 
            map: createPixelatedTexture('#ff0000')
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(pos.x, 0.25, pos.z);
        scene.add(block);
        blocks.push({ mesh: block, x: pos.x, z: pos.z });
        console.log(`Level ${level} - Block placed at (${pos.x}, ${pos.z})`);
    });

    updateBlockPositionsUI();

    targets = [];
    levelData.targetPositions.forEach(pos => {
        const targetGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const targetMaterial = new THREE.MeshBasicMaterial({ 
            map: createPixelatedTexture('#ffff00')
        });
        const target = new THREE.Mesh(targetGeometry, targetMaterial);
        target.position.set(pos.x, 0.05, pos.z);
        scene.add(target);
        targets.push({ mesh: target, x: pos.x, z: pos.z });
    });

    walls = [];
    levelData.wallPositions.forEach(pos => {
        const wallGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const wallMaterial = new THREE.MeshBasicMaterial({ 
            map: createPixelatedTexture('#0000ff')
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(pos.x, 0.25, pos.z);
        scene.add(wall);
        walls.push({ mesh: wall, x: pos.x, z: pos.z });
    });

    document.getElementById('level').textContent = level;
    document.getElementById('moves').textContent = moves;
    document.getElementById('nextLevel').style.display = 'none';
}

function onKeyDown(event) {
    if (isAnimationPlaying) return;

    saveState();

    const prevPos = { x: playerPos.x, z: playerPos.z };
    let newX = playerPos.x;
    let newZ = playerPos.z;
    let direction = null;

    switch (event.key) {
        case 'ArrowUp':
            if (playerPos.z > -gridSize / 2) {
                newZ -= 1;
                direction = 'up';
            }
            break;
        case 'ArrowDown':
            if (playerPos.z < gridSize / 2 - 1) {
                newZ += 1;
                direction = 'down';
            }
            break;
        case 'ArrowLeft':
            if (playerPos.x > -gridSize / 2) {
                newX -= 1;
                direction = 'left';
            }
            break;
        case 'ArrowRight':
            if (playerPos.x < gridSize / 2 - 1) {
                newX += 1;
                direction = 'right';
            }
            break;
        case 'u':
        case 'U':
            undoMove();
            return;
    }

    if (direction) {
        const wall = walls.find(w => w.x === newX && w.z === newZ);
        if (wall) {
            moveHistory.pop();
            return;
        }

        const block = blocks.find(b => b.x === newX && b.z === newZ);
        if (block) {
            let blockNewX = block.x;
            let blockNewZ = block.z;
            if (direction == 'up') blockNewZ -= 1;
            else if (direction == 'down') blockNewZ += 1;
            else if (direction == 'left') blockNewX -= 1;
            else if (direction == 'right') blockNewX += 1;

            if (Math.abs(blockNewX) <= gridSize / 2 && Math.abs(blockNewZ) <= gridSize / 2) {
                const blockAtNewPos = blocks.find(b => b.x === blockNewX && b.z === blockNewZ);
                const wallAtNewPos = walls.find(w => w.x === blockNewX && w.z === blockNewZ);
                if (!blockAtNewPos && !wallAtNewPos) {
                    block.x = blockNewX;
                    block.z = blockNewZ;
                    block.mesh.position.set(blockNewX, 0.25, blockNewZ);
                    playerPos.x = newX;
                    playerPos.z = newZ;
                    player.position.set(newX, 0.25, newZ);
                    moves++;
                    document.getElementById('moves').textContent = moves;
                    updateBlockPositionsUI();
                } else {
                    moveHistory.pop();
                }
            } else {
                moveHistory.pop();
            }
        } else {
            playerPos.x = newX;
            playerPos.z = newZ;
            player.position.set(newX, 0.25, newZ);
            moves++;
            document.getElementById('moves').textContent = moves;
        }
        checkWin();
    }
}

function checkWin() {
    const allBlocksOnTargets = blocks.every(block => 
        targets.some(target => target.x === block.x && target.z === block.z)
    );
    if (allBlocksOnTargets) {
        if (currentLevel === 4) {
            animateLevel4Win();
        } else if (currentLevel < maxLevels) {
            document.getElementById('nextLevel').style.display = 'block';
        }
    }
}

function loadNextLevel() {
    currentLevel++;
    moves = 0;
    moveHistory = [];
    loadLevel(currentLevel);
}

function resetGame() {
    moves = 0;
    moveHistory = [];
    loadLevel(currentLevel);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

function init() {
    console.log('Initializing game...');

    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Cannot initialize game.');
        alert('Error: Three.js failed to load. Please check your internet connection or try again later.');
        hideLoadingScreen();
        return;
    }

    try {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(1);
        document.body.appendChild(renderer.domElement);

        camera.position.set(0, 7, 5);
        camera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0x808080);
        scene.add(ambientLight);

        const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            map: createPixelatedTexture('#555555'),
            side: THREE.DoubleSide
        });
        floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        for (let i = -gridSize / 2; i <= gridSize / 2; i++) {
            const pointsX = [];
            pointsX.push(new THREE.Vector3(i, 0.01, -gridSize / 2));
            pointsX.push(new THREE.Vector3(i, 0.01, gridSize / 2));
            const geometryX = new THREE.BufferGeometry().setFromPoints(pointsX);
            const lineX = new THREE.Line(geometryX, lineMaterial);
            scene.add(lineX);

            const pointsZ = [];
            pointsZ.push(new THREE.Vector3(-gridSize / 2, 0.01, i));
            pointsZ.push(new THREE.Vector3(gridSize / 2, 0.01, i));
            const geometryZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
            const lineZ = new THREE.Line(geometryZ, lineMaterial);
            scene.add(lineZ);
        }

        loadLevel(currentLevel);
        initTouchControls();
        console.log(`Level ${currentLevel} loaded - Blocks: ${levels[currentLevel-1].blockPositions.length}, Walls: ${levels[currentLevel-1].wallPositions.length}`);

        window.addEventListener('keydown', onKeyDown);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        hideLoadingScreen();
        animate();
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('Error: Game failed to initialize. Please check the console for details.');
        hideLoadingScreen();
    }

    // Fallback timeout to hide loading screen if initialization hangs
    setTimeout(() => {
        if (document.getElementById('loadingScreen').style.display !== 'none') {
            console.warn('Initialization took too long. Forcing loading screen to hide.');
            hideLoadingScreen();
        }
    }, 5000);
}

init();
