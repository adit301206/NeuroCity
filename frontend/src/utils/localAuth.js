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

export function changePasswordLocal({ email, currentPassword, newPassword }) {
  const users = getRegisteredUsers();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const index = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    return { success: false, message: 'User account not found' };
  }

  if (users[index].password && users[index].password !== currentPassword) {
    return { success: false, message: 'Incorrect current password' };
  }

  users[index].password = newPassword;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to update password in localStorage:', e);
  }

  return { success: true, message: 'Password updated successfully!' };
}

export function resetPasswordLocal({ email, newPassword }) {
  const users = getRegisteredUsers();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const index = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    return { success: false, message: 'No account found with this email address.' };
  }

  users[index].password = newPassword;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to update password in localStorage:', e);
  }

  return { success: true, message: 'Password updated successfully!' };
}

export function deleteAccountLocal({ email, password }) {
  const users = getRegisteredUsers();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const index = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    return { success: false, message: 'User account not found' };
  }

  if (users[index].password && users[index].password !== password) {
    return { success: false, message: 'Incorrect password. Account deletion cancelled.' };
  }

  users.splice(index, 1);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to delete user from localStorage:', e);
  }

  return { success: true, message: 'Account deleted successfully' };
}

export function updateProfileLocal({ currentEmail, name, email }) {
  const users = getRegisteredUsers();
  const normalizedCurrent = (currentEmail || '').toLowerCase().trim();
  const index = users.findIndex(u => u.email.toLowerCase() === normalizedCurrent);

  if (index === -1) {
    return { success: false, message: 'User profile record not found' };
  }

  if (name) users[index].name = name.trim();
  if (email) users[index].email = email.toLowerCase().trim();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to update user profile in localStorage:', e);
  }

  return {
    success: true,
    message: 'Profile details updated successfully',
    user: {
      id: users[index].id,
      name: users[index].name,
      email: users[index].email,
      role: users[index].role
    }
  };
}

export function googleAuthLocal({ name, email }) {
  const users = getRegisteredUsers();
  const normalizedEmail = (email || '').toLowerCase().trim();
  let found = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    found = {
      id: 'usr_g' + Math.random().toString(36).substr(2, 9),
      name: name || normalizedEmail.split('@')[0] || 'Google Citizen',
      email: normalizedEmail,
      password: 'goog_' + Math.random().toString(36).substr(2, 9),
      role: 'citizen'
    };
    users.push(found);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save Google user in localStorage:', e);
    }
  }

  return {
    success: true,
    user: {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role
    },
    token: 'google_jwt_token_' + Date.now()
  };
}

