export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Alamat email wajib diisi';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Format email tidak valid';
  }
  return null;
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return 'Kata sandi wajib diisi';
  }
  if (password.length < minLength) {
    return `Kata sandi minimal ${minLength} karakter`;
  }
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return 'Nama lengkap wajib diisi';
  }
  if (name.trim().length < 2) {
    return 'Nama terlalu pendek';
  }
  return null;
};
