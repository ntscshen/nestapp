import {
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
} from 'class-validator';

type ModelType = 1 | 2 | 3 | 4 | 5;

@ValidatorConstraint({ name: 'isPassword', async: false })
export class IsPasswordConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        console.log('args :>> ', args);
        const validateModel: ModelType = args.constraints[0] ?? 1;
        switch (validateModel) {
            case 1:
                // 必须由大写或小写字母组成(默认模式)
                return /\d/.test(value) && /[a-zA-Z]/.test(value);
            case 2:
                // 必须由小写字母组成
                return /\d/.test(value) && /[a-z]/.test(value);
            case 3:
                // 必须由大写字母组成
                return /\d/.test(value) && /[A-Z]/.test(value);
            case 4:
                // 必须包含数字，小写字母，大写字母
                return /\d/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value);
            case 5:
                // 必须包含数字，小写字母，大写字母，特殊符号
                return (
                    /\d/.test(value) &&
                    /[a-z]/.test(value) &&
                    /[A-Z]/.test(value) &&
                    /[!@#$%^&]/.test(value)
                );
            default:
                return /\d/.test(value) && /[a-zA-Z]/.test(value);
        }
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        const [model] = validationArguments.constraints;
        switch (model) {
            case 1:
                return '密码必须由大写或小写字母组成';
            case 2:
                return '密码必须由小写字母组成';
            case 3:
                return '密码必须由大写字母组成';
            case 4:
                return '密码必须包含数字，小写字母，大写字母';
            case 5:
                return '密码必须包含数字，小写字母，大写字母，特殊符号';
            default:
                return '密码必须由大写或小写字母组成';
        }
    }
}

/**
 * 密码复杂度验证
 * 1. 必须由大写或小写字母组成(默认模式)
 * 2. 必须由小写字母组成
 * 3. 必须由大写字母组成
 * 4. 必须包含数字，小写字母，大写字母
 * 5. 必须包含数字，小写字母，大写字母，特殊符号
 * */
export function IsPassword(model?: ModelType, validationOptions?: ValidationOptions) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [model],
            validator: IsPasswordConstraint,
        });
    };
}
