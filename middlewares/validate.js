const Joi = require('joi');

// جزء مشترك بين التسجيل والدخول
const commonFields = {
    email: Joi.string().email().max(100).required(),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
        .optional(),
    google_token: Joi.string().optional(),
    facebook_token: Joi.string().optional(), // أضفنا الحقل ده

};

// مخطط تسجيل المستخدم
const registerSchema = Joi.object({
    first_name: Joi.string().max(50).required(),
    last_name: Joi.string().max(50).required(),
    username: Joi.string().alphanum().min(3).max(50).required(),
    ...commonFields,
    bio: Joi.string().max(500).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    social_media: Joi.object().optional(),
    interested_categories: Joi.array().items(Joi.string()).optional(),
    role: Joi.string().valid('super_admin', 'admin', 'content_manager', 'user').default('user').optional(),
}).xor('password', 'google_token', 'facebook_token'); // لازم واحد منهم فقط

// مخطط تسجيل الدخول
const loginSchema = Joi.object({
    ...commonFields,
}).xor('password', 'google_token', 'facebook_token'); // لازم واحد منهم فقط

// دالة التحقق العام
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

// تصدير الدوال
module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema),
};
