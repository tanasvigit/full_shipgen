import { useImperativeHandle } from "react";

/** Attach react-hook-form submit/getValues to parent ref. */
export function useFormHandle(ref, methods) {
  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise((resolve, reject) => {
        methods.handleSubmit(
          (data) => resolve(data),
          (errors) => reject(errors),
        )();
      }),
    getValues: methods.getValues,
    setError: methods.setError,
    isDirty: () => Boolean(methods.formState?.isDirty),
    reset: methods.reset,
  }));
}
