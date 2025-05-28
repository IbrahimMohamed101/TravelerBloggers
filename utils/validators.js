const validator = require('validator');

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validateEmail = (email) => {
    if (!email || !validator.isEmail(email)) {
        throw new Error('Invalid email address');
    }
    return true;
};

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validatePassword = (password) => {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new Error('Password must contain at least one special character');
    }

    return true;
};

/**
 * Validates that a string meets the username requirements
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validateUsername = (username) => {
    if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
    }

    if (username.length > 30) {
        throw new Error('Username cannot be longer than 30 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, underscores and hyphens');
    }

    return true;
};

/**
 * Validates that a string is not empty and meets minimum length requirements
 * @param {string} value - The string to validate
 * @param {number} minLength - Minimum required length
 * @param {string} fieldName - Name of the field being validated
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validateRequiredString = (value, minLength = 1, fieldName = 'Field') => {
    if (!value || typeof value !== 'string' || value.trim().length < minLength) {
        throw new Error(`${fieldName} must be at least ${minLength} characters long`);
    }
    return true;
};

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateRequiredString
};
