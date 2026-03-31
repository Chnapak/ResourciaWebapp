using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class RedesignResourceFilterValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ResourceFilterValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilterDefinitionsId = table.Column<Guid>(type: "uuid", nullable: false),
                    FacetValuesId = table.Column<Guid>(type: "uuid", nullable: true),
                    StringValue = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    NumberValue = table.Column<double>(type: "double precision", nullable: true),
                    BooleanValue = table.Column<bool>(type: "boolean", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceFilterValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResourceFilterValues_FacetValues_FacetValuesId",
                        column: x => x.FacetValuesId,
                        principalTable: "FacetValues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ResourceFilterValues_FilterDefinitions_FilterDefinitionsId",
                        column: x => x.FilterDefinitionsId,
                        principalTable: "FilterDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResourceFilterValues_Resources_ResourceId",
                        column: x => x.ResourceId,
                        principalTable: "Resources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResourceFilterValues_FacetValuesId",
                table: "ResourceFilterValues",
                column: "FacetValuesId");

            migrationBuilder.CreateIndex(
                name: "IX_ResourceFilterValues_FilterDefinitionsId",
                table: "ResourceFilterValues",
                column: "FilterDefinitionsId");

            migrationBuilder.Sql("""
                INSERT INTO "ResourceFilterValues" (
                    "Id",
                    "ResourceId",
                    "FilterDefinitionsId",
                    "FacetValuesId",
                    "StringValue",
                    "NumberValue",
                    "BooleanValue")
                SELECT
                    md5("ResourceFacetValues"."ResourceId"::text || ':' || "ResourceFacetValues"."FacetValuesId"::text)::uuid,
                    "ResourceFacetValues"."ResourceId",
                    "FacetValues"."FilterDefinitionsId",
                    "ResourceFacetValues"."FacetValuesId",
                    NULL,
                    NULL,
                    NULL
                FROM "ResourceFacetValues"
                INNER JOIN "FacetValues"
                    ON "FacetValues"."Id" = "ResourceFacetValues"."FacetValuesId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ResourceFilterValues_ResourceId_FilterDefinitionsId",
                table: "ResourceFilterValues",
                columns: new[] { "ResourceId", "FilterDefinitionsId" });

            migrationBuilder.DropTable(
                name: "ResourceFacetValues");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ResourceFacetValues",
                columns: table => new
                {
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FacetValuesId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceFacetValues", x => new { x.ResourceId, x.FacetValuesId });
                    table.ForeignKey(
                        name: "FK_ResourceFacetValues_FacetValues_FacetValuesId",
                        column: x => x.FacetValuesId,
                        principalTable: "FacetValues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResourceFacetValues_Resources_ResourceId",
                        column: x => x.ResourceId,
                        principalTable: "Resources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResourceFacetValues_FacetValuesId",
                table: "ResourceFacetValues",
                column: "FacetValuesId");

            migrationBuilder.Sql("""
                INSERT INTO "ResourceFacetValues" (
                    "ResourceId",
                    "FacetValuesId")
                SELECT DISTINCT
                    "ResourceId",
                    "FacetValuesId"
                FROM "ResourceFilterValues"
                WHERE "FacetValuesId" IS NOT NULL;
                """);

            migrationBuilder.DropTable(
                name: "ResourceFilterValues");
        }
    }
}
