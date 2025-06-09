const { ZodError } = require('zod');

// Middleware untuk validasi menggunakan Zod
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validasi dan override req.body dengan hasil validasi
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  };
};

module.exports = validate;
