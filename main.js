/**
 * CareSense Global Intelligence Engine
 * v5.0 - International Platform Logic
 */

const ENCRYPTED_KEY_DATA = "88f81c0be7e9b1f9173362be10d33173:8b316149c80cc86702f95a2cb33dfd935b6f251eddec776a9262b6f1463c2d3e2e7049498cb718d389734e769024099da2c359827a92ff8590b1dec090156dff";
const SALT = "breast-cancer-assessment-nursing-secure-salt";

let diagnostic3DEngine = null;


function getDecryptedKey() {
    try {
        if (typeof CryptoJS === 'undefined') return null;
        const parts = ENCRYPTED_KEY_DATA.split(':');
        const iv = CryptoJS.enc.Hex.parse(parts[0]);
        const ciphertext = CryptoJS.enc.Hex.parse(parts[1]);
        const key = CryptoJS.SHA256(SALT);
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) { return null; }
}

// Selectors
const symptomsInput = document.getElementById('symptoms');
const analyzeBtn = document.getElementById('analyze-btn');
const btnText = document.getElementById('btn-text');
const loader = document.getElementById('loader');
const resultPanel = document.getElementById('result-panel');
const riskDisplay = document.getElementById('risk-display');
const confValLabel = document.getElementById('conf-val');
const reasoningBox = document.getElementById('reasoning-box');

if (analyzeBtn) {
    analyzeBtn.onclick = async function () {
        const symptoms = symptomsInput.value.trim();
        if (!symptoms) {
            alert("Please input clinical data to initialize international assessment.");
            return;
        }

        // Logic Initialization
        analyzeBtn.disabled = true;
        loader.classList.remove('hidden');
        btnText.textContent = "ALGORITHMS INITIALIZING...";
        resultPanel.classList.add('hidden');

        try {
            const apiKey = getDecryptedKey();
            if (!apiKey) throw new Error("Security handshake failed.");

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: `You are the CareSense Global Principal Oncologist. 
                            Your goal is to calculate the 'Malignancy Probability Score' (MPS).
                            
                            DIAGNOSTIC PROTOCOL:
                            1. Analyze symptoms for Triple-Negative or Malignant indicators (Hardness, Fixation, Non-painful).
                            2. Set MPS as a decimal (0.00 to 1.00):
                               - High Risk (>0.70): Hard, fixed, painless, Skin changes.
                               - Moderate Risk (0.30-0.70): New lumps, unclear borders.
                               - Low Risk (<0.30): Soft, mobile, painful (likely inflammatory/cyst).
                            3. Accuracy is paramount. Ensure the score varies highly with every detail.
                            
                            Output JSON:
                            {
                                "risk": "High" | "Moderate" | "Low",
                                "probability": 0.0000,
                                "factor_scores": { "density": 0-10, "history": 0-10, "skin": 0-10, "discharge": 0-10, "pain": 0-10 },
                                "reasoning": "Clinical evidence-based justification for the MPS."
                            }`
                        },
                        {
                            role: "user",
                            content: `[Diagnostic ID: ${Math.random().toString(36).substring(7)}] Clinical Findings: ${symptoms}`
                        }
                    ],
                    temperature: 0.6,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error("Cloud Connectivity Error.");

            const data = await response.json();
            const content = JSON.parse(data.choices[0].message.content);

            renderPlatformResults(content);

        } catch (error) {
            console.error("Diagnostic Error:", error);
            alert("SYSTEM ERROR: " + error.message);
        } finally {
            analyzeBtn.disabled = false;
            loader.classList.add('hidden');
            btnText.textContent = "INITIALIZE ANALYTICS";
        }
    };
}

function renderPlatformResults(data) {
    const { risk, probability, factor_scores, reasoning } = data;

    // Transition Dashboard
    resultPanel.classList.remove('hidden');
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Risk Branding
    const riskStatus = risk.toUpperCase();
    riskDisplay.textContent = `DIAGNOSIS: ${riskStatus} RISK`;

    // Dynamic Color Mapping
    let statusColor = "#10b981"; // Green
    if (probability > 0.4) statusColor = "#f59e0b"; // Orange/Amber
    if (probability > 0.7) statusColor = "#db2777"; // Pink/Red

    riskDisplay.style.color = statusColor;

    // Animated Counter for Probability
    console.log("CareSense Global AI Data:", data);
    animateCounter(probability, confValLabel);

    // Initializations 3D Visuals
    const isHigh = probability > 0.7;
    init3DPlatform(probability, factor_scores, statusColor, isHigh);

    // Reasoning Feed
    typewriterEffect(reasoning, reasoningBox);
}

