using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class Fixedwhatever : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ResourceRatings",
                columns: table => new
                {
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    AverageRating = table.Column<float>(type: "real", nullable: false),
                    TotalCount = table.Column<int>(type: "integer", nullable: false),
                    Count1 = table.Column<int>(type: "integer", nullable: false),
                    Count2 = table.Column<int>(type: "integer", nullable: false),
                    Count3 = table.Column<int>(type: "integer", nullable: false),
                    Count4 = table.Column<int>(type: "integer", nullable: false),
                    Count5 = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceRatings", x => x.ResourceId);
                    table.ForeignKey(
                        name: "FK_ResourceRatings_Resources_ResourceId",
                        column: x => x.ResourceId,
                        principalTable: "Resources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ResourceRatings");
        }
    }
}
