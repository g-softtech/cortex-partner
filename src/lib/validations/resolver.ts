import { z } from "zod";

export const zodResolver = (schema: z.AnyZodObject) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: any) => {
    try {
      const parsedValues = await schema.parseAsync(values);
      return {
        values: parsedValues,
        errors: {},
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errors = error.errors.reduce((acc: any, curr) => {
          const path = curr.path.join(".");
          acc[path] = {
            type: curr.code,
            message: curr.message,
          };
          return acc;
        }, {});
        return {
          values: {},
          errors,
        };
      }
      throw error;
    }
  };
};
