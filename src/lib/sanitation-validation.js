import { body, validationResult } from 'express-validator';
import xss from 'xss';

export function registrationValidationMiddleware(textField) {
    return [
        body(textField)
            .isLength({ max: 400 })
            .withMessage(
                `${textField === 'comment' ? 'Athugasemd' : 'Lýsing'
                } má að hámarki vera 400 stafir`
            ),
    ];
}

// Viljum keyra sér og með validation, ver gegn „self XSS“
export function xssSanitizationMiddleware(textField) {
    return [
        body(textField).customSanitizer((v) => xss(v)),
    ];
}

export function sanitizationMiddleware(textField) {
    return [body('name').trim().escape(), body(textField).trim().escape()];
}

export async function validationCheck(req, res, next) {

    const validation = validationResult(req);

    if (!validation.isEmpty()) {
        return res.status(400).send(validation.errors);
    }

    return next();
}

