import { ErrorRequestHandler } from 'express';

export const customErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
    });
};
