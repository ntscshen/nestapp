import { Injectable } from '@nestjs/common';
import {
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
} from 'class-validator';
import { isNil, merge } from 'lodash';
import { DataSource, ObjectType } from 'typeorm';

type Condition = {
    entity: ObjectType<any>;
    // 如果没有指定字段则使用当前验证的属性作为查询依据
    property?: string;
};

// 验证某个字段的唯一性（确保一个指定字段的值在数据库中是唯一的）
@ValidatorConstraint({ name: 'dataUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
    constructor(private dataSource: DataSource) {}

    async validate(value: any, args: ValidationArguments) {
        // 获取要验证的模型和字段
        const config: Omit<Condition, 'entity'> = {
            property: args.property,
        };
        const condition = ('entity' in args.constraints[0]
            ? merge(config, args.constraints[0])
            : {
                  entity: args.constraints[0],
                  property: args.constraints[0],
              }) as unknown as Required<Condition>;
        if (!condition.entity) return false;
        try {
            const repo = this.dataSource.getRepository(condition.entity);
            const item = await repo.findOne({
                where: { [condition.property]: value },
                withDeleted: true,
            });
            return isNil(item);
        } catch (err) {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        const { entity, property } = args.constraints[0];
        const queryProperty = property ?? args.property;
        if (!(args.object as any).getManager) {
            return 'message function not been found!';
        }
        if (!entity) {
            return 'Model not been specified!';
        }
        return `${queryProperty} of ${entity.name} must been unique!`;
    }
}

/**
 * 数据唯一性验证
 * @param params Entity类或验证条件对象
 * @param validationOptions
 */
export function IsUnique(
    params: ObjectType<any> | Condition,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [params],
            validator: UniqueConstraint,
        });
    };
}
