type AnyFunc = (...args: any[]) => any;

type Curry<Func extends AnyFunc> = Parameters<Func> extends [
  infer FirstArg,
  ...infer Rest
]
  ? (
      arg: FirstArg
    ) =>
      | Curry<(...args: Rest) => ReturnType<Func>>
      | ((...args: Rest) => ReturnType<Func>)
  : ReturnType<Func>;

export function curry<Func extends AnyFunc, Args extends unknown[]>(
  func: Func,
  args?: Args
): Curry<Func> {
  const aggregatedArgs = args ?? [];
  if (func.length === aggregatedArgs.length) return func(...aggregatedArgs);
  return ((arg: any) => curry(func, [...aggregatedArgs, arg])) as any;
}
