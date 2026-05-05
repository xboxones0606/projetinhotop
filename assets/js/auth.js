const SUPABASE_URL = "https://zbasgdtlpiapmigavhhr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CR2j8ueH-ZmfpycvTk7Ezg_muICsOuZ";
const DEVICE_ID_KEY = "cnh_device_id";
const SESSION_ID_KEY = "cnh_session_id";
const HEARTBEAT_MS = 30000;
const STALE_AFTER_SECONDS = 120;

let heartbeatTimer = null;
let supabaseClient = null;

function getStoredDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

function getStoredSessionId() {
  return localStorage.getItem(SESSION_ID_KEY);
}

function setStoredSessionId(sessionId) {
  localStorage.setItem(SESSION_ID_KEY, sessionId);
}

function clearLocalLogin() {
  localStorage.removeItem("logado");
  localStorage.removeItem(SESSION_ID_KEY);
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!window.supabase) {
    throw new Error("Biblioteca do Supabase nao carregada.");
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("Configure a SUPABASE_ANON_KEY em assets/js/auth.js.");
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function loginWithEmailPassword(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error("Email ou senha invalidos.");
  }

  const sessionId = data.session?.access_token;

  if (!sessionId) {
    throw new Error("Nao foi possivel criar a sessao.");
  }

  const { data: claimed, error: claimError } = await client.rpc(
    "claim_single_device_session",
    {
      p_device_id: getStoredDeviceId(),
      p_session_id: sessionId,
      p_stale_after_seconds: STALE_AFTER_SECONDS,
    }
  );

  if (claimError) {
    await client.auth.signOut();
    throw new Error("Nao foi possivel validar o dispositivo.");
  }

  if (!claimed) {
    await client.auth.signOut();
    throw new Error("Esta conta ja esta conectada em outro dispositivo.");
  }

  setStoredSessionId(sessionId);
  localStorage.setItem("logado", "true");
  startSessionHeartbeat();
}

async function logout() {
  const client = getSupabaseClient();
  const user = await client.auth.getUser();
  const sessionId = getStoredSessionId();

  if (user.data.user && sessionId) {
    await client.rpc("release_single_device_session", {
      p_device_id: getStoredDeviceId(),
      p_session_id: sessionId,
    });

    await client
      .from("active_sessions")
      .delete()
      .eq("user_id", user.data.user.id)
      .eq("device_id", getStoredDeviceId())
      .eq("session_id", sessionId);

    await client
      .from("usuarios")
      .update({
        token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.data.user.id);
  }

  clearInterval(heartbeatTimer);
  clearLocalLogin();
  await client.auth.signOut();
  window.location.href = "./index.html";
}

async function checkProtectedSession() {
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession();

  if (!data.session || localStorage.getItem("logado") !== "true") {
    clearLocalLogin();
    window.location.href = "./index.html";
    return false;
  }

  startSessionHeartbeat();
  return true;
}

function startSessionHeartbeat() {
  const client = getSupabaseClient();

  clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    const sessionId = getStoredSessionId();

    if (!sessionId) {
      return;
    }

    const { data: valid } = await client.rpc("touch_single_device_session", {
      p_device_id: getStoredDeviceId(),
      p_session_id: sessionId,
    });

    if (valid === false) {
      clearLocalLogin();
      await client.auth.signOut();
      window.location.href = "./index.html";
    }
  }, HEARTBEAT_MS);
}

window.CNHAuth = {
  checkProtectedSession,
  loginWithEmailPassword,
  logout,
};
