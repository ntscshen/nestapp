// 手机号验证规则，必须是(区域号.手机号)的形式
// @param locales 区域选项
// @param options isMobilePhone 约束选项

import {
    ValidationArguments,
    ValidationOptions,
    isMobilePhone,
    registerDecorator,
} from 'class-validator';
import { IsMobilePhoneOptions, MobilePhoneLocale } from 'validator';

export function isMatchPhone(
    value: any,
    locales?: MobilePhoneLocale,
    options?: IsMobilePhoneOptions,
) {
    if (!value) return false;
    const phoneArr: string[] = value.split('.');
    if (phoneArr.length !== 2) return false;
    return isMobilePhone(phoneArr.join(''), locales, options);
}

// @param validationOptions class-validator库的选项
export function IsMatchPhone(
    locales?: MobilePhoneLocale | MobilePhoneLocale[],
    options?: IsMobilePhoneOptions,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [locales || 'any', options],
            validator: {
                validate: (value: any, args: ValidationArguments): boolean => {
                    return isMatchPhone(value, args.constraints[0], args.constraints[1]);
                },
                defaultMessage: (_args: ValidationArguments) => {
                    return '$property must be a phone number,eg: +86.12345678901';
                },
            },
        });
    };
}
