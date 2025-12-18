export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function masterLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  return login(username, password);
}

export function logout() {
  window.location.href = '/api/logout';
}
