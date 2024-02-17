import { z } from "zod";

export const CreateUserInput = z.object({
	name: z.string().min(3),
	password: z.string().min(8),
	email: z.string().email(),
});
export type CreateUserInputType = z.infer<typeof CreateUserInput>;

export const LoginUserInput = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type LoginUserInputType = z.infer<typeof LoginUserInput>;

type HTTPStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;
export type FunctionResult<T> = {
	data: T | null;
	error: string | null;
	status: HTTPStatus;
};
