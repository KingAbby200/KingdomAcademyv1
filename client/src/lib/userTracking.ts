import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEYS = {
  UUID: 'app_user_uuid',
  RECOVERY_CODE: 'app_recovery_code',
  DEVICE_ID: 'app_device_id',
};

interface DeviceInfo {
  platform: string;
  browser?: string;
  version: string;
}

// Generate a 6-digit recovery code
function generateRecoveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get browser/device information
function getDeviceInfo(): DeviceInfo {
  const platform = 
    typeof window !== 'undefined' && window.navigator 
      ? window.navigator.platform 
      : 'unknown';
  
  const userAgent = window.navigator.userAgent;
  const browser = 
    userAgent.includes('Chrome') ? 'Chrome' :
    userAgent.includes('Firefox') ? 'Firefox' :
    userAgent.includes('Safari') ? 'Safari' :
    userAgent.includes('Edge') ? 'Edge' :
    'unknown';

  return {
    platform,
    browser,
    version: userAgent,
  };
}

// Initialize user tracking
export async function initializeUserTracking() {
  // Check if UUID exists
  let uuid = localStorage.getItem(LOCAL_STORAGE_KEYS.UUID);
  let recoveryCode = localStorage.getItem(LOCAL_STORAGE_KEYS.RECOVERY_CODE);
  let deviceId = localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_ID);

  // Generate new identifiers if they don't exist
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem(LOCAL_STORAGE_KEYS.UUID, uuid);
  }

  if (!recoveryCode) {
    recoveryCode = generateRecoveryCode();
    localStorage.setItem(LOCAL_STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
  }

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(LOCAL_STORAGE_KEYS.DEVICE_ID, deviceId);
  }

  // Get device information
  const deviceInfo = getDeviceInfo();

  // Create or update user in the database
  try {
    const response = await fetch('/api/users/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid,
        recoveryCode,
        deviceId,
        deviceInfo,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize user');
    }

    return {
      uuid,
      recoveryCode,
      deviceId,
      deviceInfo,
    };
  } catch (error) {
    console.error('Error initializing user:', error);
    // Return local data even if server sync fails
    return {
      uuid,
      recoveryCode,
      deviceId,
      deviceInfo,
    };
  }
}

// Recover account using recovery code
export async function recoverAccount(recoveryCode: string) {
  try {
    const response = await fetch('/api/users/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recoveryCode,
        deviceId: localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_ID),
        deviceInfo: getDeviceInfo(),
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid recovery code');
    }

    const data = await response.json();
    
    // Update local storage with recovered data
    localStorage.setItem(LOCAL_STORAGE_KEYS.UUID, data.uuid);
    localStorage.setItem(LOCAL_STORAGE_KEYS.RECOVERY_CODE, recoveryCode);

    return data;
  } catch (error) {
    console.error('Error recovering account:', error);
    throw error;
  }
}

// Link payment ID to user
export async function linkPaymentId(paymentId: string, provider: string) {
  try {
    const response = await fetch('/api/users/link-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid: localStorage.getItem(LOCAL_STORAGE_KEYS.UUID),
        paymentId,
        provider,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to link payment ID');
    }

    return await response.json();
  } catch (error) {
    console.error('Error linking payment ID:', error);
    throw error;
  }
}

export function getStoredUUID(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.UUID);
}

export function getStoredRecoveryCode(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.RECOVERY_CODE);
}

export function getStoredDeviceId(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.DEVICE_ID);
}
