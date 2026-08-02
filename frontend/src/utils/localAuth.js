// localAuth.js - Local User Persistence & Offline Authentication Validation

const PRESEEDED_USERS = [
  { id: 'usr_c1', name: 'Citizen Observer', email: 'citizen@neurocity.gov', password: 'password123', role: 'citizen' },
  { id: 'usr_op1', name: 'Traffic Operator', email: 'operator@neurocity.gov', password: 'password123', role: 'operator' },
  { id: 'usr_ad1', name: 'System Root Admin', email: 'admin@neurocity.gov', password: 'password123', role: 'admin' }
];

const STORAGE_KEY = 'neurocity_registered_users';

export function getRegisteredUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRESEEDED_USERS));
      return PRESEEDED_USERS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PRESEEDED_USERS;
  } catch (e) {
    console.warn('Failed to load registered users from localStorage:', e);
    return PRESEEDED_USERS;
  }
}

export function registerLocalUser({ name, email, password, role }) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      success: false,
      message: 'This email is already registered. Please sign in instead.'
    };
  }

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    name: name || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: password,
    role: role || 'citizen'
  };

  const updatedUsers = [...users, newUser];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
  } catch (e) {
    console.warn('Failed to save user to localStorage:', e);
  }

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    },
    token: 'demo_jwt_token_' + Date.now()
  };
}

export function loginLocalUser({ email, password }) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!foundUser) {
    return {
      success: false,
      message: 'Account not registered with this email. Please click [ CREATE ACCOUNT ] to register first.'
    };
  }

  if (foundUser.password && foundUser.password !== password) {
    return {
      success: false,
      message: 'Incorrect password. Please verify your password.'
    };
  }

  return {
    success: true,
    user: {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role
    },
    token: 'demo_jwt_token_' + Date.now()
  };
}
