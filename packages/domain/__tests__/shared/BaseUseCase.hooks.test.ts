import type {
    Adapters,
    HookContext,
    OperationContext,
    ToolkitOptions,
    UseCaseHooks
} from '@multitenantkit/domain-contracts';
import { AbortedError, BusinessRuleError, ValidationError } from '@multitenantkit/domain-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Result } from '../../src/shared/result/Result';
import { BaseUseCase } from '../../src/shared/use-case/BaseUseCase';
import { createTestSetup } from '../test-helpers/TestUtils';

/**
 * Test use case implementation for testing hooks
 */
class TestUseCase extends BaseUseCase<
    { value: string },
    { result: string },
    ValidationError | BusinessRuleError
> {
    constructor(adapters: Adapters, toolkitOptions?: ToolkitOptions) {
        super(
            'test-testUseCase',
            adapters,
            toolkitOptions,
            z.object({ value: z.string() }),
            z.object({ result: z.string() }),
            'Test use case failed'
        );
    }

    protected async executeBusinessLogic(
        input: { value: string },
        _context: OperationContext
    ): Promise<Result<{ result: string }, ValidationError | BusinessRuleError>> {
        if (input.value === 'FAIL') {
            return Result.fail(new BusinessRuleError('Business logic failed'));
        }
        return Result.ok({ result: input.value.toUpperCase() });
    }
}