/**
 * Three.js 3D Diagnostic Engine
 */
class ThreeDiagnosticEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 20;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.pointLight = new THREE.PointLight(0xffffff, 1);
        this.pointLight.position.set(5, 5, 5);
        this.scene.add(this.pointLight);

        // State
        this.crystal = null;
        this.orb = null;
        this.scanRing = null;
        this.targetColor = new THREE.Color("#10b981");
        this.pulseFactor = 1.0;

        this.initGeometries();
        this.animate();

        window.addEventListener('resize', () => this.handleResize());
    }

    initGeometries() {
        // 0. Reference Grid
        const grid = new THREE.PolarGridHelper(10, 16, 8, 64, 0x000000, 0x000000);
        grid.position.y = -8;
        grid.material.opacity = 0.05;
        grid.material.transparent = true;
        this.scene.add(grid);

        // 1. Crystal (Hexagonal/Polyhedron representation of metrics)
        const geometry = new THREE.IcosahedronGeometry(6, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0xec4899,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.crystal = new THREE.Mesh(geometry, material);
        this.scene.add(this.crystal);

        // 2. Risk Orb (The Core)
        const orbGeo = new THREE.SphereGeometry(2, 32, 32);
        const orbMat = new THREE.MeshPhongMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        this.orb = new THREE.Mesh(orbGeo, orbMat);
        this.scene.add(this.orb);

        // 3. Scanning Ring
        const ringGeo = new THREE.TorusGeometry(8, 0.05, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.5 });
        this.scanRing = new THREE.Mesh(ringGeo, ringMat);
        this.scanRing.rotation.x = Math.PI / 2;
        this.scene.add(this.scanRing);
    }


    updateData(probability, scores, color, isHigh) {
        this.targetColor = new THREE.Color(color);
        this.isHigh = isHigh;
        this.probability = probability;

        // Update Crystal Vertices based on scores
        // Each score is 0-10. We map it to vertex distance.
        const positionAttribute = this.crystal.geometry.attributes.position;
        const vertexCount = positionAttribute.count;
        const scoreValues = [scores.density, scores.history, scores.skin, scores.discharge, scores.pain];

        for (let i = 0; i < vertexCount; i++) {
            const scoreIndex = i % scoreValues.length;
            const factor = (scoreValues[scoreIndex] / 10) * 2 + 5; // Scale to 5-7 range

            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);

            const vector = new THREE.Vector3(x, y, z).normalize().multiplyScalar(factor);
            positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
        }
        this.crystal.geometry.attributes.position.needsUpdate = true;

        // Update Colors
        this.orb.material.color = this.targetColor;
        this.orb.material.emissive = this.targetColor;
        this.crystal.material.color = this.targetColor;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.crystal) {
            this.crystal.rotation.y += 0.005;
            this.crystal.rotation.z += 0.002;
        }

        if (this.orb) {
            // Pulsing effect based on probability
            const speed = 0.02 + (this.probability || 0) * 0.05;
            this.pulseFactor += speed;
            const scale = 1 + Math.sin(this.pulseFactor) * 0.1;
            this.orb.scale.set(scale, scale, scale);
            this.orb.material.emissiveIntensity = 0.5 + Math.sin(this.pulseFactor) * 0.3;
        }

        if (this.scanRing) {
            this.scanRing.position.y = Math.sin(Date.now() * 0.002) * 8;
            this.scanRing.material.opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.2;
        }

        this.renderer.render(this.scene, this.camera);
    }


    handleResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }
}

function init3DPlatform(probability, scores, color, isHigh) {
    if (!diagnostic3DEngine) {
        diagnostic3DEngine = new ThreeDiagnosticEngine('diagnostic-3d-container');
    }
    diagnostic3DEngine.updateData(probability, scores, color, isHigh);
}


function animateCounter(target, element) {
    const final = target * 100;
    const duration = 2000;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const val = (progress * final).toFixed(2);
        element.textContent = val + "%";
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function typewriterEffect(text, element) {
    let idx = 0;
    element.innerHTML = '';
    const timer = setInterval(() => {
        if (idx < text.length) {
            element.innerHTML += text.charAt(idx);
            idx++;
        } else { clearInterval(timer); }
    }, 12);
}
