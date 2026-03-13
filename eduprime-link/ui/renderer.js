const statusIcon  = document.getElementById('status-icon');
const statusTitle = document.getElementById('status-title');
const statusDesc  = document.getElementById('status-desc');
const btnRetry    = document.getElementById('btn-retry');
const logOutput   = document.getElementById('log-output');

// ── Status icons (inline SVG, no network dependency) ──

const ICONS = {
    setup: `<svg class="spinner" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="27" stroke="#e2e8f0" stroke-width="5"/>
        <path d="M32 5a27 27 0 0 1 27 27" stroke="#4A6CF7" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
    ready: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#dcfce7"/>
        <path d="M19 32l9 9 17-17" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    error: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#fee2e2"/>
        <path d="M22 22l20 20M42 22L22 42" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
    </svg>`
};

const COPY = {
    setup: {
        title: 'Getting ready...',
        desc:  'Setting up Arduino tools. This only happens once.'
    },
    ready: {
        title: 'EduPrime Link is running',
        desc:  'Open your Arduino editor in the browser to get started.'
    },
    error: {
        title: 'Something went wrong',
        desc:  'Please try again or restart the app.'
    }
};

// ── UI helpers ──

function setAppState(state, message) {
    const s = ICONS[state] ? state : 'setup';
    statusIcon.innerHTML  = ICONS[s];
    statusTitle.textContent = COPY[s].title;
    statusDesc.textContent  = s === 'error'
        ? (message || COPY.error.desc)
        : (message || COPY[s].desc);
    btnRetry.style.display = s === 'error' ? 'block' : 'none';
}

function appendLog(type, message) {
    const p = document.createElement('p');
    p.className  = `log-${type.toLowerCase()}`;
    p.textContent = `> ${message}`;
    logOutput.appendChild(p);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// ── Retry button ──

btnRetry.addEventListener('click', () => {
    setAppState('setup');
    if (window.linkAPI) {
        window.linkAPI.reload();
    } else {
        location.reload();
    }
});

// ── Health polling — reflects setup progress ──

async function pollSetupStatus() {
    try {
        const res  = await fetch('http://localhost:8990/health');
        const data = await res.json();
        const { setupStatus, setupMessage } = data;

        setAppState(setupStatus || 'setup', setupMessage);

        if (setupStatus !== 'ready' && setupStatus !== 'error') {
            setTimeout(pollSetupStatus, 1500);
        }
    } catch {
        // Server not yet up — keep polling silently
        setTimeout(pollSetupStatus, 1500);
    }
}

// ── eduAPI event listeners (log activity in Details panel) ──

if (window.eduAPI) {
    window.eduAPI.onUploadStatus((status) => {
        const { phase, status: s, message } = status;
        const type = s === 'error' ? 'ERROR' : s === 'done' ? 'SUCCESS' : 'INFO';
        appendLog(type, message || `${phase}: ${s}`);
    });

    window.eduAPI.onSerialData((data) => {
        if (!data) return;
        for (const line of data.split('\n')) {
            if (line.trim()) appendLog('DATA', line);
        }
    });

    window.eduAPI.onCodeReceived((code) => {
        appendLog('INFO', `Received script (${code.length} bytes) from editor.`);
    });
}

// ── Init ──

setAppState('setup');
pollSetupStatus();
