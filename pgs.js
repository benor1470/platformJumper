// ============================================================
//  Google Play Games Services — Web leaderboard integration
//  Platform Jumper
//
//  SETUP (one-time, in Google Play Console + Cloud Console):
//  1. Go to play.google.com/console → create / open your game
//  2. Play Games Services → Setup → "I don't use Google APIs yet"
//  3. Add Credentials → Web (client-side) → copy the OAuth2 client ID
//  4. Play Games Services → Leaderboards → Add leaderboard
//     Name it "High Score", copy the Leaderboard ID
//  5. Fill in the two constants below and your GitHub Pages origin
// ============================================================

const PGS = (() => {

  // ── ⚠  FILL THESE IN  ─────────────────────────────────────
  const CLIENT_ID      = '160680656233-jhk8smor528qrfjb6rdcinv7gs3r8ld7.apps.googleusercontent.com';
  const LEADERBOARD_ID = 'CgkI6frAytYEEAIQAA';
  // ──────────────────────────────────────────────────────────

  const SCOPE    = 'https://www.googleapis.com/auth/games';
  const BASE_URL = 'https://games.googleapis.com/games/v1';

  const TIME_SPANS = ['ALL_TIME', 'WEEKLY', 'DAILY'];

  let tokenClient = null;
  let accessToken = null;
  let tokenExpiry = 0;
  let currentPlayer = null;

  // ── Internal helpers ──────────────────────────────────────

  function isReady() {
    return !!accessToken && Date.now() < tokenExpiry;
  }

  async function apiFetch(path, options = {}) {
    const res = await fetch(BASE_URL + path, {
      ...options,
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error('PGS API error ' + res.status);
    return res.json();
  }

  function onTokenReceived(response) {
    if (response.error) { console.warn('PGS sign-in error:', response.error); return; }
    accessToken = response.access_token;
    tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
    fetchCurrentPlayer().then(updateUI);
  }

  async function fetchCurrentPlayer() {
    try {
      currentPlayer = await apiFetch('/players/me');
    } catch(e) {
      currentPlayer = null;
    }
    return currentPlayer;
  }

  // ── Public API ────────────────────────────────────────────

  function init() {
    // GIS must already be loaded via <script> tag in index.html
    if (!window.google || !window.google.accounts) {
      console.warn('PGS: Google Identity Services not loaded');
      return;
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: onTokenReceived,
    });
    updateUI();
  }

  function signIn() {
    if (!tokenClient) { console.warn('PGS: not initialised'); return; }
    tokenClient.requestAccessToken({ prompt: isReady() ? '' : 'consent' });
  }

  function signOut() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    tokenExpiry = 0;
    currentPlayer = null;
    updateUI();
  }

  async function submitScore(score) {
    if (!isReady()) return;
    try {
      await apiFetch(
        `/leaderboards/${LEADERBOARD_ID}/scores?score=${Math.floor(score)}`,
        { method: 'POST' }
      );
    } catch(e) {
      console.warn('PGS: submitScore failed', e);
    }
  }

  // timeSpan: 'ALL_TIME' | 'WEEKLY' | 'DAILY'
  async function fetchLeaderboard(timeSpan = 'ALL_TIME', maxResults = 10) {
    if (!isReady()) return null;
    try {
      const data = await apiFetch(
        `/leaderboards/${LEADERBOARD_ID}/scores/PUBLIC` +
        `?timeSpan=${timeSpan}&maxResults=${maxResults}&includeRankType=ALL`
      );
      return data.items || [];
    } catch(e) {
      console.warn('PGS: fetchLeaderboard failed', e);
      return null;
    }
  }

  async function fetchAllTimeSpans() {
    if (!isReady()) return {};
    const [allTime, weekly, daily] = await Promise.all(
      TIME_SPANS.map(ts => fetchLeaderboard(ts))
    );
    return { ALL_TIME: allTime, WEEKLY: weekly, DAILY: daily };
  }

  // ── UI helpers (updates the DOM elements defined in index.html) ──

  function updateUI() {
    const signInBtn  = document.getElementById('pgs-signin');
    const signOutBtn = document.getElementById('pgs-signout');
    const playerEl   = document.getElementById('pgs-player');

    if (!signInBtn) return;

    const signed = isReady() && currentPlayer;
    signInBtn.style.display  = signed ? 'none' : 'inline-flex';
    signOutBtn.style.display = signed ? 'inline-flex' : 'none';
    playerEl.style.display   = signed ? 'block' : 'none';
    if (signed) {
      playerEl.textContent = currentPlayer.displayName || '';
      refreshLeaderboardUI();
    } else {
      showLeaderboardMessage('Sign in to see the leaderboard');
    }

    // Sync mobile controls
    const mob = {
      signin:  document.getElementById('mob-pgs-signin'),
      signout: document.getElementById('mob-pgs-signout'),
      player:  document.getElementById('mob-pgs-player'),
    };
    if (mob.signin)  mob.signin.style.display  = signed ? 'none'         : 'inline-block';
    if (mob.signout) mob.signout.style.display = signed ? 'inline-block' : 'none';
    if (mob.player)  { mob.player.style.display = signed ? 'inline' : 'none'; mob.player.textContent = signed ? (currentPlayer.displayName || '') : ''; }
  }

  async function refreshLeaderboardUI() {
    showLeaderboardMessage('Loading…');
    const data = await fetchAllTimeSpans();
    renderLeaderboard(data);
  }

  function showLeaderboardMessage(msg) {
    ['pgs-lb-body', 'pgs-lb-body-mob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="pgs-lb-msg">${msg}</div>`;
    });
  }

  function renderLeaderboard(data) {
    const body = document.getElementById('pgs-lb-body');
    if (!body) return;

    const activeTab = document.querySelector('.pgs-tab.active');
    const span = activeTab ? activeTab.dataset.span : 'ALL_TIME';
    const entries = data[span];

    if (!entries || entries.length === 0) {
      body.innerHTML = '<div class="pgs-lb-msg">No scores yet</div>';
      return;
    }

    body.innerHTML = entries.map((e, i) => {
      const rank  = e.scoreRank  || (i + 1);
      const name  = e.player?.displayName || 'Anonymous';
      const score = e.scoreValue || '0';
      const isMe  = currentPlayer && e.player?.playerId === currentPlayer.playerId;
      return `<div class="pgs-lb-row${isMe ? ' pgs-lb-me' : ''}">
        <span class="pgs-lb-rank">#${rank}</span>
        <span class="pgs-lb-name">${name}</span>
        <span class="pgs-lb-score">${Number(score).toLocaleString()}</span>
      </div>`;
    }).join('');
  }

  // Called from game's triggerGameOver
  async function onGameOver(score) {
    await submitScore(score);
    if (isReady()) refreshLeaderboardUI();
  }

  return {
    init,
    signIn,
    signOut,
    onGameOver,
    refreshLeaderboard: refreshLeaderboardUI,
    isSignedIn: isReady,
    TIME_SPANS,
    // expose for tab switching
    renderLeaderboard,
    fetchAllTimeSpans,
  };
})();
