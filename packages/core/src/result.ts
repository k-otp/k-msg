export type Ok<T> = {
  readonly isSuccess: true;
  readonly isFailure: false;
  readonly value: T;
};

export type Fail<E> = {
  readonly isSuccess: false;
  readonly isFailure: true;
  readonly error: E;
};

export type Result<T, E = Error> = Ok<T> | Fail<E>;

export const ok = <T>(value: T): Ok<T> => ({
  isSuccess: true,
  isFailure: false,
  value,
});

export const fail = <E>(error: E): Fail<E> => ({
  isSuccess: false,
  isFailure: true,
  error,
});
