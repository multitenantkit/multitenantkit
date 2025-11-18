import {
    type FindMembersOptions,
    type OrganizationMembership,
    type OrganizationMembershipRepository,
    OrganizationMembershipRepositoryConfigHelper,
    type OrganizationMemberWithUserInfo,
    OrganizationRepositoryConfigHelper,
    type PaginatedResult,
    type ToolkitOptions,
    UserRepositoryConfigHelper
} from '@multitenantkit/domain-contracts';
import type { OperationContext } from '@multitenantkit/domain-contracts/shared';
import type postgres from 'postgres';
import { OrganizationMapper } from '../mappers/OrganizationMapper';
import { OrganizationMembershipMapper } from '../mappers/OrganizationMembershipMapper';
import { UserMapper } from '../mappers/UserMapper';

/**
 * PostgreSQL implementation of OrganizationMembershipRepository
 * Handles all organization membership-related database operations using direct SQL queries
 *
 * Generic support for custom fields:
 * @template TUserCustomFields - Custom fields added to User
 * @template TOrganizationCustomFields - Custom fields added to Organization
 * @template TOrganizationMembershipCustomFields - Custom fields added to OrganizationMembership
 *
 * Note: Custom fields are handled at the mapper level. This repository
 * returns OrganizationMembership which may include custom fields from the database.
 */
export class PostgresOrganizationMembershipRepository<
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TUserCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationCustomFields = {},
    // biome-ignore lint/complexity/noBannedTypes: ignore
    TOrganizationMembershipCustomFields = {}
