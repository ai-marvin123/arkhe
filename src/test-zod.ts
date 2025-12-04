import * as z from 'zod';

// 1 - Create the schema - mold shape

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['FILE', 'FOLDER']),
  level: z.number(),
  path: z.string(),
  parentId: z.string().optional(),
});

// 2 - Parse the data under the schema

async function test() {
  const parse = NodeSchema.safeParse({
    id: 'Button',
    label: 'Button.tsx',
    type: 'FILE',
    level: 3,
    path: '/src/components/Button.tsx',
    parentId: 'components',
    abc: 'testfsdf dsfsdfds',
    sdfsdfsdkfjldsjlk: 'dsfdsd',
  });

  if (parse.success) {
    console.log(parse);
  } else {
    const formattedErrors = parse.error.format();

    if (formattedErrors.type) {
      console.log('Type Error:', formattedErrors.type._errors);
    }
    if (formattedErrors._errors.length > 0) {
      console.log('General/Strict Error:', formattedErrors._errors);
    }
  }
}

// 3 - Create a TypeScript interface automatically

export type NodeSchema = z.infer<typeof NodeSchema>;

test();
