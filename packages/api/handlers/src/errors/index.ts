export { ErrorMapper, HttpErrorResponse } from './ErrorMapper';
import { ErrorMapper } from './ErrorMapper';

// Convenience export for handlers
export const mapDomainErrorToHttp = (error: any, requestId: string) => {
    const result = ErrorMapper.toHttpError(error, requestId);
    return result;
};
