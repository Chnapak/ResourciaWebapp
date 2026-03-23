using Microsoft.EntityFrameworkCore.Migrations;
using NodaTime;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class FilterDefinitonsExpanded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Instant>(
                name: "CreatedAt",
                table: "FilterDefinitions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: NodaTime.Instant.FromUnixTimeTicks(0L));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "FilterDefinitions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Instant>(
                name: "DeletedAt",
                table: "FilterDefinitions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "FilterDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Instant>(
                name: "ModifiedAt",
                table: "FilterDefinitions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: NodaTime.Instant.FromUnixTimeTicks(0L));

            migrationBuilder.AddColumn<string>(
                name: "ModifiedBy",
                table: "FilterDefinitions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "FilterDefinitions");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "FilterDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "FilterDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "FilterDefinitions");

            migrationBuilder.DropColumn(
                name: "ModifiedAt",
                table: "FilterDefinitions");

            migrationBuilder.DropColumn(
                name: "ModifiedBy",
                table: "FilterDefinitions");
        }
    }
}
