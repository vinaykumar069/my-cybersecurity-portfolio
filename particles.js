
window.initParticleAnimation = () => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js has not been loaded.');
        return;
    }

    let scene, camera, renderer, particles, lines;
    let mouseX = 0, mouseY = 0;
    const particleCount = 150;
    const maxDistance = 100;
    const canvas = document.getElementById('particle-canvas');
    const grid = new Grid(800, 100);

    class Grid {
        constructor(size, cellSize) {
            this.size = size;
            this.cellSize = cellSize;
            this.grid = {};
        }

        _getCellIndex(x, y, z) {
            const ix = Math.floor((x + this.size / 2) / this.cellSize);
            const iy = Math.floor((y + this.size / 2) / this.cellSize);
            const iz = Math.floor((z + this.size / 2) / this.cellSize);
            return `${ix},${iy},${iz}`;
        }

        add(particle, index) {
            const cellIndex = this._getCellIndex(particle.x, particle.y, particle.z);
            if (!this.grid[cellIndex]) {
                this.grid[cellIndex] = [];
            }
            this.grid[cellIndex].push(index);
        }

        get(particle) {
            const cellIndex = this._getCellIndex(particle.x, particle.y, particle.z);
            const ix = Math.floor((particle.x + this.size / 2) / this.cellSize);
            const iy = Math.floor((particle.y + this.size / 2) / this.cellSize);
            const iz = Math.floor((particle.z + this.size / 2) / this.cellSize);

            const adjacentParticles = [];
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    for (let k = -1; k <= 1; k++) {
                        const adjacentCellIndex = `${ix + i},${iy + j},${iz + k}`;
                        if (this.grid[adjacentCellIndex]) {
                            adjacentParticles.push(...this.grid[adjacentCellIndex]);
                        }
                    }
                }
            }
            return adjacentParticles;
        }

        clear() {
            this.grid = {};
        }
    }


    if (!canvas) {
        console.error('Canvas element #particle-canvas not found.');
        return;
    }

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 300;

        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() * 2 - 1) * 400;
            positions[i * 3 + 1] = (Math.random() * 2 - 1) * 400;
            positions[i * 3 + 2] = (Math.random() * 2 - 1) * 400;

            velocities.push({
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 0.5
            });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.velocities = velocities;

        const colors = new Float32Array(particleCount * 3);
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 2,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.7,
            vertexColors: true
        });

        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(particleCount * particleCount * 3);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x9ca3af,
            transparent: true,
            opacity: 0.1
        });

        lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        window.addEventListener('resize', debounce(onWindowResize, 250), false);
        document.addEventListener('mousemove', onMouseMove, false);
    }

    function debounce(fn, ms) {
        let timer;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                fn.apply(this, arguments);
            }, ms);
        };
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(event) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function animate() {
        requestAnimationFrame(animate);

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.velocities;
        const colors = particles.geometry.attributes.color.array;
        const linePositions = lines.geometry.attributes.position.array;
        let lineVertexIndex = 0;

        const color1 = new THREE.Color(0x3b82f6);
        const color2 = new THREE.Color(0x22d3ee);

        grid.clear();
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            const t = (positions[i * 3 + 1] + 400) / 800;
            const color = new THREE.Color().lerpColors(color1, color2, t);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            if (positions[i * 3 + 1] < -400 || positions[i * 3 + 1] > 400) velocities[i].y = -velocities[i].y;
            if (positions[i * 3] < -400 || positions[i * 3] > 400) velocities[i].x = -velocities[i].x;
            if (positions[i * 3 + 2] < -400 || positions[i * 3 + 2] > 400) velocities[i].z = -velocities[i].z;
            
            const particle = {
                x: positions[i * 3],
                y: positions[i * 3 + 1],
                z: positions[i * 3 + 2]
            };
            grid.add(particle, i);
        }

        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: positions[i * 3],
                y: positions[i * 3 + 1],
                z: positions[i * 3 + 2]
            };
            const adjacentParticles = grid.get(particle);

            for (let j = 0; j < adjacentParticles.length; j++) {
                const neighborIndex = adjacentParticles[j];
                if (i >= neighborIndex) continue;

                const dx = positions[i * 3] - positions[neighborIndex * 3];
                const dy = positions[i * 3 + 1] - positions[neighborIndex * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[neighborIndex * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < maxDistance) {
                    linePositions[lineVertexIndex++] = positions[i * 3];
                    linePositions[lineVertexIndex++] = positions[i * 3 + 1];
                    linePositions[lineVertexIndex++] = positions[i * 3 + 2];
                    linePositions[lineVertexIndex++] = positions[neighborIndex * 3];
                    linePositions[lineVertexIndex++] = positions[neighborIndex * 3 + 1];
                    linePositions[lineVertexIndex++] = positions[neighborIndex * 3 + 2];
                }
            }
        }

        lines.geometry.setDrawRange(0, lineVertexIndex / 3);
        lines.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;

        // Subtle mouse interaction
        camera.position.x += (mouseX * 50 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 50 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        const mouseVector = new THREE.Vector3(mouseX * 400, mouseY * 400, 0);
        for (let i = 0; i < particleCount; i++) {
            const particleVector = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            const dist = particleVector.distanceTo(mouseVector);

            if (dist < 150) {
                const repulsionForce = (150 - dist) / 150;
                const repulsion = new THREE.Vector3().subVectors(particleVector, mouseVector).normalize().multiplyScalar(repulsionForce * 0.5);
                velocities[i].x += repulsion.x;
                velocities[i].y += repulsion.y;
            }
        }

        renderer.render(scene, camera);
    }

    init();
    animate();
};
