using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuickFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ResourceFacetValues_FacetValuesId_ResourceId",
                table: "ResourceFacetValues");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ResourceFacetValues_FacetValuesId_ResourceId",
                table: "ResourceFacetValues",
                columns: new[] { "FacetValuesId", "ResourceId" });
        }
    }
}
