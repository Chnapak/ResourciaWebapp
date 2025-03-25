using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ResourciaApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class TopicId_Resource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TopicId",
                table: "Resources",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TopicId",
                table: "Resources");
        }
    }
}
