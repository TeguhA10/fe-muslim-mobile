export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (!password) {
    return { valid: false, message: 'Kata sandi wajib diisi' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Kata sandi minimal 8 karakter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung minimal 1 huruf besar (A-Z)' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung minimal 1 huruf kecil (a-z)' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung minimal 1 angka (0-9)' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung minimal 1 karakter simbol (!@#$%^&* dll)' };
  }
  return { valid: true, message: '' };
}
