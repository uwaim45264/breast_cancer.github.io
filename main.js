/**
 * CareSense Global Intelligence Engine
 * v5.0 - International Platform Logic
 */

const ENCRYPTED_KEY_DATA = "88f81c0be7e9b1f9173362be10d33173:8b316149c80cc86702f95a2cb33dfd935b6f251eddec776a9262b6f1463c2d3e2e7049498cb718d389734e769024099da2c359827a92ff8590b1dec090156dff";
const SALT = "breast-cancer-assessment-nursing-secure-salt";

let confidenceChartInstance = null;
let radarChartInstance = null;

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

    // Initializations Charts
    const isHigh = probability > 0.7;
    initPlatformCharts(probability, factor_scores, statusColor, isHigh);

    // Reasoning Feed
    typewriterEffect(reasoning, reasoningBox);
}

function initPlatformCharts(probability, scores, mainColor, isHigh) {
    // Probability Donut
    if (confidenceChartInstance) confidenceChartInstance.destroy();
    const confCtx = document.getElementById('confidenceChart').getContext('2d');
    confidenceChartInstance = new Chart(confCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [probability * 100, (1 - probability) * 100],
                backgroundColor: [mainColor, '#f1f5f9'],
                borderWidth: 0,
            }]
        },
        options: { cutout: '82%', responsive: true, maintainAspectRatio: false, plugins: { tooltip: { enabled: false }, legend: { display: false } }, animation: { duration: 2500, easing: 'easeOutQuart' } }
    });

    // Radar Profile
    if (radarChartInstance) radarChartInstance.destroy();
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    radarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['Density', 'History', 'Skin', 'Discharge', 'Pain'],
            datasets: [{
                label: 'Symptomatic Intensity',
                data: [scores.density, scores.history, scores.skin, scores.discharge, scores.pain],
                backgroundColor: isHigh ? 'rgba(219, 39, 119, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                borderColor: mainColor,
                pointBackgroundColor: '#0f172a',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,0,0,0.05)' }, angleLines: { color: 'rgba(0,0,0,0.05)' }, ticks: { display: false } } },
            plugins: { legend: { display: false } },
            animation: { duration: 2000, easing: 'easeOutQuart' }
        }
    });
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
