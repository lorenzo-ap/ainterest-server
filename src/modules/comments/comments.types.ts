import type { CreateCommentBody, IdParam } from '../../types';

export interface CreateCommentRoute extends IdParam {
	Body: CreateCommentBody;
}
