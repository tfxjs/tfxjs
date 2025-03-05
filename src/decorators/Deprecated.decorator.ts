import { LoggerFactory } from "../utils/Logger";

export default function deprecated(message: string) {
    const depLogger = LoggerFactory.createLogger('DeprecatedDecorator');
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            depLogger.warn(`Warning: ${propertyKey} is deprecated. ${message}`);
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}