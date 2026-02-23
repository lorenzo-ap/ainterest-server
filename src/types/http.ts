export type RouteWithBody<T> = {
	Body: T;
};

export type RouteWithParams<T> = {
	Params: T;
};

export type IdParam = RouteWithParams<{
	id: string;
}>;

export type UsernameParam = RouteWithParams<{
	username: string;
}>;
