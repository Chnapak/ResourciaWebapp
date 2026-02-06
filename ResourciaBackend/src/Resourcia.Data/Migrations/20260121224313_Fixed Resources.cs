using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixedResources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ResourceFacetValues_FacetValuesId",
                table: "ResourceFacetValues",
                column: "FacetValuesId");

            migrationBuilder.AddForeignKey(
                name: "FK_ResourceFacetValues_Resources_ResourceId",
                table: "ResourceFacetValues",
                column: "ResourceId",
                principalTable: "Resources",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ResourceFacetValues_Resources_ResourceId",
                table: "ResourceFacetValues");

            migrationBuilder.DropIndex(
                name: "IX_ResourceFacetValues_FacetValuesId",
                table: "ResourceFacetValues");
        }
    }
}
