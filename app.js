// Initialize chart
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  width: document.getElementById('chart').clientWidth,
  height: 300,
  layout: {
    background: { color: '#1E1E2F' },
    textColor: '#D9D9D9',
  },
  grid: {
    vertLines: { color: '#2A2A3A' },
    horzLines: { color: '#2A2A3A' },
  }
});
const candleSeries = chart.addCandlestickSeries();

// Deriv WebSocket connection
const derivWS = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

// Debug logging
function log(message) {
  const debugEl = document.getElementById('debug-log');
  debugEl.textContent += `${new Date().toLocaleTimeString()}: ${message}\n`;
  debugEl.scrollTop = debugEl.scrollHeight;
}

derivWS.onopen = () => {
  log("WebSocket connected");
  document.getElementById('connection-status').textContent = 'CONNECTED';
  document.getElementById('connection-status').style.background = '#4CAF50';

  // Subscribe to Boom 1000 ticks
  derivWS.send(JSON.stringify({
    "ticks": "boom1000",
    "subscribe": 1
  }));
};

derivWS.onmessage = (msg) => {
  try {
    const data = JSON.parse(msg.data);
    log(`Received: ${JSON.stringify(data)}`);

    if (data.tick) {
      updateChart(data.tick);
      checkSpikes(data.tick);
    }
  } catch (e) {
    log(`Error: ${e.message}`);
  }
};

derivWS.onerror = (error) => {
  log(`WebSocket error: ${error.message}`);
  document.getElementById('connection-status').textContent = 'DISCONNECTED';
  document.getElementById('connection-status').style.background = '#F44336';
};

// Update chart with latest tick
function updateChart(tick) {
  candleSeries.update({
    time: Math.floor(Date.now() / 1000),
    open: tick.open,
    high: tick.high,
    low: tick.low,
    close: tick.quote
  });
}

// Spike detection (150 points minimum)
function checkSpikes(tick) {
  const change = tick.quote - tick.open;
  const isSpike = Math.abs(change) >= 150;

  if (isSpike) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${change > 0 ? 'bull' : 'bear'}`;
    alertDiv.innerHTML = `
      ${change > 0 ? '▲' : '▼'} ${Math.abs(change)}pts 
      @ ${tick.quote.toFixed(2)}
      <small>${new Date().toLocaleTimeString()}</small>
    `;

    document.getElementById('alerts-container').prepend(alertDiv);
    log(`${change > 0 ? 'Bull' : 'Bear'} spike detected`);
  }
}
