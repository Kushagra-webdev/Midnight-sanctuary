export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPassword = (password) => password && password.length >= 6;
export const isValidName = (name) => name && name.trim().length >= 2;
