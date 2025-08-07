const API_URL = "http://localhost:5000/datos";
const charts = {};
let lastValues = {};
let errorCount = 0;

// Configuración global de Chart.js
Chart.defaults.font.family = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
Chart.defaults.color = '#666';

function createChart(canvasId, label, color, unit = '') {
    const ctx = document.getElementById(canvasId).getContext("2d");
    
    // Crear gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '10');

    charts[canvasId] = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 2,
                    cornerRadius: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${label}: ${context.parsed.y}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Tiempo",
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 45,
                        color: '#666'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `${label} (${unit})`,
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + unit;
                        }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart(canvasId, value) {
    const chart = charts[canvasId];
    if (!chart) return;

    const now = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(value);

    // Mantener solo los últimos 15 puntos para mejor visualización
    if (chart.data.labels.length > 15) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update('none'); // Sin animación para actualizaciones en tiempo real
}

function updatePresenceStatus(presence) {
    const indicator = document.getElementById('presenceIndicator');
    const text = document.getElementById('presenceText');
    const icon = document.getElementById('presenceIcon');

    if (presence === "presence") {
        indicator.className = 'presence-indicator presence-true';
        text.textContent = 'PRESENCIA DETECTADA';
        icon.className = 'fas fa-user-check';
    } else {
        indicator.className = 'presence-indicator presence-false';
        text.textContent = 'SIN PRESENCIA';
        icon.className = 'fas fa-user-slash';
    }
}

function updateMetricCards(sensitivity, near, far, target) {
    // Actualizar valores en las tarjetas
    document.getElementById('sensitivityValue').textContent = sensitivity;
    document.getElementById('nearValue').textContent = near.toFixed(2) + ' m';
    document.getElementById('farValue').textContent = far.toFixed(2) + ' m';
    document.getElementById('targetValue').textContent = target.toFixed(2) + ' m';

    // Actualizar valores actuales en los gráficos
    document.getElementById('sensitivityCurrent').textContent = sensitivity;
    document.getElementById('nearCurrent').textContent = near.toFixed(2) + ' m';
    document.getElementById('farCurrent').textContent = far.toFixed(2) + ' m';
    document.getElementById('targetCurrent').textContent = target.toFixed(2) + ' m';
}

function updateConnectionStatus(isConnected) {
    const statusIndicator = document.getElementById('connectionStatus');
    const connectionText = document.getElementById('connectionText');

    if (isConnected) {
        statusIndicator.style.background = '#4CAF50';
        connectionText.textContent = 'Conectado';
        errorCount = 0;
    } else {
        statusIndicator.style.background = '#f44336';
        connectionText.textContent = 'Error de Conexión';
    }
}

function updateLastUpdateTime() {
    const now = new Date().toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    document.getElementById('lastUpdate').textContent = now;
}

async function fetchSensorData() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.error) {
            console.error("Error API:", data.error);
            updateConnectionStatus(false);
            return;
        }

        updateConnectionStatus(true);
        updateLastUpdateTime();

        // Obtener valores correctos (MISMA LÓGICA QUE TENÍAS)
        const presence = data.find(item => item.code === "presence_state")?.value || "none";
        const sensitivity = data.find(item => item.code === "sensitivity")?.value || 0;
        const near = (data.find(item => item.code === "near_detection")?.value || 0) / 100;
        const far = (data.find(item => item.code === "far_detection")?.value || 0) / 100;
        const target = (data.find(item => item.code === "target_dis_closest")?.value || 0) / 100;

        // Actualizar interfaz
        updatePresenceStatus(presence);
        updateMetricCards(sensitivity, near, far, target);

        // Actualizar gráficas (MISMA LÓGICA QUE TENÍAS)
        updateChart("chart-sensitivity", sensitivity);
        updateChart("chart-near", near);
        updateChart("chart-far", far);
        updateChart("chart-target", target);

        // Guardar valores para comparación
        lastValues = { sensitivity, near, far, target };

    } catch (err) {
        console.error("Error al obtener datos:", err);
        errorCount++;
        updateConnectionStatus(false);
        
        if (errorCount > 3) {
            console.warn("Múltiples errores de conexión detectados");
        }
    }
}

// Inicialización (EXACTAMENTE IGUAL A TU CÓDIGO ORIGINAL)
window.onload = () => {
    // Crear gráficas con colores mejorados y unidades
    createChart("chart-sensitivity", "Sensibilidad", "#ff6b6b", "");
    createChart("chart-near", "Detección Cercana", "#4dabf7", " m");
    createChart("chart-far", "Detección Lejana", "#51cf66", " m");
    createChart("chart-target", "Objetivo más Cercano", "#ffd43b", " m");

    // Llamar cada 5 segundos (IGUAL QUE ANTES)
    fetchSensorData();
    setInterval(fetchSensorData, 5000);

    console.log("Dashboard iniciado correctamente");
};

// Manejo de errores globales mejorado
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
});

// Detectar pérdida de conexión
window.addEventListener('offline', () => {
    updateConnectionStatus(false);
});

window.addEventListener('online', () => {
    fetchSensorData();
});