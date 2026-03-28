using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReviewtoUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ResourceReviews_UserId",
                table: "ResourceReviews",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ResourceReviews_AspNetUsers_UserId",
                table: "ResourceReviews",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ResourceReviews_AspNetUsers_UserId",
                table: "ResourceReviews");

            migrationBuilder.DropIndex(
                name: "IX_ResourceReviews_UserId",
                table: "ResourceReviews");
        }
    }
}
