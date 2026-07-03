import { useImperativeHandle } from "react";

/** Attach react-hook-form submit/getValues to parent ref. */
export function useFormHandle(ref, methods, extraValues) {
  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise((resolve, reject) => {
        methods.handleSubmit(
          (data) => {
            if (typeof extraValues === "function") {
              const extra = extraValues(data);
              resolve(
                extra && typeof extra === "object" && !Array.isArray(extra)
                  ? { ...data, ...extra }
                  : data,
              );
              return;
            }
            if (extraValues && typeof extraValues === "object") {
              resolve({ ...data, ...extraValues });
              return;
            }
            resolve(data);
          },
          (errors) => reject(errors),
        )();
      }),
    getValues: methods.getValues,
    setError: methods.setError,
    isDirty: () => Boolean(methods.formState?.isDirty),
    reset: methods.reset,
  }));
}
