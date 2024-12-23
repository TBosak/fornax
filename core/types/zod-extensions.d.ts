import { ZodOpenAPIMetadata } from '@asteasolutions/zod-to-openapi';
import { ZodType, ZodTypeDef } from 'zod';

// declare module 'zod' {
//   interface ZodTypeDef {
//     openapi?: ZodOpenAPIMetadata;
//   }

//   interface ZodType<T = any, Def extends ZodTypeDef = ZodTypeDef> {
//     openapi(metadata?: ZodOpenAPIMetadata): this;
//   }
// }