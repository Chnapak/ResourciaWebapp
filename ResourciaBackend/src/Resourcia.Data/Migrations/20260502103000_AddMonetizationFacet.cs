using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMonetizationFacet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "FilterDefinitions" (
                    "Id",
                    "Key",
                    "Label",
                    "Description",
                    "Kind",
                    "IsMulti",
                    "IsActive",
                    "SortOrder",
                    "ResourceField",
                    "CreatedAt",
                    "CreatedBy",
                    "ModifiedAt",
                    "ModifiedBy",
                    "DeletedAt",
                    "DeletedBy")
                VALUES (
                    '82000000-0000-0000-0000-000000000001',
                    'monetization',
                    'Monetization',
                    'How the resource is paid for or accessed.',
                    0,
                    false,
                    true,
                    3,
                    NULL,
                    CURRENT_TIMESTAMP,
                    'system',
                    NULL,
                    NULL,
                    NULL,
                    NULL)
                ON CONFLICT ("Key") DO UPDATE
                SET
                    "Label" = EXCLUDED."Label",
                    "Description" = EXCLUDED."Description",
                    "Kind" = EXCLUDED."Kind",
                    "IsMulti" = EXCLUDED."IsMulti",
                    "IsActive" = true,
                    "SortOrder" = EXCLUDED."SortOrder",
                    "ResourceField" = NULL,
                    "ModifiedAt" = CURRENT_TIMESTAMP,
                    "ModifiedBy" = 'system',
                    "DeletedAt" = NULL,
                    "DeletedBy" = NULL;

                WITH monetization AS (
                    SELECT "Id"
                    FROM "FilterDefinitions"
                    WHERE "Key" = 'monetization'
                ),
                facet_seed("Id", "Value", "Label", "IsActive", "SortOrder") AS (
                    VALUES
                        ('82000000-0000-0000-0000-000000000101'::uuid, 'free', 'Free', true, 1),
                        ('82000000-0000-0000-0000-000000000102'::uuid, 'freemium', 'Freemium', true, 2),
                        ('82000000-0000-0000-0000-000000000103'::uuid, 'free-trial', 'Free trial', true, 3),
                        ('82000000-0000-0000-0000-000000000104'::uuid, 'subscription', 'Subscription', true, 4),
                        ('82000000-0000-0000-0000-000000000105'::uuid, 'one-time-purchase', 'One-time purchase', true, 5),
                        ('82000000-0000-0000-0000-000000000106'::uuid, 'open-source', 'Open source', true, 6),
                        ('82000000-0000-0000-0000-000000000107'::uuid, 'unknown', 'Unknown', true, 99)
                )
                INSERT INTO "FacetValues" (
                    "Id",
                    "FilterDefinitionsId",
                    "Value",
                    "Label",
                    "IsActive",
                    "SortOrder")
                SELECT
                    facet_seed."Id",
                    monetization."Id",
                    facet_seed."Value",
                    facet_seed."Label",
                    facet_seed."IsActive",
                    facet_seed."SortOrder"
                FROM facet_seed
                CROSS JOIN monetization
                ON CONFLICT ("FilterDefinitionsId", "Value") DO UPDATE
                SET
                    "Label" = EXCLUDED."Label",
                    "IsActive" = EXCLUDED."IsActive",
                    "SortOrder" = EXCLUDED."SortOrder";

                UPDATE "FilterDefinitions"
                SET
                    "IsActive" = false,
                    "ModifiedAt" = CURRENT_TIMESTAMP,
                    "ModifiedBy" = 'system'
                WHERE lower("Key") = 'isfree';

                INSERT INTO "ResourceFilterValues" (
                    "Id",
                    "ResourceId",
                    "FilterDefinitionsId",
                    "FacetValuesId",
                    "StringValue",
                    "NumberValue",
                    "BooleanValue")
                SELECT
                    md5(resource."Id"::text || ':monetization')::uuid,
                    resource."Id",
                    monetization."Id",
                    CASE
                        WHEN resource."IsFree" THEN free_value."Id"
                        ELSE unknown_value."Id"
                    END,
                    NULL,
                    NULL,
                    NULL
                FROM "Resources" resource
                INNER JOIN "FilterDefinitions" monetization
                    ON monetization."Key" = 'monetization'
                INNER JOIN "FacetValues" free_value
                    ON free_value."FilterDefinitionsId" = monetization."Id"
                    AND free_value."Value" = 'free'
                INNER JOIN "FacetValues" unknown_value
                    ON unknown_value."FilterDefinitionsId" = monetization."Id"
                    AND unknown_value."Value" = 'unknown'
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM "ResourceFilterValues" existing
                    WHERE existing."ResourceId" = resource."Id"
                      AND existing."FilterDefinitionsId" = monetization."Id"
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "ResourceFilterValues"
                WHERE "FilterDefinitionsId" IN (
                    SELECT "Id"
                    FROM "FilterDefinitions"
                    WHERE "Key" = 'monetization'
                );

                DELETE FROM "FacetValues"
                WHERE "FilterDefinitionsId" IN (
                    SELECT "Id"
                    FROM "FilterDefinitions"
                    WHERE "Key" = 'monetization'
                );

                DELETE FROM "FilterDefinitions"
                WHERE "Key" = 'monetization';

                UPDATE "FilterDefinitions"
                SET
                    "IsActive" = true,
                    "ModifiedAt" = CURRENT_TIMESTAMP,
                    "ModifiedBy" = 'system'
                WHERE lower("Key") = 'isfree';
                """);
        }
    }
}
