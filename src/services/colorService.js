// Color service for managing user colors
const COLORS = [
  { name: 'Red', value: '#FF6B6B' },
  { name: 'Teal', value: '#4ECDC4' },
  { name: 'Orange', value: '#FF9F1C' },
  { name: 'Purple', value: '#6A0572' },
  { name: 'Green', value: '#1A936F' },
  { name: 'Blue', value: '#3D5A80' },
  { name: 'Coral', value: '#E76F51' },
  { name: 'Violet', value: '#8338EC' },
  { name: 'Mint', value: '#06D6A0' },
  { name: 'Sky Blue', value: '#118AB2' },
  { name: 'Magenta', value: '#7209B7' },
  { name: 'Yellow', value: '#FFD166' },
];

// In-memory cache for colors
const emailColorCache = {};

// Load colors from localStorage on initialization
try {
  const storedColors = localStorage.getItem('emailColors');
  if (storedColors) {
    Object.assign(emailColorCache, JSON.parse(storedColors));
  }
} catch (e) {
  console.error('Error loading colors from localStorage:', e);
}

/**
 * Generate a deterministic color for an email
 * @param {string} email - The email to generate a color for
 * @returns {string} - The color hex code
 */
function generateColorForEmail(email) {
  if (!email) return '#6366f1';
  
  const lowerEmail = email.toLowerCase();
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < lowerEmail.length; i++) {
    hash = ((hash << 5) - hash) + lowerEmail.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ensure positive index
  const colorIndex = Math.abs(hash) % COLORS.length;
  return COLORS[colorIndex].value;
}

/**
 * Get a color for an email, using cache if available
 * @param {string} email - The email to get a color for
 * @returns {string} - The color hex code
 */
function getColorForEmail(email) {
  if (!email) return '#6366f1';
  
  const lowerEmail = email.toLowerCase();
  
  // Check cache first
  if (emailColorCache[lowerEmail]) {
    return emailColorCache[lowerEmail];
  }
  
  // Generate and cache a new color
  const color = generateColorForEmail(lowerEmail);
  emailColorCache[lowerEmail] = color;
  
  // Save to localStorage
  try {
    localStorage.setItem('emailColors', JSON.stringify(emailColorCache));
  } catch (e) {
    console.error('Error saving colors to localStorage:', e);
  }
  
  return color;
}

/**
 * Set a specific color for an email
 * @param {string} email - The email to set a color for
 * @param {string} color - The color hex code
 */
function setColorForEmail(email, color) {
  if (!email) return;
  
  const lowerEmail = email.toLowerCase();
  emailColorCache[lowerEmail] = color;
  
  // Save to localStorage
  try {
    localStorage.setItem('emailColors', JSON.stringify(emailColorCache));
  } catch (e) {
    console.error('Error saving colors to localStorage:', e);
  }
}

/**
 * Get all available colors
 * @returns {Array} - Array of color objects with name and value
 */
function getAvailableColors() {
  return COLORS;
}

export default {
  getColorForEmail,
  setColorForEmail,
  getAvailableColors,
}; 