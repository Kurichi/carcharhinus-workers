type HTTPStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export type FunctionResult<T> = {
	data: T | null;
	error: string | null;
	status: HTTPStatus;
};
