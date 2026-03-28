using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class imagessoftdelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ResourceImages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "ResourceImages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ResourceImages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UploadedByUserId",
                table: "ResourceImages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ResourceImages");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ResourceImages");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ResourceImages");

            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "ResourceImages");
        }
    }
}