describe('BaseUseCase - Hooks System', () => {
    let setup: ReturnType<typeof createTestSetup>;
    let adapters: Adapters;
    let context: OperationContext;

    beforeEach(() => {
        setup = createTestSetup();
        adapters = {
            persistence: {
                uow: setup.uow as any,
                userRepository: setup.userRepo as any,
                organizationRepository: setup.uow.getOrganizationRepository() as any,
                organizationMembershipRepository:
                    setup.uow.getOrganizationMembershipRepository() as any
            },
            system: {
                clock: setup.clock,
                uuid: setup.uuid
            }
        };
        context = {
            requestId: 'test-request-id',
            externalId: '00000000-0000-4000-8000-000000000000'
        };
    });

    describe('Hook Execution Order', () => {
        it('should execute all hooks in correct order on success', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: ({ shared }) => {
                    executionOrder.push('onStart');
                    shared.startTime = Date.now();
                },
                afterValidation: () => {
                    executionOrder.push('afterValidation');
                },
                beforeExecution: () => {
                    executionOrder.push('beforeExecution');
                },
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);
            expect(executionOrder).toEqual([
                'onStart',
                'afterValidation',
                'beforeExecution',
                'onSuccess',
                'onFinally'
            ]);
        });

        it('should execute onError and onFinally on failure', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: () => {
                    executionOrder.push('onStart');
                },
                afterValidation: () => {
                    executionOrder.push('afterValidation');
                },
                beforeExecution: () => {
                    executionOrder.push('beforeExecution');
                },
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onError: () => {
                    executionOrder.push('onError');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'FAIL' }, context);

            expect(result.isFailure).toBe(true);
            expect(executionOrder).toEqual([
                'onStart',
                'afterValidation',
                'beforeExecution',
                'onError',
                'onFinally'
            ]);
        });

        it('should not execute onSuccess when business logic fails', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onError: () => {
                    executionOrder.push('onError');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'FAIL' }, context);

            expect(executionOrder).toEqual(['onError']);
        });
    });

    describe('Hook Context Sharing', () => {
        it('should share data between hooks via shared', async () => {
            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: ({ shared }) => {
                    shared.startTime = 1000;
                    shared.userId = 'user-123';
                },
                afterValidation: ({ shared }) => {
                    expect(shared.startTime).toBe(1000);
                    expect(shared.userId).toBe('user-123');
                    shared.validated = true;
                },
                onSuccess: ({ shared }) => {
                    expect(shared.startTime).toBe(1000);
                    expect(shared.userId).toBe('user-123');
                    expect(shared.validated).toBe(true);
                },
                onFinally: ({ shared }) => {
                    expect(shared.startTime).toBe(1000);
                    expect(shared.userId).toBe('user-123');
                    expect(shared.validated).toBe(true);
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);
        });

        it('should provide execution context with executionId and useCaseName', async () => {
            let capturedContext: HookContext<any, any, any> | null = null;

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: (ctx) => {
                    capturedContext = ctx;
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'test' }, context);

            expect(capturedContext).not.toBeNull();
            expect(capturedContext?.executionId).toBeDefined();
            expect(typeof capturedContext?.executionId).toBe('string');
            expect(capturedContext?.useCaseName).toBe('test-testUseCase');
            expect(capturedContext?.shared).toEqual({});
            expect(capturedContext?.stepResults).toBeDefined();
        });

        it('should provide stepResults with validatedInput and output', async () => {
            let validationStepResults: any = null;
            let successStepResults: any = null;

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                afterValidation: ({ stepResults }) => {
                    validationStepResults = { ...stepResults };
                },
                onSuccess: ({ stepResults }) => {
                    successStepResults = { ...stepResults };
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'hello' }, context);

            expect(validationStepResults.validatedInput).toEqual({ value: 'hello' });
            expect(successStepResults.validatedInput).toEqual({ value: 'hello' });
            expect(successStepResults.output).toEqual({ result: 'HELLO' });
            expect(successStepResults.authorized).toBe(true);
        });
    });

    describe('Hook Parameters', () => {
        it('should provide correct parameters to each hook', async () => {
            const hookParams: Record<string, any> = {};

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: (ctx) => {
                    hookParams.onStart = {
                        input: ctx.input,
                        context: ctx.context,
                        hasAdapters: !!ctx.adapters,
                        hasAbort: typeof ctx.abort === 'function'
                    };
                },
                afterValidation: (ctx) => {
                    hookParams.afterValidation = {
                        input: ctx.input,
                        validatedInput: ctx.stepResults.validatedInput,
                        context: ctx.context
                    };
                },
                onSuccess: (ctx) => {
                    hookParams.onSuccess = {
                        input: ctx.input,
                        output: ctx.stepResults.output,
                        context: ctx.context
                    };
                },
                onFinally: (ctx) => {
                    hookParams.onFinally = {
                        input: ctx.input,
                        hasResult: !!ctx.result,
                        context: ctx.context
                    };
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);

            // onStart should have input and context
            expect(hookParams.onStart.input).toEqual({ value: 'test' });
            expect(hookParams.onStart.context).toBe(context);
            expect(hookParams.onStart.hasAdapters).toBe(true);
            expect(hookParams.onStart.hasAbort).toBe(true);

            // afterValidation should have input, validatedInput and context
            expect(hookParams.afterValidation.input).toEqual({ value: 'test' });
            expect(hookParams.afterValidation.validatedInput).toEqual({ value: 'test' });
            expect(hookParams.afterValidation.context).toBe(context);

            // onSuccess should have input, output and context
            expect(hookParams.onSuccess.input).toEqual({ value: 'test' });
            expect(hookParams.onSuccess.output).toEqual({ result: 'TEST' });
            expect(hookParams.onSuccess.context).toBe(context);

            // onFinally should have input, result and context
            expect(hookParams.onFinally.input).toEqual({ value: 'test' });
            expect(hookParams.onFinally.hasResult).toBe(true);
            expect(hookParams.onFinally.context).toBe(context);
        });

        it('should provide error to onError hook', async () => {
            let capturedError: any = null;

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onError: ({ error }) => {
                    capturedError = error;
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'FAIL' }, context);

            expect(capturedError).toBeInstanceOf(BusinessRuleError);
            expect(capturedError.message).toBe('Business logic failed');
        });
    });

    describe('Hook Abortion', () => {
        it('should abort execution when onStart throws error', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: () => {
                    executionOrder.push('onStart');
                    throw new Error('Rate limit exceeded');
                },
                afterValidation: () => {
                    executionOrder.push('afterValidation');
                },
                beforeExecution: () => {
                    executionOrder.push('beforeExecution');
                },
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onError: () => {
                    executionOrder.push('onError');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isFailure).toBe(true);
            expect(executionOrder).toEqual(['onStart', 'onError', 'onFinally']);
        });

        it('should abort execution when afterValidation throws error', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: () => {
                    executionOrder.push('onStart');
                },
                afterValidation: () => {
                    executionOrder.push('afterValidation');
                    throw new Error('Custom validation failed');
                },
                beforeExecution: () => {
                    executionOrder.push('beforeExecution');
                },
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onError: () => {
                    executionOrder.push('onError');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isFailure).toBe(true);
            expect(executionOrder).toEqual(['onStart', 'afterValidation', 'onError', 'onFinally']);
        });

        it('should continue when onSuccess throws error (side effect)', async () => {
            const executionOrder: string[] = [];
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                    throw new Error('Email service failed');
                },
                onError: () => {
                    executionOrder.push('onError');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            // NEW BEHAVIOR: onSuccess errors don't fail the operation
            expect(result.isSuccess).toBe(true);
            expect(executionOrder).toEqual(['onSuccess', 'onError', 'onFinally']);

            consoleErrorSpy.mockRestore();
        });

        it('should abort gracefully when abort() is called', async () => {
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: () => {
                    executionOrder.push('onStart');
                },
                afterValidation: ({ abort }) => {
                    executionOrder.push('afterValidation');
                    abort('Rate limit exceeded');
                },
                beforeExecution: () => {
                    executionOrder.push('beforeExecution');
                },
                onSuccess: () => {
                    executionOrder.push('onSuccess');
                },
                onError: () => {
                    executionOrder.push('onError');
                },
                onAbort: () => {
                    executionOrder.push('onAbort');
                },
                onFinally: () => {
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isFailure).toBe(true);
            expect(result.getError()).toBeInstanceOf(AbortedError);
            expect((result.getError() as AbortedError).reason).toBe('Rate limit exceeded');
            expect(executionOrder).toEqual(['onStart', 'afterValidation', 'onAbort', 'onFinally']);
        });

        it('should provide abort reason to onAbort hook', async () => {
            let capturedReason: string = '';

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                afterValidation: ({ abort }) => {
                    abort('Custom abort reason');
                },
                onAbort: ({ reason }) => {
                    capturedReason = reason;
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isFailure).toBe(true);
            expect(capturedReason).toBe('Custom abort reason');
        });
    });

    describe('onFinally Hook Special Behavior', () => {
        it('should always execute onFinally even on error', async () => {
            let finallyExecuted = false;

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: () => {
                    throw new Error('Initial error');
                },
                onFinally: () => {
                    finallyExecuted = true;
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'test' }, context);

            expect(finallyExecuted).toBe(true);
        });

        it('should not affect result if onFinally throws error', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onFinally: () => {
                    throw new Error('Finally failed');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            // Result should still be success
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({ result: 'TEST' });

            // Error should be logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in onFinally hook for test-testUseCase'),
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should provide result in onFinally regardless of success or failure', async () => {
            let successResult: any = null;
            let failureResult: any = null;

            const hooksSuccess: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onFinally: ({ result }) => {
                    successResult = result;
                }
            };

            const hooksFailure: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onFinally: ({ result }) => {
                    failureResult = result;
                }
            };

            // Test success case
            const configSuccess: ToolkitOptions = {
                useCaseHooks: { TestUseCase: hooksSuccess } as any
            };
            const useCaseSuccess = new TestUseCase(adapters, configSuccess);
            await useCaseSuccess.execute({ value: 'test' }, context);

            expect(successResult.isSuccess).toBe(true);
            expect(successResult.getValue()).toEqual({ result: 'TEST' });

            // Test failure case
            const configFailure: ToolkitOptions = {
                useCaseHooks: { TestUseCase: hooksFailure } as any
            };
            const useCaseFailure = new TestUseCase(adapters, configFailure);
            await useCaseFailure.execute({ value: 'FAIL' }, context);

            expect(failureResult.isFailure).toBe(true);
            expect(failureResult.getError()).toBeInstanceOf(BusinessRuleError);
        });
    });

    describe('No Hooks Configured', () => {
        it('should work normally when no hooks are configured', async () => {
            const useCase = new TestUseCase(adapters);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({ result: 'TEST' });
        });

        it('should work normally when toolkitOptions exists but no hooks for this use case', async () => {
            const config: ToolkitOptions = {
                useCaseHooks: {
                    // Different use case configured
                    SomeOtherUseCase: {
                        onStart: () => {}
                    }
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toEqual({ result: 'TEST' });
        });
    });

    describe('Async Hooks', () => {
        it('should support async hooks', async () => {
            const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
            const executionOrder: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: async ({ shared }) => {
                    await delay(10);
                    executionOrder.push('onStart');
                    shared.asyncStart = true;
                },
                afterValidation: async ({ shared }) => {
                    await delay(10);
                    executionOrder.push('afterValidation');
                    expect(shared.asyncStart).toBe(true);
                },
                onSuccess: async () => {
                    await delay(10);
                    executionOrder.push('onSuccess');
                },
                onFinally: async () => {
                    await delay(10);
                    executionOrder.push('onFinally');
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            const result = await useCase.execute({ value: 'test' }, context);

            expect(result.isSuccess).toBe(true);
            expect(executionOrder).toEqual([
                'onStart',
                'afterValidation',
                'onSuccess',
                'onFinally'
            ]);
        });
    });

    describe('Real-World Use Cases', () => {
        it('should support logging and metrics collection', async () => {
            const logs: string[] = [];
            const metrics: any[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: ({ input, executionId, useCaseName, shared }) => {
                    logs.push(`[${executionId}] Starting ${useCaseName}`);
                    logs.push(`[${executionId}] Input: ${JSON.stringify(input)}`);
                    shared.startTime = Date.now();
                },
                onFinally: ({ result, executionId, useCaseName, shared }) => {
                    const duration = Date.now() - shared.startTime;
                    logs.push(`[${executionId}] Completed in ${duration}ms`);

                    metrics.push({
                        useCase: useCaseName,
                        duration,
                        success: result.isSuccess,
                        executionId
                    });
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'test' }, context);

            expect(logs.length).toBe(3);
            expect(logs[0]).toContain('Starting test-testUseCase');
            expect(logs[1]).toContain('Input:');
            expect(logs[2]).toContain('Completed in');

            expect(metrics.length).toBe(1);
            expect(metrics[0].useCase).toBe('test-testUseCase');
            expect(metrics[0].success).toBe(true);
            expect(typeof metrics[0].duration).toBe('number');
        });

        it('should support custom validation after input validation', async () => {
            const blockedValues = ['spam', 'forbidden', 'blocked'];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                afterValidation: ({ stepResults }) => {
                    const validated = stepResults.validatedInput;
                    if (validated && blockedValues.includes(validated.value.toLowerCase())) {
                        throw new ValidationError(`Value "${validated.value}" is not allowed`);
                    }
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);

            // Should fail for blocked value
            const result1 = await useCase.execute({ value: 'spam' }, context);
            expect(result1.isFailure).toBe(true);

            // Should succeed for allowed value
            const result2 = await useCase.execute({ value: 'allowed' }, context);
            expect(result2.isSuccess).toBe(true);
        });

        it('should support side effects that should not abort on failure', async () => {
            const sentEmails: string[] = [];
            const emailErrors: string[] = [];

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onSuccess: async ({ stepResults }) => {
                    const output = stepResults.output;
                    // Side effect - send email (wrapped in try/catch to not abort)
                    try {
                        if (output?.result === 'FAIL-EMAIL') {
                            throw new Error('Email service unavailable');
                        }
                        sentEmails.push(`Email sent for: ${output?.result}`);
                    } catch (error: any) {
                        emailErrors.push(error.message);
                        // Caught - execution continues
                    }
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);

            // Email succeeds
            const result1 = await useCase.execute({ value: 'success' }, context);
            expect(result1.isSuccess).toBe(true);
            expect(sentEmails).toContain('Email sent for: SUCCESS');

            // Email fails but use case succeeds
            const result2 = await useCase.execute({ value: 'fail-email' }, context);
            expect(result2.isSuccess).toBe(true);
            expect(emailErrors).toContain('Email service unavailable');
        });

        it('should support adapter access in hooks', async () => {
            let hasAdapters = false;
            let hasPersistence = false;
            let hasSystem = false;

            const hooks: UseCaseHooks<{ value: string }, { result: string }, any> = {
                onStart: ({ adapters }) => {
                    hasAdapters = !!adapters;
                    hasPersistence = !!adapters.persistence;
                    hasSystem = !!adapters.system;
                }
            };

            const config: ToolkitOptions = {
                useCaseHooks: {
                    TestUseCase: hooks
                } as any
            };

            const useCase = new TestUseCase(adapters, config);
            await useCase.execute({ value: 'test' }, context);

            expect(hasAdapters).toBe(true);
            expect(hasPersistence).toBe(true);
            expect(hasSystem).toBe(true);
        });
    });
});