> implements
        OrganizationMembershipRepository<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
{
    private readonly membershipConfigHelper: OrganizationMembershipRepositoryConfigHelper<TOrganizationMembershipCustomFields>;
    private readonly userConfigHelper: UserRepositoryConfigHelper<TUserCustomFields>;
    private readonly organizationConfigHelper: OrganizationRepositoryConfigHelper<TOrganizationCustomFields>;
    private readonly schemaName?: string;
    private readonly tableName: string;
    private readonly usersSchemaName?: string;
    private readonly usersTableName: string;
    private readonly organizationsSchemaName?: string;
    private readonly organizationsTableName: string;

    constructor(
        private readonly sql: postgres.Sql,
        toolkitOptions?: ToolkitOptions<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >
    ) {
        // Extract custom fields configs from toolkit options
        const membershipConfig = toolkitOptions?.organizationMemberships?.customFields;
        const userConfig = toolkitOptions?.users?.customFields;
        const organizationConfig = toolkitOptions?.organizations?.customFields;

        // Extract database configuration with defaults
        this.schemaName = toolkitOptions?.organizationMemberships?.database?.schema;
        this.tableName =
            toolkitOptions?.organizationMemberships?.database?.table || 'organization_memberships';

        this.usersSchemaName = toolkitOptions?.users?.database?.schema;
        this.usersTableName = toolkitOptions?.users?.database?.table || 'users';

        this.organizationsSchemaName = toolkitOptions?.organizations?.database?.schema;
        this.organizationsTableName =
            toolkitOptions?.organizations?.database?.table || 'organizations';

        // Extract naming strategies for all three entities
        const globalNamingStrategy = toolkitOptions?.namingStrategy;
        const userDatabaseNamingStrategy = toolkitOptions?.users?.database?.namingStrategy;
        const orgDatabaseNamingStrategy = toolkitOptions?.organizations?.database?.namingStrategy;
        const membershipDatabaseNamingStrategy =
            toolkitOptions?.organizationMemberships?.database?.namingStrategy;

        // Use helpers to handle configuration logic for all three entities
        this.membershipConfigHelper = new OrganizationMembershipRepositoryConfigHelper(
            membershipConfig,
            membershipDatabaseNamingStrategy,
            globalNamingStrategy
        );
        this.userConfigHelper = new UserRepositoryConfigHelper(
            userConfig,
            userDatabaseNamingStrategy,
            globalNamingStrategy
        );
        this.organizationConfigHelper = new OrganizationRepositoryConfigHelper(
            organizationConfig,
            orgDatabaseNamingStrategy,
            globalNamingStrategy
        );
    }

    /**
     * Build qualified table name with optional schema
     * @param tableName Base table name
     * @returns Fully qualified table name (e.g., 'schema.table' or 'table')
     */
    private getQualifiedTableName(tableName: string): string {
        return this.schemaName ? `${this.schemaName}.${tableName}` : tableName;
    }

    /**
     * Build qualified table name with optional schema
     * @param tableName Base table name
     * @returns Fully qualified table name (e.g., 'schema.table' or 'table')
     */
    private getQualifiedUsersTableName(tableName: string): string {
        return this.usersSchemaName ? `${this.usersSchemaName}.${tableName}` : tableName;
    }

    /**
     * Build qualified table name with optional schema
     * @param tableName Base table name
     * @returns Fully qualified table name (e.g., 'schema.table' or 'table')
     */
    private getQualifiedOrganizationsTableName(tableName: string): string {
        return this.organizationsSchemaName
            ? `${this.organizationsSchemaName}.${tableName}`
            : tableName;
    }

    /**
     * Save a organization membership (create or update)
     * @param membership The membership entity to save
     * @param context Optional operation context for audit logging
     */
    async insert(membership: OrganizationMembership, _context?: OperationContext): Promise<void> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);

            // Build columns object with mapped column names
            const columns: Record<string, any> = {
                [this.membershipConfigHelper.getColumnName('id')]: membership.id,
                [this.membershipConfigHelper.getColumnName('userId')]: membership.userId ?? null,
                [this.membershipConfigHelper.getColumnName('username')]: membership.username,
                [this.membershipConfigHelper.getColumnName('organizationId')]:
                    membership.organizationId,
                [this.membershipConfigHelper.getColumnName('roleCode')]: membership.roleCode,
                [this.membershipConfigHelper.getColumnName('invitedAt')]:
                    membership.invitedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('joinedAt')]:
                    membership.joinedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('leftAt')]:
                    membership.leftAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('deletedAt')]:
                    membership.deletedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('createdAt')]:
                    membership.createdAt.toISOString(),
                [this.membershipConfigHelper.getColumnName('updatedAt')]:
                    membership.updatedAt.toISOString()
            };

            // Add custom fields using helper (uses namingStrategy + customMapper)
            const customFields = this.membershipConfigHelper.customFieldsToDb(membership as any);
            Object.assign(columns, customFields);

            await this.sql`
                INSERT INTO ${this.sql(tableName)} ${this.sql(columns)}
            `;
        } catch (error: any) {
            throw new Error(`Failed to save organization membership: ${error.message}`);
        }
    }

    /**
     * Update a organization membership (no upsert)
     * @param membership The membership entity to update
     * @param context Optional operation context for audit logging
     */
    async update(membership: OrganizationMembership, _context?: OperationContext): Promise<void> {
        try {
            // Build columns with mapped column names
            const columns: Record<string, any> = {
                [this.membershipConfigHelper.getColumnName('id')]: membership.id,
                [this.membershipConfigHelper.getColumnName('userId')]: membership.userId,
                [this.membershipConfigHelper.getColumnName('username')]: membership.username,
                [this.membershipConfigHelper.getColumnName('organizationId')]:
                    membership.organizationId,
                [this.membershipConfigHelper.getColumnName('roleCode')]: membership.roleCode,
                [this.membershipConfigHelper.getColumnName('invitedAt')]:
                    membership.invitedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('joinedAt')]:
                    membership.joinedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('leftAt')]:
                    membership.leftAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('deletedAt')]:
                    membership.deletedAt?.toISOString() ?? null,
                [this.membershipConfigHelper.getColumnName('createdAt')]:
                    membership.createdAt.toISOString(),
                [this.membershipConfigHelper.getColumnName('updatedAt')]:
                    membership.updatedAt.toISOString()
            };

            // Add custom fields using helper (uses namingStrategy + customMapper)
            const rawCustom = this.membershipConfigHelper.customFieldsToDb(membership as any) || {};
            const cleanCustom = Object.fromEntries(
                Object.entries(rawCustom).filter(([, v]) => v !== undefined)
            );
            Object.assign(columns, cleanCustom);

            // Validate presence of ID
            const idCol = this.membershipConfigHelper.getColumnName('id');
            const idVal = columns[idCol];
            if (idVal === undefined || idVal === null) {
                throw new Error('Missing membership id for update');
            }

            // By design, do not update immutable columns (id, userId, organizationId, createdAt)
            const immutable = new Set<string>([
                idCol,
                this.membershipConfigHelper.getColumnName('userId'),
                this.membershipConfigHelper.getColumnName('organizationId'),
                this.membershipConfigHelper.getColumnName('createdAt')
            ]);

            // Build SET payload: drop immutable keys and any undefined values
            const setColumns = Object.fromEntries(
                Object.entries(columns).filter(([k, v]) => !immutable.has(k) && v !== undefined)
            );

            // Nothing to update -> exit early
            if (Object.keys(setColumns).length === 0) return;

            // Plain UPDATE (no upsert)
            const tableName = this.getQualifiedTableName(this.tableName);
            await this.sql`
                UPDATE ${this.sql(tableName)}
                SET ${this.sql(setColumns)}
                WHERE ${this.sql(idCol)} = ${idVal}
            `;
        } catch (error: any) {
            throw new Error(`Failed to update organization membership: ${error.message}`);
        }
    }

    /**
     * Find a organization membership by its ID
     */
    async findById(
        id: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const idColumn = this.membershipConfigHelper.getColumnName('id');
            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                WHERE ${this.sql(idColumn)} = ${id}
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            return OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
                rows[0],
                this.membershipConfigHelper.columnMap,
                this.membershipConfigHelper.hasCustomFields
                    ? (dbRow) => this.membershipConfigHelper.customFieldsToDomain(dbRow)
                    : undefined
            );
        } catch (error: any) {
            throw new Error(`Failed to find organization membership by ID: ${error.message}`);
        }
    }

    /**
     * Find a organization membership by user and organization
     */
    async findByUserIdAndOrganizationId(
        userId: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const userIdColumn = this.membershipConfigHelper.getColumnName('userId');
            const organizationIdColumn =
                this.membershipConfigHelper.getColumnName('organizationId');

            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                WHERE ${this.sql(userIdColumn)} = ${userId} AND ${this.sql(organizationIdColumn)} = ${organizationId}
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            const result =
                OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
                    rows[0],
                    this.membershipConfigHelper.columnMap,
                    this.membershipConfigHelper.hasCustomFields
                        ? (dbRow) => this.membershipConfigHelper.customFieldsToDomain(dbRow)
                        : undefined
                );

            return result;
        } catch (error: any) {
            throw new Error(
                `Failed to find organization membership by user and organization: ${error.message}`
            );
        }
    }

    /**
     * Find a organization membership by username and organization
     */
    async findByUsernameAndOrganizationId(
        username: string,
        organizationId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields) | null> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const usernameColumn = this.membershipConfigHelper.getColumnName('username');
            const organizationIdColumn =
                this.membershipConfigHelper.getColumnName('organizationId');

            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                WHERE ${this.sql(usernameColumn)} = ${username} AND ${this.sql(organizationIdColumn)} = ${organizationId}
                LIMIT 1
            `;

            if (rows.length === 0) {
                return null;
            }

            const result =
                OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
                    rows[0],
                    this.membershipConfigHelper.columnMap,
                    this.membershipConfigHelper.hasCustomFields
                        ? (dbRow) => this.membershipConfigHelper.customFieldsToDomain(dbRow)
                        : undefined
                );

            return result;
        } catch (error: any) {
            throw new Error(
                `Failed to find organization membership by username and organization: ${error.message}`
            );
        }
    }

    /**
     * Find all organization memberships for a specific organization
     */
    async findByOrganization(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        try {
            let query: postgres.PendingQuery<postgres.Row[]>;

            const tableName = this.getQualifiedTableName(this.tableName);
            const organizationIdColumn =
                this.membershipConfigHelper.getColumnName('organizationId');
            const joinedAtColumn = this.membershipConfigHelper.getColumnName('joinedAt');
            const leftAtColumn = this.membershipConfigHelper.getColumnName('leftAt');
            const deletedAtColumn = this.membershipConfigHelper.getColumnName('deletedAt');
            const createdAtColumn = this.membershipConfigHelper.getColumnName('createdAt');

            if (activeOnly) {
                query = this.sql`
                    SELECT * FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    AND ${this.sql(joinedAtColumn)} IS NOT NULL
                    AND ${this.sql(leftAtColumn)} IS NULL
                    AND ${this.sql(deletedAtColumn)} IS NULL
                    ORDER BY ${this.sql(createdAtColumn)} ASC
                `;
            } else {
                query = this.sql`
                    SELECT * FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    ORDER BY ${this.sql(createdAtColumn)} ASC
                `;
            }

            const rows = await query;
            return OrganizationMembershipMapper.toDomainArrayWithCustom<TOrganizationMembershipCustomFields>(
                rows,
                this.membershipConfigHelper.columnMap,
                this.membershipConfigHelper.customMapper?.toDomain
            );
        } catch (error: any) {
            throw new Error(
                `Failed to find organization memberships by organization: ${error.message}`
            );
        }
    }

    /**
     * Find organization memberships with user and organization information (for display purposes)
     * Returns flat structure with membership fields at root level plus nested user and organization objects
     */
    async findByOrganizationWithUserInfo(
        organizationId: string,
        activeOnly?: boolean
    ): Promise<
        OrganizationMemberWithUserInfo<
            TUserCustomFields,
            TOrganizationCustomFields,
            TOrganizationMembershipCustomFields
        >[]
    > {
        try {
            let query: postgres.PendingQuery<postgres.Row[]>;

            const membershipTable = this.getQualifiedTableName(this.tableName);
            const usersTable = this.getQualifiedUsersTableName(this.usersTableName);
            const organizationsTable = this.getQualifiedOrganizationsTableName(
                this.organizationsTableName
            );

            // Get column names from config helpers
            const membershipUserIdCol = this.membershipConfigHelper.getColumnName('userId');
            const membershipOrgIdCol = this.membershipConfigHelper.getColumnName('organizationId');
            const membershipJoinedAtCol = this.membershipConfigHelper.getColumnName('joinedAt');
            const membershipLeftAtCol = this.membershipConfigHelper.getColumnName('leftAt');
            const membershipDeletedAtCol = this.membershipConfigHelper.getColumnName('deletedAt');
            const membershipCreatedAtCol = this.membershipConfigHelper.getColumnName('createdAt');
            const userIdCol = this.userConfigHelper.getColumnName('id');
            const orgIdCol = this.organizationConfigHelper.getColumnName('id');

            // Use SELECT * with table aliases to capture all fields including custom fields
            // This approach is simple and automatically includes any custom columns
            // without needing to know them in advance
            if (activeOnly) {
                query = this.sql`
                    SELECT
                        to_jsonb(tm.*) as membership_data,
                        to_jsonb(u.*) as user_data,
                        to_jsonb(t.*) as organization_data
                    FROM ${this.sql(membershipTable)} tm
                    JOIN ${this.sql(usersTable)} u ON tm.${this.sql(membershipUserIdCol)} = u.${this.sql(userIdCol)}
                    JOIN ${this.sql(organizationsTable)} t ON tm.${this.sql(membershipOrgIdCol)} = t.${this.sql(orgIdCol)}
                    WHERE tm.${this.sql(membershipOrgIdCol)} = ${organizationId}
                    AND tm.${this.sql(membershipJoinedAtCol)} IS NOT NULL
                    AND tm.${this.sql(membershipLeftAtCol)} IS NULL
                    AND tm.${this.sql(membershipDeletedAtCol)} IS NULL
                    ORDER BY tm.${this.sql(membershipCreatedAtCol)} ASC
                `;
            } else {
                query = this.sql`
                    SELECT
                        to_jsonb(tm.*) as membership_data,
                        to_jsonb(u.*) as user_data,
                        to_jsonb(t.*) as organization_data
                    FROM ${this.sql(membershipTable)} tm
                    JOIN ${this.sql(usersTable)} u ON tm.${this.sql(membershipUserIdCol)} = u.${this.sql(userIdCol)}
                    JOIN ${this.sql(organizationsTable)} t ON tm.${this.sql(membershipOrgIdCol)} = t.${this.sql(orgIdCol)}
                    WHERE tm.${this.sql(membershipOrgIdCol)} = ${organizationId}
                    ORDER BY tm.${this.sql(membershipCreatedAtCol)} ASC
                `;
            }

            const rows = await query;

            return rows.map((row: any) => {
                // PostgreSQL to_jsonb returns complete row data including custom fields
                const membershipData = row.membership_data;
                const userData = row.user_data;
                const organizationData = row.organization_data;

                // Map each entity with its custom fields
                const membership =
                    OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
                        membershipData,
                        this.membershipConfigHelper.columnMap,
                        this.membershipConfigHelper.hasCustomFields
                            ? (dbRow) => this.membershipConfigHelper.customFieldsToDomain(dbRow)
                            : undefined
                    );

                const user = UserMapper.toDomainWithCustom<TUserCustomFields>(
                    userData,
                    this.userConfigHelper.columnMap,
                    this.userConfigHelper.hasCustomFields
                        ? (dbRow) => this.userConfigHelper.customFieldsToDomain(dbRow)
                        : undefined
                );

                const organization =
                    OrganizationMapper.toDomainWithCustom<TOrganizationCustomFields>(
                        organizationData,
                        this.organizationConfigHelper.columnMap,
                        this.organizationConfigHelper.hasCustomFields
                            ? (dbRow) => this.organizationConfigHelper.customFieldsToDomain(dbRow)
                            : undefined
                    );

                if (!membership || !user || !organization) {
                    throw new Error(`Failed to map data for membership ID: ${membershipData.id}`);
                }

                // Return flat structure: spread membership fields at root, add user and organization as nested objects
                return {
                    ...membership,
                    user,
                    organization
                } as OrganizationMemberWithUserInfo<
                    TUserCustomFields,
                    TOrganizationCustomFields,
                    TOrganizationMembershipCustomFields
                >;
            });
        } catch (error: any) {
            throw new Error(
                `Failed to find organization memberships with user and organization info: ${error.message}`
            );
        }
    }

    /**
     * Find organization memberships with user and organization information with pagination
     * Returns paginated result with total count
     */
    async findByOrganizationWithUserInfoPaginated(
        organizationId: string,
        options?: FindMembersOptions
    ): Promise<
        PaginatedResult<
            OrganizationMemberWithUserInfo<
                TUserCustomFields,
                TOrganizationCustomFields,
                TOrganizationMembershipCustomFields
            >
        >
    > {
        try {
            // Set defaults
            const page = options?.page || 1;
            const pageSize = options?.pageSize || 20;
            const offset = (page - 1) * pageSize;

            const membershipTable = this.getQualifiedTableName(this.tableName);
            const usersTable = this.getQualifiedUsersTableName(this.usersTableName);
            const organizationsTable = this.getQualifiedOrganizationsTableName(
                this.organizationsTableName
            );

            // Get column names from config helpers
            const membershipUserIdCol = this.membershipConfigHelper.getColumnName('userId');
            const membershipOrgIdCol = this.membershipConfigHelper.getColumnName('organizationId');
            const membershipInvitedAtCol = this.membershipConfigHelper.getColumnName('invitedAt');
            const membershipJoinedAtCol = this.membershipConfigHelper.getColumnName('joinedAt');
            const membershipLeftAtCol = this.membershipConfigHelper.getColumnName('leftAt');
            const membershipDeletedAtCol = this.membershipConfigHelper.getColumnName('deletedAt');
            const membershipCreatedAtCol = this.membershipConfigHelper.getColumnName('createdAt');
            const userIdCol = this.userConfigHelper.getColumnName('id');
            const orgIdCol = this.organizationConfigHelper.getColumnName('id');

            // Build WHERE clause conditions
            const whereConditions = [
                this.sql`tm.${this.sql(membershipOrgIdCol)} = ${organizationId}`
            ];

            // Handle filter options
            const includeActive = options?.includeActive ?? false;
            const includePending = options?.includePending ?? false;
            const includeRemoved = options?.includeRemoved ?? false;

            // Build combinable filter conditions
            if (includeActive || includePending || includeRemoved) {
                const statusConditions = [];

                // Active members: joinedAt NOT NULL, leftAt NULL, deletedAt NULL
                if (includeActive) {
                    statusConditions.push(this.sql`(
                        tm.${this.sql(membershipJoinedAtCol)} IS NOT NULL
                        AND tm.${this.sql(membershipLeftAtCol)} IS NULL
                        AND tm.${this.sql(membershipDeletedAtCol)} IS NULL
                    )`);
                }

                // Pending invitations: invitedAt NOT NULL, joinedAt NULL, leftAt NULL, deletedAt NULL
                if (includePending) {
                    statusConditions.push(this.sql`(
                        tm.${this.sql(membershipInvitedAtCol)} IS NOT NULL
                        AND tm.${this.sql(membershipJoinedAtCol)} IS NULL
                        AND tm.${this.sql(membershipLeftAtCol)} IS NULL
                        AND tm.${this.sql(membershipDeletedAtCol)} IS NULL
                    )`);
                }

                // Removed members: leftAt NOT NULL OR deletedAt NOT NULL
                if (includeRemoved) {
                    statusConditions.push(this.sql`(
                        tm.${this.sql(membershipLeftAtCol)} IS NOT NULL
                        OR tm.${this.sql(membershipDeletedAtCol)} IS NOT NULL
                    )`);
                }

                // Combine status conditions with OR
                if (statusConditions.length > 0) {
                    const statusCombined = statusConditions.reduce((acc, condition, index) =>
                        index === 0 ? condition : this.sql`${acc} OR ${condition}`
                    );
                    whereConditions.push(statusCombined);
                }
            }

            // Combine WHERE conditions
            const whereCombined = whereConditions.reduce((acc, condition, index) =>
                index === 0 ? condition : this.sql`${acc} AND (${condition})`
            );

            // Count total matching rows
            const countQuery = this.sql`
                SELECT COUNT(*)::int as total
                FROM ${this.sql(membershipTable)} tm
                WHERE ${whereCombined}
            `;

            const countResult = await countQuery;
            const total = countResult[0]?.total || 0;

            // Get paginated data
            // Note: LEFT JOIN on users because pending invitations may not have userId yet
            const dataQuery = this.sql`
                SELECT
                    to_jsonb(tm.*) as membership_data,
                    to_jsonb(u.*) as user_data,
                    to_jsonb(t.*) as organization_data
                FROM ${this.sql(membershipTable)} tm
                LEFT JOIN ${this.sql(usersTable)} u ON tm.${this.sql(membershipUserIdCol)} = u.${this.sql(userIdCol)}
                JOIN ${this.sql(organizationsTable)} t ON tm.${this.sql(membershipOrgIdCol)} = t.${this.sql(orgIdCol)}
                WHERE ${whereCombined}
                ORDER BY tm.${this.sql(membershipCreatedAtCol)} ASC
                LIMIT ${pageSize}
                OFFSET ${offset}
            `;

            const rows = await dataQuery;

            const items = rows.map((row: any) => {
                const membershipData = row.membership_data;
                const userData = row.user_data;
                const organizationData = row.organization_data;

                const membership =
                    OrganizationMembershipMapper.toDomainWithCustom<TOrganizationMembershipCustomFields>(
                        membershipData,
                        this.membershipConfigHelper.columnMap,
                        this.membershipConfigHelper.hasCustomFields
                            ? (dbRow) => this.membershipConfigHelper.customFieldsToDomain(dbRow)
                            : undefined
                    );

                if (!membership) {
                    throw new Error(`Failed to map membership data for ID: ${membershipData.id}`);
                }

                // For pending invitations without userId, create a minimal user object with username
                const user = userData
                    ? UserMapper.toDomainWithCustom<TUserCustomFields>(
                          userData,
                          this.userConfigHelper.columnMap,
                          this.userConfigHelper.hasCustomFields
                              ? (dbRow) => this.userConfigHelper.customFieldsToDomain(dbRow)
                              : undefined
                      )
                    : null;

                const organization =
                    OrganizationMapper.toDomainWithCustom<TOrganizationCustomFields>(
                        organizationData,
                        this.organizationConfigHelper.columnMap,
                        this.organizationConfigHelper.hasCustomFields
                            ? (dbRow) => this.organizationConfigHelper.customFieldsToDomain(dbRow)
                            : undefined
                    );

                if (!organization) {
                    throw new Error(`Failed to map data for membership ID: ${membershipData.id}`);
                }

                return {
                    ...membership,
                    user,
                    organization
                } as OrganizationMemberWithUserInfo<
                    TUserCustomFields,
                    TOrganizationCustomFields,
                    TOrganizationMembershipCustomFields
                >;
            });

            const totalPages = Math.ceil(total / pageSize);

            return {
                items,
                total,
                page,
                pageSize,
                totalPages
            };
        } catch (error: any) {
            throw new Error(`Failed to find paginated organization memberships: ${error.message}`);
        }
    }

    /**
     * Find all organization memberships for a specific user
     */
    async findByUser(
        userId: string
    ): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const userIdColumn = this.membershipConfigHelper.getColumnName('userId');
            const createdAtColumn = this.membershipConfigHelper.getColumnName('createdAt');
            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                WHERE ${this.sql(userIdColumn)} = ${userId}
                ORDER BY ${this.sql(createdAtColumn)} DESC
            `;

            const result =
                OrganizationMembershipMapper.toDomainArrayWithCustom<TOrganizationMembershipCustomFields>(
                    rows,
                    this.membershipConfigHelper.columnMap,
                    this.membershipConfigHelper.customMapper?.toDomain
                );
            return result;
        } catch (error: any) {
            throw new Error(`Failed to find organization memberships by user: ${error.message}`);
        }
    }

    /**
     * Delete a organization membership by ID
     * @param id The membership ID to delete
     * @param context Optional operation context for audit logging
     */
    async delete(id: string, _context?: OperationContext): Promise<void> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const idColumn = this.membershipConfigHelper.getColumnName('id');
            await this.sql`
                DELETE FROM ${this.sql(tableName)}
                WHERE ${this.sql(idColumn)} = ${id}
            `;
        } catch (error: any) {
            throw new Error(`Failed to delete organization membership: ${error.message}`);
        }
    }

    /**
     * Find all organization memberships (for admin purposes)
     */
    async findAll(): Promise<(OrganizationMembership & TOrganizationMembershipCustomFields)[]> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const createdAtColumn = this.membershipConfigHelper.getColumnName('createdAt');
            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                ORDER BY ${this.sql(createdAtColumn)} DESC
            `;

            return OrganizationMembershipMapper.toDomainArrayWithCustom<TOrganizationMembershipCustomFields>(
                rows,
                this.membershipConfigHelper.columnMap,
                this.membershipConfigHelper.customMapper?.toDomain
            );
        } catch (error: any) {
            throw new Error(`Failed to find all organization memberships: ${error.message}`);
        }
    }

    /**
     * Find active memberships for a user (convenience method)
     */
    async findActiveByUser(userId: string): Promise<OrganizationMembership[]> {
        try {
            const tableName = this.getQualifiedTableName(this.tableName);
            const userIdColumn = this.membershipConfigHelper.getColumnName('userId');
            const createdAtColumn = this.membershipConfigHelper.getColumnName('createdAt');
            const rows = await this.sql`
                SELECT * FROM ${this.sql(tableName)}
                WHERE ${this.sql(userIdColumn)} = ${userId} AND status = 'active'
                ORDER BY ${this.sql(createdAtColumn)} DESC
            `;

            return OrganizationMembershipMapper.toDomainArrayWithCustom(
                rows,
                this.membershipConfigHelper.columnMap,
                undefined // No custom fields in this method
            );
        } catch (error: any) {
            throw new Error(`Failed to find active memberships by user: ${error.message}`);
        }
    }

    /**
     * Count memberships by organization and status
     */
    async countByOrganizationAndStatus(
        organizationId: string,
        status?: 'active' | 'invited' | 'left'
    ): Promise<number> {
        try {
            let query: postgres.PendingQuery<postgres.Row[]>;

            const tableName = this.getQualifiedTableName(this.tableName);
            const organizationIdColumn =
                this.membershipConfigHelper.getColumnName('organizationId');
            const joinedAtColumn = this.membershipConfigHelper.getColumnName('joinedAt');
            const leftAtColumn = this.membershipConfigHelper.getColumnName('leftAt');
            const deletedAtColumn = this.membershipConfigHelper.getColumnName('deletedAt');
            const invitedAtColumn = this.membershipConfigHelper.getColumnName('invitedAt');

            if (status === 'active') {
                query = this.sql`
                    SELECT COUNT(*) as count FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    AND ${this.sql(joinedAtColumn)} IS NOT NULL
                    AND ${this.sql(leftAtColumn)} IS NULL
                    AND ${this.sql(deletedAtColumn)} IS NULL
                `;
            } else if (status === 'invited') {
                query = this.sql`
                    SELECT COUNT(*) as count FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    AND ${this.sql(invitedAtColumn)} IS NOT NULL
                    AND ${this.sql(joinedAtColumn)} IS NULL
                    AND ${this.sql(deletedAtColumn)} IS NULL
                `;
            } else if (status === 'left') {
                query = this.sql`
                    SELECT COUNT(*) as count FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    AND ${this.sql(leftAtColumn)} IS NOT NULL
                    AND ${this.sql(deletedAtColumn)} IS NULL
                `;
            } else {
                query = this.sql`
                    SELECT COUNT(*) as count FROM ${this.sql(tableName)}
                    WHERE ${this.sql(organizationIdColumn)} = ${organizationId}
                    AND ${this.sql(deletedAtColumn)} IS NULL
                `;
            }

            const rows = await query;
            return parseInt(rows[0]?.count || '0', 10);
        } catch (error: any) {
            throw new Error(
                `Failed to count memberships by organization and status: ${error.message}`
            );
        }
    }
}
