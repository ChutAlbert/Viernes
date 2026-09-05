import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CLAVE = 'viernes_biometria';

// No guardamos la contraseña en ningún lado. La sesión ya vive en el
// dispositivo; la huella solo decide si se abre o no.

export async function disponible() {
  try {
    const hay = await LocalAuthentication.hasHardwareAsync();
    if (!hay) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function activada() {
  try {
    return (await SecureStore.getItemAsync(CLAVE)) === '1';
  } catch {
    return false;
  }
}

export async function activar() {
  try {
    await SecureStore.setItemAsync(CLAVE, '1');
    return true;
  } catch {
    return false;
  }
}

export async function desactivar() {
  try {
    await SecureStore.deleteItemAsync(CLAVE);
  } catch {
    // si no se puede borrar, que no truene la app
  }
}

/** Pide la huella. Devuelve true solo si el sistema la valida. */
export async function pedir(motivo = 'Desbloquea Viernes') {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo,
      cancelLabel: 'Usar contraseña',
      disableDeviceFallback: false,
    });
    return r.success === true;
  } catch {
    return false;
  }
}
